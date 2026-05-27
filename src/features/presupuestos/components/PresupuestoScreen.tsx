import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import { renglonesPorTipologia, Tipologia, tipologiaLabels, Renglon, SubMaterial, SubManoObra, SubEquipo, calcularAPU } from '@/data/renglones';
import { downloadCSV, exportPresupuestoPDF, fmtQ } from '@/lib/exporters';
import { BitacoraAvancePanel } from '@/components/shared/BitacoraAvancePanel';
import { Plus, Trash2, ChevronDown, ChevronRight, Download, FileText, Calculator, Search, Save, FolderOpen, AlertTriangle, CheckCircle2, Info, Users, Wrench, Package } from 'lucide-react';
import ChecklistPanel from '@/components/shared/ChecklistPanel';
import MaterialesPanel from '@/components/shared/MaterialesPanel';
import { validarFactores, sugerirFactores, detectarAnomalias } from '@/utils/validacionPresupuesto';
import { sugerirAPU } from '@/utils/predictorAPU';
import type { Suggestion } from '@/utils/predictorAPU';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

export interface MemoriaCalculo {
  veces: number;
  largo: number;
  ancho: number;
  alto: number;
  tipo: 'lineal' | 'area' | 'volumen' | 'unidades';
}

interface LineaPresupuesto extends Renglon {
  cantidad: number;
  baseTotalPersonas: number;
  memoriaCalculo?: MemoriaCalculo;
}

type TabFase = 'nuevo' | 'planeación' | 'ejecución' | 'pausa' | 'finalizado';

const faseLabels: Record<string, string> = {
  'nuevo': 'Nuevo Presupuesto',
  'planeación': 'Planeación',
  'ejecución': 'Ejecución',
  'pausa': 'Pausa',
  'finalizado': 'Finalizado',
};
const faseColors: Record<string, string> = {
  'planeación': 'bg-purple-100 text-purple-800 border-purple-300',
  'ejecución': 'bg-blue-100 text-blue-800 border-blue-300',
  'pausa': 'bg-amber-100 text-amber-800 border-amber-300',
  'finalizado': 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

function useDeepCalc(lineas: LineaPresupuesto[]) {
  return useMemo(() =>
    lineas.map(l => ({ linea: l, apu: calcularAPU(l) })),
    [lineas]
  );
}

const PresupuestoScreen: React.FC = () => {
  const { clientes, session, presupuestos, addPresupuesto, updatePresupuesto, transicionFase } = useAppContext();
  const [tabFase, setTabFase] = useState<TabFase>('nuevo');
  const [tipologia, setTipologia] = useState<Tipologia>('general');
  const [search, setSearch] = useState('');
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [faseAlGuardar, setFaseAlGuardar] = useState<'planeación' | 'ejecución'>('planeación');
  const [meta, setMeta] = useState({
    proyecto: 'Proyecto sin nombre',
    cliente: '',
    ubicacion: 'Guatemala, Guatemala',
    factorIndirectos: 12,
    factorAdministrativos: 8,
    factorImprevistos: 5,
    factorUtilidad: 15,
  });
  const [saving, setSaving] = useState(false);
  const [savedPresupuestoId, setSavedPresupuestoId] = useState<string | null>(null);
  const [confirmRemoveLinea, setConfirmRemoveLinea] = useState<string | null>(null);
  const [sugerenciasAPU, setSugerenciasAPU] = useState<Suggestion[]>([]);

  const catalogo = renglonesPorTipologia[tipologia];
  const catalogoFiltrado = catalogo.filter(r =>
    r.descripcion.toLowerCase().includes(search.toLowerCase()) ||
    r.codigo.includes(search)
  );

  const addRenglon = useCallback((r: Renglon) => {
    const baseTotalPersonas = r.subrenglones.manoObra.reduce((s, m) => s + m.cantidadPersonas, 0);
    setLineas(prev => {
      if (prev.find(l => l.id === r.id)) return prev;
      return [...prev, { ...r, cantidad: 1, baseTotalPersonas }];
    });
    setExpanded(prev => new Set(prev).add(r.id));
  }, []);

  const updateLinea = useCallback((id: string, field: keyof LineaPresupuesto, value: any) => {
    setLineas(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  }, []);

  const updateMemoriaCalculo = useCallback((id: string, memoria: Partial<MemoriaCalculo>) => {
    setLineas(prev => prev.map(l => {
      if (l.id !== id) return l;
      const mOld = l.memoriaCalculo || { veces: 1, largo: 0, ancho: 0, alto: 0, tipo: 'unidades' };
      const mNew = { ...mOld, ...memoria };
      
      let computedCantidad = l.cantidad;
      if (mNew.tipo === 'lineal') {
        computedCantidad = mNew.veces * mNew.largo;
      } else if (mNew.tipo === 'area') {
        computedCantidad = mNew.veces * mNew.largo * mNew.ancho;
      } else if (mNew.tipo === 'volumen') {
        computedCantidad = mNew.veces * mNew.largo * mNew.ancho * mNew.alto;
      } else if (mNew.tipo === 'unidades') {
        computedCantidad = mNew.veces * (mNew.largo || 1);
      }
      
      return { 
        ...l, 
        memoriaCalculo: mNew,
        cantidad: Math.round(computedCantidad * 100) / 100
      };
    }));
  }, []);

  const updateSubMaterial = useCallback((id: string, idx: number, field: keyof SubMaterial, value: number) => {
    setLineas(prev => prev.map(l => {
      if (l.id !== id) return l;
      const materiales = l.subrenglones.materiales.map((m, i) =>
        i === idx ? { ...m, [field]: value } : m
      );
      const nuevosSub = { ...l.subrenglones, materiales };
      const cm = materiales.reduce((s, m) => s + m.cantidad * (1 + (m.desperdicio ?? 0) / 100) * m.costoUnitario, 0);
      const co = nuevosSub.manoObra.reduce((s, m) => s + m.cantidadPersonas * m.jornal / l.rendimiento, 0);
      const ce = nuevosSub.equipos.reduce((s, e) => s + e.cantidad * e.costoHora, 0);
      return { ...l, subrenglones: nuevosSub, costoMaterial: Math.round(cm), costoManoObra: Math.round(co), costoHerramienta: Math.round(ce) };
    }));
  }, []);

  const updateSubMO = useCallback((id: string, idx: number, field: keyof SubManoObra, value: number) => {
    setLineas(prev => prev.map(l => {
      if (l.id !== id) return l;
      const manoObra = l.subrenglones.manoObra.map((m, i) =>
        i === idx ? { ...m, [field]: value } : m
      );
      const nuevosSub = { ...l.subrenglones, manoObra };
      const cm = nuevosSub.materiales.reduce((s, m) => s + m.cantidad * (1 + (m.desperdicio ?? 0) / 100) * m.costoUnitario, 0);
      const co = manoObra.reduce((s, m) => s + m.cantidadPersonas * m.jornal / l.rendimiento, 0);
      const ce = nuevosSub.equipos.reduce((s, e) => s + e.cantidad * e.costoHora, 0);
      return { ...l, subrenglones: nuevosSub, costoMaterial: Math.round(cm), costoManoObra: Math.round(co), costoHerramienta: Math.round(ce) };
    }));
  }, []);

  const updateSubEquipo = useCallback((id: string, idx: number, field: keyof SubEquipo, value: number) => {
    setLineas(prev => prev.map(l => {
      if (l.id !== id) return l;
      const equipos = l.subrenglones.equipos.map((e, i) =>
        i === idx ? { ...e, [field]: value } : e
      );
      const nuevosSub = { ...l.subrenglones, equipos };
      const cm = nuevosSub.materiales.reduce((s, m) => s + m.cantidad * (1 + (m.desperdicio ?? 0) / 100) * m.costoUnitario, 0);
      const co = nuevosSub.manoObra.reduce((s, m) => s + m.cantidadPersonas * m.jornal / l.rendimiento, 0);
      const ce = equipos.reduce((s, e) => s + e.cantidad * e.costoHora, 0);
      return { ...l, subrenglones: nuevosSub, costoMaterial: Math.round(cm), costoManoObra: Math.round(co), costoHerramienta: Math.round(ce) };
    }));
  }, []);

  const removeLinea = useCallback((id: string) => {
    setConfirmRemoveLinea(id);
  }, []);

  const confirmRemoveLineaAction = useCallback(() => {
    if (confirmRemoveLinea) {
      setLineas(prev => prev.filter(l => l.id !== confirmRemoveLinea));
      setConfirmRemoveLinea(null);
    }
  }, [confirmRemoveLinea]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);

  const handleMetaChange = useCallback((key: string, value: string | number) => {
    setMeta(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSugerirFactores = useCallback(() => {
    const s = sugerirFactores(tipologia);
    setMeta(m => ({ ...m, ...s }));
  }, [tipologia]);

  const calculadas = useDeepCalc(lineas);

  const totales = useMemo(() => {
    const costoDirecto = calculadas.reduce((s, c) => s + c.apu.subtotal, 0);
    const totalMaterial = calculadas.reduce((s, c) => s + c.apu.costoMaterial * c.linea.cantidad, 0);
    const totalMO = calculadas.reduce((s, c) => s + c.apu.costoManoObra * c.linea.cantidad, 0);
    const totalEquipo = calculadas.reduce((s, c) => s + c.apu.costoHerramienta * c.linea.cantidad, 0);
    const indirectos = costoDirecto * (meta.factorIndirectos / 100);
    const administrativos = costoDirecto * (meta.factorAdministrativos / 100);
    const imprevistos = costoDirecto * (meta.factorImprevistos / 100);
    const subtotal = costoDirecto + indirectos + administrativos + imprevistos;
    const utilidad = subtotal * (meta.factorUtilidad / 100);
    const total = subtotal + utilidad;
    const tiempo = calculadas.reduce((s, c) => s + c.apu.dias, 0);
    const totalPersonasDia = calculadas.reduce((s, c) => s + c.apu.totalPersonasDia, 0);
    return { calculadas, costoDirecto, totalMaterial, totalMO, totalEquipo, indirectos, administrativos, imprevistos, subtotal, utilidad, total, tiempo, totalPersonasDia };
  }, [calculadas, meta]);

  const validacion = useMemo(() => validarFactores({ ...meta, total: totales.total }), [meta, totales.total]);

  const anomalias = useMemo(() =>
    lineas.length > 0 ? detectarAnomalias(totales.costoDirecto, totales.totalMaterial, totales.totalMO, totales.totalEquipo) : [],
    [lineas, totales]
  );

  const handleSugerirAPU = useCallback(() => {
    const suggestions = sugerirAPU(presupuestos, tipologia);
    setSugerenciasAPU(suggestions);
  }, [presupuestos, tipologia]);

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['CONSTRUCTORA WM/M&S - Edificando el Futuro'],
      [`Presupuesto: ${meta.proyecto}`, `Cliente: ${meta.cliente}`, `Ubicaci\u00f3n: ${meta.ubicacion}`, `Fecha: ${new Date().toLocaleDateString('es-GT')}`],
      [],
      ['RESUMEN DE RENGLONES'],
      ['C\u00f3digo', 'Descripci\u00f3n', 'Unidad', 'Cantidad', 'Costo Unitario (Q)', 'Subtotal (Q)'],
      ...totales.calculadas.map(c => [c.linea.codigo, c.linea.descripcion, c.linea.unidad, c.linea.cantidad, Number(c.apu.costoUnitario.toFixed(2)), Number(c.apu.subtotal.toFixed(2))]),
      [],
      ['EXPLOSION DE MATERIALES UNITARIOS POR RENGLON'],
      ['Rengl\u00f3n', 'Material', 'Unidad', 'Cantidad Unitaria', 'Costo Unitario (Q)', 'Subtotal (Q)'],
      ...lineas.flatMap(l =>
        l.subrenglones.materiales.map(m => [l.codigo + ' ' + l.descripcion, m.nombre, m.unidad, m.cantidad, m.costoUnitario, Number((m.cantidad * m.costoUnitario).toFixed(2))])
      ),
      [],
      ['MANO DE OBRA POR RENGLON'],
      ['Rengl\u00f3n', 'Descripci\u00f3n', 'Personas', 'Jornal (Q/d\u00eda)', 'Costo Unitario (Q)'],
      ...lineas.flatMap(l =>
        l.subrenglones.manoObra.map(m => [l.codigo + ' ' + l.descripcion, m.descripcion, m.cantidadPersonas, m.jornal, Number((m.cantidadPersonas * m.jornal / l.rendimiento).toFixed(2))])
      ),
      [],
      ['EQUIPO POR RENGLON'],
      ['Rengl\u00f3n', 'Equipo', 'Horas', 'Costo/hora (Q)', 'Subtotal (Q)'],
      ...lineas.flatMap(l =>
        l.subrenglones.equipos.map(eq => [l.codigo + ' ' + l.descripcion, eq.descripcion, eq.cantidad, eq.costoHora, Number((eq.cantidad * eq.costoHora).toFixed(2))])
      ),
      [],
      ['RESUMEN FINANCIERO'],
      ['Costo Directo', Number(totales.costoDirecto.toFixed(2))],
      ['Total Materiales', Number(totales.totalMaterial.toFixed(2))],
      ['Total Mano de Obra', Number(totales.totalMO.toFixed(2))],
      ['Total Equipo', Number(totales.totalEquipo.toFixed(2))],
      [`Costos Indirectos (${meta.factorIndirectos}%)`, Number(totales.indirectos.toFixed(2))],
      [`Costos Administrativos (${meta.factorAdministrativos}%)`, Number(totales.administrativos.toFixed(2))],
      [`Imprevistos (${meta.factorImprevistos}%)`, Number(totales.imprevistos.toFixed(2))],
      ['Subtotal', Number(totales.subtotal.toFixed(2))],
      [`Utilidad (${meta.factorUtilidad}%)`, Number(totales.utilidad.toFixed(2))],
      ['TOTAL DEL PROYECTO', Number(totales.total.toFixed(2))],
      [`Tiempo estimado: ${totales.tiempo.toFixed(1)} d\u00edas`],
      [`Total personas-d\u00eda: ${totales.totalPersonasDia.toFixed(0)}`],
    ];
    downloadCSV(`presupuesto_${meta.proyecto.replace(/\s+/g, '_')}.csv`, rows);
  };

  const handleExportPDF = () => {
    exportPresupuestoPDF({
      proyecto: meta.proyecto,
      cliente: meta.cliente,
      ubicacion: meta.ubicacion,
      tipologia: tipologiaLabels[tipologia],
      factorIndirectos: meta.factorIndirectos,
      factorAdministrativos: meta.factorAdministrativos,
      factorImprevistos: meta.factorImprevistos,
      factorUtilidad: meta.factorUtilidad,
      lineas,
      totales: {
        costoDirecto: totales.costoDirecto,
        totalMaterial: totales.totalMaterial,
        totalMO: totales.totalMO,
        totalEquipo: totales.totalEquipo,
        indirectos: totales.indirectos,
        administrativos: totales.administrativos,
        imprevistos: totales.imprevistos,
        subtotal: totales.subtotal,
        utilidad: totales.utilidad,
        total: totales.total,
        tiempo: totales.tiempo,
        totalPersonasDia: totales.totalPersonasDia,
      },
    });
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const costoDirecto = totales.costoDirecto;
      const total = totales.total;
      const payload = {
        proyecto: meta.proyecto,
        cliente: meta.cliente,
        ubicacion: meta.ubicacion,
        tipologia,
        fase: faseAlGuardar,
        factor_indirectos: meta.factorIndirectos,
        factor_administrativos: meta.factorAdministrativos,
        factor_imprevistos: meta.factorImprevistos,
        factor_utilidad: meta.factorUtilidad,
        lineas,
        total,
        costo_directo: costoDirecto,
      };
      if (savedPresupuestoId) {
        await updatePresupuesto(savedPresupuestoId, { ...payload, updated_at: new Date().toISOString() });
      } else {
        const newId = await addPresupuesto(payload);
        if (newId) { setSavedPresupuestoId(newId); await transicionFase(newId, faseAlGuardar); }
      }
    } catch (err) {
      console.error('Error al guardar presupuesto:', err);
    } finally { setSaving(false); }
  };

  return (
    <PageShell showHome={false} title="Motor de Presupuestos APU">
      <div className="p-3 sm:p-5 max-w-[1600px] mx-auto grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-700" />Datos del Proyecto</h3>
            <div className="space-y-2">
              <input placeholder="Nombre del proyecto" value={meta.proyecto} onChange={e => setMeta({ ...meta, proyecto: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded" />
              <select value={meta.cliente} onChange={e => setMeta({ ...meta, cliente: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded bg-white">
                <option value="">-- Seleccionar cliente --</option>
                {clientes.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
              <input placeholder="Ubicación" value={meta.ubicacion} onChange={e => setMeta({ ...meta, ubicacion: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded" />
              <div>
                <label className="text-[10px] font-semibold text-slate-600">Tipología</label>
                <select value={tipologia} onChange={e => setTipologia(e.target.value as Tipologia)} className="w-full px-2 py-1.5 text-xs border rounded bg-blue-50">
                  {Object.entries(tipologiaLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                {[
                  { k: 'factorIndirectos', lbl: 'Indirectos %' },
                  { k: 'factorAdministrativos', lbl: 'Administrativos %' },
                  { k: 'factorImprevistos', lbl: 'Imprevistos %' },
                  { k: 'factorUtilidad', lbl: 'Utilidad %' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-[10px] font-semibold text-slate-600">{f.lbl}</label>
                    <input type="number" value={meta[f.k as keyof typeof meta]} onChange={e => setMeta({ ...meta, [f.k]: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 text-xs border rounded" />
                  </div>
                ))}
              </div>
              {validacion.advertencias.length > 0 && (
                <div className="mt-2 space-y-1">
                  {validacion.advertencias.map((w, i) => (
                    <div key={i} className={`flex items-start gap-1.5 text-[10px] p-1.5 rounded ${validacion.salud === 'critica' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /><span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
              {validacion.sugerencias.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {validacion.sugerencias.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] text-slate-500 p-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" /><span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
              {anomalias.length > 0 && (
                <div className="mt-2 space-y-1">
                  {anomalias.map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] p-1.5 rounded bg-red-50 text-red-700">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /><span>{a}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleSugerirFactores} className="mt-1.5 text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sugerir factores para {tipologiaLabels[tipologia]}
              </button>
              <button onClick={handleSugerirAPU} className="mt-1 text-[10px] text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1">
                <Info className="w-3 h-3" /> Sugerir APU desde hist\u00f3ricos
              </button>
              {sugerenciasAPU.length > 0 && (
                <div className="mt-2 space-y-1 p-2 bg-purple-50 border border-purple-200 rounded">
                  {sugerenciasAPU.map((s, i) => (
                    <div key={i} className="text-[10px] text-purple-800 flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" /><span>{s.mensaje}{s.confianza ? ` (confianza: ${s.confianza}%)` : ''}</span>
                    </div>
                  ))}
                  <button onClick={() => setSugerenciasAPU([])} className="text-[9px] text-purple-500 hover:underline mt-1">Cerrar sugerencias</button>
                </div>
              )}
            </div>
          
          {savedPresupuestoId && (
            <>
              <div className="bg-white rounded-xl shadow-md p-3"><ChecklistPanel presupuestoId={savedPresupuestoId} fase={faseAlGuardar} /></div>
              <MaterialesPanel presupuestoId={savedPresupuestoId} />
              <BitacoraAvancePanel presupuestoId={savedPresupuestoId} onAvanceChange={async (af) => { await updatePresupuesto(savedPresupuestoId, { avanceFisico: af }); }} />
            </>
          )}

          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2"><FolderOpen className="w-4 h-4 text-blue-700" />Presupuestos Guardados</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {(['planeación', 'ejecución', 'pausa', 'finalizado'] as const).map(f => {
                const count = presupuestos.filter(p => p.fase === f).length;
                return (
                  <button key={f} onClick={() => { setTabFase(f); setSavedPresupuestoId(null); setLineas([]); }}
                    className={`text-[10px] px-2 py-1 rounded-full border font-semibold transition ${tabFase === f ? faseColors[f] : 'bg-slate-100 text-slate-500 border-transparent'}`}>
                    {faseLabels[f]} ({count})
                  </button>
                );
              })}
            </div>
            {tabFase !== 'nuevo' && (
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {presupuestos.filter(p => p.fase === tabFase).map(p => (
                  <button key={p.id} onClick={() => {
                    setMeta(m => ({ ...m, proyecto: p.proyecto, cliente: p.cliente || '', ubicacion: p.ubicacion || '' }));
                    setTipologia((p.tipologia || 'general') as Tipologia);
                    setLineas((p.lineas as LineaPresupuesto[]) || []);
                    setSavedPresupuestoId(p.id);
                    setTabFase('nuevo');
                  }}
                    className="w-full text-left p-2 rounded text-[10px] bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition">
                    <div className="font-semibold text-slate-800 truncate">{p.proyecto}</div>
                    <div className="text-[9px] text-slate-500">{p.cliente || 'Sin cliente'} · Q {(p.total || 0).toLocaleString()}</div>
                  </button>
                ))}
                {presupuestos.filter(p => p.fase === tabFase).length === 0 && (
                  <div className="text-[10px] text-slate-400 text-center py-4">Sin presupuestos en esta fase</div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2"><Search className="w-4 h-4 text-blue-700" />Catálogo de Renglones</h3>
            <div className="text-[10px] text-slate-500 mb-2">{catalogo.length} renglones · Tipología: <strong>{tipologiaLabels[tipologia]}</strong></div>
            <input placeholder="Buscar renglón..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded mb-2" />
            <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1">
              {catalogoFiltrado.map(r => {
                const added = lineas.find(l => l.id === r.id);
                return (
                  <button key={r.id} onClick={() => addRenglon(r)} disabled={!!added}
                    className={`w-full text-left p-2 rounded text-[11px] transition ${added ? 'bg-emerald-50 text-emerald-700 cursor-not-allowed' : 'bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-transparent'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{r.codigo} · {r.descripcion}</div>
                        <div className="text-[9px] text-slate-500">{r.unidad} · Q {(r.costoMaterial + r.costoManoObra + r.costoHerramienta).toFixed(2)}</div>
                      </div>
                      {!added && <Plus className="w-3.5 h-3.5 text-blue-700" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white p-3 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-sm flex items-center gap-2"><Calculator className="w-4 h-4" />Renglones del Presupuesto ({lineas.length})</h3>
              <div className="flex gap-2 items-center">
                <select value={faseAlGuardar} onChange={e => setFaseAlGuardar(e.target.value as 'planeación' | 'ejecución')}
                  className="text-[10px] px-2 py-1 rounded bg-white/20 text-white border border-white/30 font-semibold">
                  <option value="planeación">Fase: Planeación</option>
                  <option value="ejecución">Fase: Ejecución</option>
                </select>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded text-[11px] font-semibold text-white disabled:opacity-40"><Save className="w-3 h-3" />{saving ? 'Guardando...' : 'Guardar'}</button>
                <button onClick={handleExportCSV} disabled={!lineas.length} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded text-[11px] font-semibold disabled:opacity-40"><Download className="w-3 h-3" />CSV</button>
                <button onClick={handleExportPDF} disabled={!lineas.length} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded text-[11px] font-semibold disabled:opacity-40"><FileText className="w-3 h-3" />PDF</button>
              </div>
            </div>

            {lineas.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                <Calculator className="w-12 h-12 mx-auto mb-2 opacity-30" />
                Agregue renglones desde el catálogo para iniciar el presupuesto
              </div>
            ) : (
              <div className="divide-y">
                {lineas.map(l => {
                  const calc = calculadas.find(c => c.linea.id === l.id);
                  return (
                    <RenglonCard
                      key={l.id}
                      linea={l}
                      apu={calc?.apu}
                      isOpen={expanded.has(l.id)}
                      onUpdate={updateLinea}
                      onUpdateSubMaterial={updateSubMaterial}
                      onUpdateSubMO={updateSubMO}
                      onUpdateSubEquipo={updateSubEquipo}
                      onUpdateMemoria={updateMemoriaCalculo}
                      onRemove={removeLinea}
                      onToggle={toggleExpand}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {lineas.length > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-blue-900 text-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-sm mb-3">Resumen Financiero del Presupuesto</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <Stat label="Costo Directo" value={fmtQ(totales.costoDirecto)} />
                <Stat label="Materiales" value={fmtQ(totales.totalMaterial)} />
                <Stat label="Mano de Obra" value={fmtQ(totales.totalMO)} />
                <Stat label="Equipo" value={fmtQ(totales.totalEquipo)} />
                <Stat label={`Indirectos (${meta.factorIndirectos}%)`} value={fmtQ(totales.indirectos)} />
                <Stat label={`Administrativos (${meta.factorAdministrativos}%)`} value={fmtQ(totales.administrativos)} />
                <Stat label={`Imprevistos (${meta.factorImprevistos}%)`} value={fmtQ(totales.imprevistos)} />
                <Stat label={`Utilidad (${meta.factorUtilidad}%)`} value={fmtQ(totales.utilidad)} />
                <Stat label="Tiempo Estimado" value={`${totales.tiempo.toFixed(1)} días`} />
                <Stat label="Personas-día" value={`${totales.totalPersonasDia.toFixed(0)}`} />
                <Stat label="Subtotal" value={fmtQ(totales.subtotal)} />
                <Stat label="TOTAL" value={fmtQ(totales.total)} highlight />
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmRemoveLinea !== null}
        onOpenChange={o => { if (!o) setConfirmRemoveLinea(null); }}
        onConfirm={confirmRemoveLineaAction}
        title="Eliminar renglón"
        description="Esta acción no se puede deshacer. ¿Estás seguro de eliminar este renglón del presupuesto?"
        confirmText="Aceptar"
      />
    </PageShell>
  );
};

const RenglonCard = React.memo<{
  linea: LineaPresupuesto;
  apu?: { costoMaterial: number; costoManoObra: number; costoHerramienta: number; costoUnitario: number; subtotal: number; dias: number; totalPersonasDia: number };
  isOpen: boolean;
  onUpdate: (id: string, field: keyof LineaPresupuesto, value: any) => void;
  onUpdateSubMaterial: (id: string, idx: number, field: keyof SubMaterial, value: number) => void;
  onUpdateSubMO: (id: string, idx: number, field: keyof SubManoObra, value: number) => void;
  onUpdateSubEquipo: (id: string, idx: number, field: keyof SubEquipo, value: number) => void;
  onUpdateMemoria: (id: string, memoria: Partial<MemoriaCalculo>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
}>(({ linea: l, apu, isOpen, onUpdate, onUpdateSubMaterial, onUpdateSubMO, onUpdateSubEquipo, onUpdateMemoria, onRemove, onToggle }) => {
  const [showMemoria, setShowMemoria] = useState(false);
  const costoUnit = apu?.costoUnitario ?? l.costoMaterial + l.costoManoObra + l.costoHerramienta;
  const subtotal = apu?.subtotal ?? costoUnit * l.cantidad;
  const dias = apu?.dias ?? (l.rendimiento > 0 ? l.cantidad / l.rendimiento : 0);
  const sub = l.subrenglones;
  const m = l.memoriaCalculo || { veces: 1, largo: 0, ancho: 0, alto: 0, tipo: 'unidades' };

  return (
    <div>
      <div className="flex items-center gap-2 p-3 hover:bg-slate-50">
        <button onClick={() => onToggle(l.id)} className="text-slate-500">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-800 truncate">{l.codigo} · {l.descripcion}</div>
          <div className="text-[10px] text-slate-500">{l.unidad} · {fmtQ(costoUnit)} c/u</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowMemoria(!showMemoria)}
            className={`p-1 rounded text-xs hover:bg-slate-100 ${showMemoria ? 'bg-blue-100 text-blue-800 font-bold' : 'text-slate-400'}`}
            title="Memoria de cálculo 📐"
          >
            📐
          </button>
          <input type="number" value={l.cantidad} onChange={e => onUpdate(l.id, 'cantidad', parseFloat(e.target.value) || 0)}
            className="w-20 px-2 py-1 text-xs border rounded text-right" />
        </div>
        <div className="w-24 text-right text-xs font-bold text-blue-900">{fmtQ(subtotal)}</div>
        <button onClick={() => onRemove(l.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      {showMemoria && (
        <div className="mx-3 mb-3 p-3 bg-blue-50/40 border border-blue-100 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-900 uppercase">Auxiliar de Memoria de Cálculo</span>
            <span className="text-[9px] text-slate-500 font-semibold">Cálculo en base a dimensiones</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div>
              <label className="text-[9px] text-slate-500 font-medium">Tipo de Dimensión</label>
              <select
                value={m.tipo}
                onChange={e => onUpdateMemoria(l.id, { tipo: e.target.value as any })}
                className="w-full px-1.5 py-1 text-xs border rounded bg-white"
              >
                <option value="unidades">Unidades (Veces × Cant)</option>
                <option value="lineal">Lineal (Veces × Largo)</option>
                <option value="area">Área (Largo × Ancho)</option>
                <option value="volumen">Volumen (L × A × Alto)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-slate-500 font-medium">Veces / Cant.</label>
              <input
                type="number"
                value={m.veces}
                onChange={e => onUpdateMemoria(l.id, { veces: parseFloat(e.target.value) || 0 })}
                className="w-full px-1.5 py-1 text-xs border rounded"
              />
            </div>
            {(m.tipo === 'lineal' || m.tipo === 'area' || m.tipo === 'volumen' || m.tipo === 'unidades') && (
              <div>
                <label className="text-[9px] text-slate-500 font-medium">
                  {m.tipo === 'unidades' ? 'Cantidad Unit' : 'Largo (m)'}
                </label>
                <input
                  type="number"
                  value={m.largo}
                  onChange={e => onUpdateMemoria(l.id, { largo: parseFloat(e.target.value) || 0 })}
                  className="w-full px-1.5 py-1 text-xs border rounded"
                />
              </div>
            )}
            {(m.tipo === 'area' || m.tipo === 'volumen') && (
              <div>
                <label className="text-[9px] text-slate-500 font-medium">Ancho (m)</label>
                <input
                  type="number"
                  value={m.ancho}
                  onChange={e => onUpdateMemoria(l.id, { ancho: parseFloat(e.target.value) || 0 })}
                  className="w-full px-1.5 py-1 text-xs border rounded"
                />
              </div>
            )}
            {m.tipo === 'volumen' && (
              <div>
                <label className="text-[9px] text-slate-500 font-medium">Alto / Espesor (m)</label>
                <input
                  type="number"
                  value={m.alto}
                  onChange={e => onUpdateMemoria(l.id, { alto: parseFloat(e.target.value) || 0 })}
                  className="w-full px-1.5 py-1 text-xs border rounded"
                />
              </div>
            )}
          </div>
          <div className="text-[10px] text-blue-800 bg-blue-100/50 p-1.5 rounded flex justify-between items-center">
            <span>Fórmula de Cálculo: <strong>
              {m.tipo === 'unidades' && `${m.veces} veces × ${m.largo || 1}`}
              {m.tipo === 'lineal' && `${m.veces} veces × ${m.largo}m`}
              {m.tipo === 'area' && `${m.veces} veces × (${m.largo}m × ${m.ancho}m)`}
              {m.tipo === 'volumen' && `${m.veces} veces × (${m.largo}m × ${m.ancho}m × ${m.alto}m)`}
            </strong></span>
            <span>Resultado: <strong className="text-xs">{l.cantidad.toFixed(2)}</strong> {l.unidad}</span>
          </div>
        </div>
      )}
      {isOpen && (
        <div className="bg-slate-50 p-3 border-t border-dashed space-y-3">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-3 h-3" />Análisis de Precios Unitarios (APU)
          </div>

          {sub.materiales.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-blue-800 mb-1 flex items-center gap-1"><Package className="w-3 h-3" /> Materiales</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead><tr className="text-slate-500 border-b"><th className="text-left py-0.5">Material</th><th className="text-center py-0.5">Unidad</th><th className="text-right py-0.5">Cant.</th><th className="text-right py-0.5">Q/Und</th><th className="text-right py-0.5">Desp.%</th><th className="text-right py-0.5">Subtotal</th></tr></thead>
                  <tbody>
                    {sub.materiales.map((m, i) => (
                      <tr key={i} className="border-b border-dashed border-slate-200">
                        <td className="py-0.5 text-slate-700">{m.nombre}</td>
                        <td className="py-0.5 text-center text-slate-500">{m.unidad}</td>
                        <td className="py-0.5"><input type="number" value={m.cantidad} onChange={e => onUpdateSubMaterial(l.id, i, 'cantidad', parseFloat(e.target.value) || 0)} className="w-14 px-1 py-0.5 text-xs border rounded text-right" /></td>
                        <td className="py-0.5"><input type="number" value={m.costoUnitario} onChange={e => onUpdateSubMaterial(l.id, i, 'costoUnitario', parseFloat(e.target.value) || 0)} className="w-16 px-1 py-0.5 text-xs border rounded text-right" /></td>
                        <td className="py-0.5"><input type="number" value={m.desperdicio ?? 0} onChange={e => onUpdateSubMaterial(l.id, i, 'desperdicio', parseFloat(e.target.value) || 0)} className="w-12 px-1 py-0.5 text-xs border rounded text-right" min={0} max={100} /></td>
                        <td className="py-0.5 text-right font-semibold text-slate-700">{fmtQ(m.cantidad * (1 + (m.desperdicio ?? 0) / 100) * m.costoUnitario)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="font-bold text-blue-800"><td colSpan={5} className="py-0.5 text-right">Total Material por unidad</td><td className="py-0.5 text-right">{fmtQ(apu?.costoMaterial ?? 0)}</td></tr></tfoot>
                </table>
              </div>
            </div>
          )}

          {sub.manoObra.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-emerald-800 mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Mano de Obra</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead><tr className="text-slate-500 border-b"><th className="text-left py-0.5">Cuadrilla</th><th className="text-center py-0.5">Personas</th><th className="text-right py-0.5">Jornal (Q/día)</th><th className="text-right py-0.5">Costo/día</th><th className="text-right py-0.5">Costo/und</th></tr></thead>
                  <tbody>
                    {sub.manoObra.map((m, i) => {
                      const costoPorDia = m.cantidadPersonas * m.jornal;
                      const costoPorUnd = l.rendimiento > 0 ? costoPorDia / l.rendimiento : 0;
                      return (
                        <tr key={i} className="border-b border-dashed border-slate-200">
                          <td className="py-0.5 text-slate-700">{m.descripcion}</td>
                          <td className="py-0.5"><input type="number" value={m.cantidadPersonas} onChange={e => onUpdateSubMO(l.id, i, 'cantidadPersonas', parseFloat(e.target.value) || 0)} className="w-14 px-1 py-0.5 text-xs border rounded text-center" /></td>
                          <td className="py-0.5"><input type="number" value={m.jornal} onChange={e => onUpdateSubMO(l.id, i, 'jornal', parseFloat(e.target.value) || 0)} className="w-16 px-1 py-0.5 text-xs border rounded text-right" /></td>
                          <td className="py-0.5 text-right font-semibold">{fmtQ(costoPorDia)}</td>
                          <td className="py-0.5 text-right font-semibold">{fmtQ(costoPorUnd)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold text-emerald-800">
                      <td colSpan={4} className="py-0.5 text-right">Total MO por unidad</td>
                      <td className="py-0.5 text-right">{fmtQ(apu?.costoManoObra ?? 0)}</td>
                    </tr>
                    <tr className="text-emerald-700">
                      <td colSpan={5} className="py-0.5">
                        Rendimiento: {l.rendimiento} {l.unidad}/día ·
                        {dias > 0 && <> <strong>{dias.toFixed(2)} días</strong> · {apu?.totalPersonasDia.toFixed(0) ?? '-'} personas-día
                          <span className="ml-2 text-[9px] opacity-70">(si cambia el personal, cambia el tiempo)</span></>}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {sub.equipos.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-amber-800 mb-1 flex items-center gap-1"><Wrench className="w-3 h-3" /> Equipo y Herramienta</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead><tr className="text-slate-500 border-b"><th className="text-left py-0.5">Equipo</th><th className="text-right py-0.5">Horas</th><th className="text-right py-0.5">Q/hora</th><th className="text-right py-0.5">Subtotal</th></tr></thead>
                  <tbody>
                    {sub.equipos.map((e, i) => (
                      <tr key={i} className="border-b border-dashed border-slate-200">
                        <td className="py-0.5 text-slate-700">{e.descripcion}</td>
                        <td className="py-0.5"><input type="number" value={e.cantidad} onChange={e => onUpdateSubEquipo(l.id, i, 'cantidad', parseFloat(e.target.value) || 0)} className="w-14 px-1 py-0.5 text-xs border rounded text-right" /></td>
                        <td className="py-0.5"><input type="number" value={e.costoHora} onChange={e => onUpdateSubEquipo(l.id, i, 'costoHora', parseFloat(e.target.value) || 0)} className="w-16 px-1 py-0.5 text-xs border rounded text-right" /></td>
                        <td className="py-0.5 text-right font-semibold text-slate-700">{fmtQ(e.cantidad * e.costoHora)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="font-bold text-amber-800"><td colSpan={3} className="py-0.5 text-right">Total Equipo por unidad</td><td className="py-0.5 text-right">{fmtQ(apu?.costoHerramienta ?? 0)}</td></tr></tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
            <span className="text-slate-600">Costo Unitario Total: <strong className="text-blue-800">{fmtQ(costoUnit)}</strong></span>
            <span className="text-slate-600">Subtotal: <strong className="text-blue-800">{fmtQ(subtotal)}</strong></span>
            <span className="text-slate-600">Tiempo: <strong>{dias.toFixed(2)} días</strong></span>
          </div>
        </div>
      )}
    </div>
  );
});

const Field = React.memo<{ label: string; value: number; onChange: (v: number) => void }>(({ label, value, onChange }) => (
  <div>
    <label className="text-[10px] text-slate-600 font-semibold">{label}</label>
    <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 text-xs border rounded" />
  </div>
));

const Stat = React.memo<{ label: string; value: string; highlight?: boolean }>(({ label, value, highlight }) => (
  <div className={`p-2 rounded ${highlight ? 'bg-emerald-500 col-span-2 md:col-span-1' : 'bg-white/10'}`}>
    <div className="text-[10px] opacity-80 uppercase tracking-wider">{label}</div>
    <div className={`font-bold ${highlight ? 'text-base' : 'text-sm'}`}>{value}</div>
  </div>
));

export default PresupuestoScreen;
