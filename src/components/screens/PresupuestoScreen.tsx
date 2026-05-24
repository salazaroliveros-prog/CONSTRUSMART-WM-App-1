import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Header from '@/components/shared/Header';
import { renglonesPorTipologia, Tipologia, tipologiaLabels, Renglon } from '@/data/renglones';
import { downloadCSV, printPDF, fmtQ } from '@/lib/exporters';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, ChevronDown, ChevronRight, Download, FileText, Calculator, Search, Save } from 'lucide-react';

interface LineaPresupuesto extends Renglon {
  cantidad: number;
}

const PresupuestoScreen: React.FC = () => {
  const { clientes, session } = useAppContext();
  const [tipologia, setTipologia] = useState<Tipologia>('general');
  const [search, setSearch] = useState('');
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
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

  const catalogo = renglonesPorTipologia[tipologia];
  const catalogoFiltrado = catalogo.filter(r =>
    r.descripcion.toLowerCase().includes(search.toLowerCase()) ||
    r.codigo.includes(search)
  );

  const addRenglon = (r: Renglon) => {
    if (lineas.find(l => l.id === r.id)) return;
    setLineas([...lineas, { ...r, cantidad: 1 }]);
    setExpanded(prev => new Set(prev).add(r.id));
  };

  const updateLinea = (id: string, field: keyof LineaPresupuesto, value: number) => {
    setLineas(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLinea = (id: string) => {
    setLineas(prev => prev.filter(l => l.id !== id));
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const totales = useMemo(() => {
    const direct = lineas.map(l => {
      const cu = l.costoMaterial + l.costoManoObra + l.costoHerramienta;
      return { ...l, costoUnitario: cu, subtotal: cu * l.cantidad };
    });
    const costoDirecto = direct.reduce((s, l) => s + l.subtotal, 0);
    const indirectos = costoDirecto * (meta.factorIndirectos / 100);
    const administrativos = costoDirecto * (meta.factorAdministrativos / 100);
    const imprevistos = costoDirecto * (meta.factorImprevistos / 100);
    const subtotal = costoDirecto + indirectos + administrativos + imprevistos;
    const utilidad = subtotal * (meta.factorUtilidad / 100);
    const total = subtotal + utilidad;
    const tiempo = lineas.reduce((s, l) => s + (l.rendimiento > 0 ? l.cantidad / l.rendimiento : 0), 0);
    return { direct, costoDirecto, indirectos, administrativos, imprevistos, subtotal, utilidad, total, tiempo };
  }, [lineas, meta]);

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['CONSTRUCTORA WM/M&S - Edificando el Futuro'],
      [`Presupuesto: ${meta.proyecto}`, `Cliente: ${meta.cliente}`, `Ubicación: ${meta.ubicacion}`, `Fecha: ${new Date().toLocaleDateString('es-GT')}`],
      [],
      ['RESUMEN DE RENGLONES'],
      ['Código', 'Descripción', 'Unidad', 'Cantidad', 'Costo Unitario (Q)', 'Subtotal (Q)'],
      ...totales.direct.map(l => [l.codigo, l.descripcion, l.unidad, l.cantidad, Number(l.costoUnitario.toFixed(2)), Number(l.subtotal.toFixed(2))]),
      [],
      ['DESGLOSE UNITARIO POR RENGLÓN'],
      ['Código', 'Descripción', 'Material (Q)', 'Mano de Obra (Q)', 'Herramienta (Q)', 'Rendimiento'],
      ...lineas.map(l => [l.codigo, l.descripcion, Number(l.costoMaterial.toFixed(2)), Number(l.costoManoObra.toFixed(2)), Number(l.costoHerramienta.toFixed(2)), `${l.rendimiento} ${l.unidad}/día`]),
      [],
      ['RESUMEN FINANCIERO'],
      ['Costo Directo', Number(totales.costoDirecto.toFixed(2))],
      [`Costos Indirectos (${meta.factorIndirectos}%)`, Number(totales.indirectos.toFixed(2))],
      [`Costos Administrativos (${meta.factorAdministrativos}%)`, Number(totales.administrativos.toFixed(2))],
      [`Imprevistos (${meta.factorImprevistos}%)`, Number(totales.imprevistos.toFixed(2))],
      ['Subtotal', Number(totales.subtotal.toFixed(2))],
      [`Utilidad (${meta.factorUtilidad}%)`, Number(totales.utilidad.toFixed(2))],
      ['TOTAL DEL PROYECTO', Number(totales.total.toFixed(2))],
      [`Tiempo estimado: ${totales.tiempo.toFixed(1)} días`],
    ];
    downloadCSV(`presupuesto_${meta.proyecto.replace(/\s+/g, '_')}.csv`, rows);
  };

  const handleExportPDF = () => {
    const resumenHTML = `
      <h2>Información General del Proyecto</h2>
      <table>
        <tr><th style="width:30%">Proyecto</th><td>${meta.proyecto}</td></tr>
        <tr><th>Cliente</th><td>${meta.cliente || 'N/A'}</td></tr>
        <tr><th>Ubicación</th><td>${meta.ubicacion}</td></tr>
        <tr><th>Tipología</th><td>${tipologiaLabels[tipologia]}</td></tr>
        <tr><th>Tiempo Estimado</th><td>${totales.tiempo.toFixed(1)} días</td></tr>
      </table>

      <h2>Resumen de Renglones</h2>
      <table>
        <thead><tr><th>Código</th><th>Descripción</th><th>Unidad</th><th class="num">Cantidad</th><th class="num">C. Unitario</th><th class="num">Subtotal</th></tr></thead>
        <tbody>
          ${totales.direct.map(l => `<tr><td>${l.codigo}</td><td>${l.descripcion}</td><td>${l.unidad}</td><td class="num">${l.cantidad}</td><td class="num">${fmtQ(l.costoUnitario)}</td><td class="num">${fmtQ(l.subtotal)}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="5">COSTO DIRECTO TOTAL</td><td class="num">${fmtQ(totales.costoDirecto)}</td></tr>
        </tbody>
      </table>

      <h2>Desglose Unitario (APU)</h2>
      <table>
        <thead><tr><th>Código</th><th>Descripción</th><th class="num">Material</th><th class="num">M. Obra</th><th class="num">Herram.</th><th class="num">Rendim.</th></tr></thead>
        <tbody>
          ${lineas.map(l => `<tr><td>${l.codigo}</td><td>${l.descripcion}</td><td class="num">${fmtQ(l.costoMaterial)}</td><td class="num">${fmtQ(l.costoManoObra)}</td><td class="num">${fmtQ(l.costoHerramienta)}</td><td class="num">${l.rendimiento} ${l.unidad}/día</td></tr>`).join('')}
        </tbody>
      </table>

      <h2>Resumen Financiero</h2>
      <table>
        <tr><th style="width:60%">Concepto</th><th class="num">Valor (Q)</th></tr>
        <tr><td>Costo Directo</td><td class="num">${fmtQ(totales.costoDirecto)}</td></tr>
        <tr><td>Costos Indirectos (${meta.factorIndirectos}%)</td><td class="num">${fmtQ(totales.indirectos)}</td></tr>
        <tr><td>Costos Administrativos (${meta.factorAdministrativos}%)</td><td class="num">${fmtQ(totales.administrativos)}</td></tr>
        <tr><td>Imprevistos (${meta.factorImprevistos}%)</td><td class="num">${fmtQ(totales.imprevistos)}</td></tr>
        <tr><td><strong>Subtotal</strong></td><td class="num"><strong>${fmtQ(totales.subtotal)}</strong></td></tr>
        <tr><td>Utilidad (${meta.factorUtilidad}%)</td><td class="num">${fmtQ(totales.utilidad)}</td></tr>
        <tr class="total-row"><td>TOTAL DEL PROYECTO</td><td class="num">${fmtQ(totales.total)}</td></tr>
      </table>
    `;
    printPDF(`Presupuesto - ${meta.proyecto}`, resumenHTML);
  };

  const handleSave = async () => {
    if (!session) {
      console.warn('No hay sesión activa');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        proyecto: meta.proyecto,
        cliente: meta.cliente,
        ubicacion: meta.ubicacion,
        tipologia,
        factor_indirectos: meta.factorIndirectos,
        factor_administrativos: meta.factorAdministrativos,
        factor_imprevistos: meta.factorImprevistos,
        factor_utilidad: meta.factorUtilidad,
        lineas,
        updated_at: new Date().toISOString(),
      };
      if (savedPresupuestoId) {
        const { error } = await supabase.from('presupuestos').update(payload).eq('id', savedPresupuestoId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('presupuestos')
          .insert({ ...payload, user_id: session.user.id })
          .select('id')
          .single();
        if (error) throw error;
        if (data) setSavedPresupuestoId(data.id);
      }
    } catch (err) {
      console.error('Error al guardar presupuesto:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-fadeIn">
      <Header title="Motor de Presupuestos APU" />

      <div className="p-3 sm:p-5 max-w-[1600px] mx-auto grid grid-cols-12 gap-4">
        {/* Datos generales y catálogo */}
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
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Indirectos %</label>
                  <input type="number" value={meta.factorIndirectos} onChange={e => setMeta({ ...meta, factorIndirectos: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 text-xs border rounded" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Administrativos %</label>
                  <input type="number" value={meta.factorAdministrativos} onChange={e => setMeta({ ...meta, factorAdministrativos: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 text-xs border rounded" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Imprevistos %</label>
                  <input type="number" value={meta.factorImprevistos} onChange={e => setMeta({ ...meta, factorImprevistos: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 text-xs border rounded" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-600">Utilidad %</label>
                  <input type="number" value={meta.factorUtilidad} onChange={e => setMeta({ ...meta, factorUtilidad: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 text-xs border rounded" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2"><Search className="w-4 h-4 text-blue-700" />Catálogo de Renglones</h3>
            <div className="text-[10px] text-slate-500 mb-2">{catalogo.length} renglones · Tipología: <strong>{tipologiaLabels[tipologia]}</strong></div>
            <input placeholder="Buscar renglón..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded mb-2" />
            <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1">
              {catalogoFiltrado.map(r => {
                const added = lineas.find(l => l.id === r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => addRenglon(r)}
                    disabled={!!added}
                    className={`w-full text-left p-2 rounded text-[11px] transition ${added ? 'bg-emerald-50 text-emerald-700 cursor-not-allowed' : 'bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-transparent'}`}
                  >
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

        {/* Cuadro de renglones - concertina */}
        <div className="col-span-12 lg:col-span-8 space-y-3">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 text-white p-3 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-sm flex items-center gap-2"><Calculator className="w-4 h-4" />Renglones del Presupuesto ({lineas.length})</h3>
               <div className="flex gap-2">
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
                  const isOpen = expanded.has(l.id);
                  const costoUnit = l.costoMaterial + l.costoManoObra + l.costoHerramienta;
                  const subtotal = costoUnit * l.cantidad;
                  return (
                    <div key={l.id} className="transition-all">
                      <div className="flex items-center gap-2 p-3 hover:bg-slate-50">
                        <button onClick={() => toggleExpand(l.id)} className="text-slate-500">
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-800 truncate">{l.codigo} · {l.descripcion}</div>
                          <div className="text-[10px] text-slate-500">{l.unidad} · {fmtQ(costoUnit)} c/u</div>
                        </div>
                        <input type="number" value={l.cantidad} onChange={e => updateLinea(l.id, 'cantidad', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 text-xs border rounded text-right" />
                        <div className="w-24 text-right text-xs font-bold text-blue-900">{fmtQ(subtotal)}</div>
                        <button onClick={() => removeLinea(l.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      {isOpen && (
                        <div className="bg-slate-50 p-3 border-t border-dashed">
                          <div className="text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-wider">Análisis de Precios Unitarios (APU)</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <Field label="Material (Q)" value={l.costoMaterial} onChange={v => updateLinea(l.id, 'costoMaterial', v)} />
                            <Field label="Mano de Obra (Q)" value={l.costoManoObra} onChange={v => updateLinea(l.id, 'costoManoObra', v)} />
                            <Field label="Herramienta (Q)" value={l.costoHerramienta} onChange={v => updateLinea(l.id, 'costoHerramienta', v)} />
                            <Field label={`Rendim. (${l.unidad}/día)`} value={l.rendimiento} onChange={v => updateLinea(l.id, 'rendimiento', v)} />
                          </div>
                          <div className="mt-2 text-[10px] text-slate-600">
                            Tiempo estimado: <strong>{l.rendimiento > 0 ? (l.cantidad / l.rendimiento).toFixed(2) : 0} días</strong> ·
                            Costo unitario total: <strong className="text-blue-700">{fmtQ(costoUnit)}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumen financiero */}
          {lineas.length > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-blue-900 text-white rounded-xl shadow-md p-4">
              <h3 className="font-bold text-sm mb-3">Resumen Financiero del Presupuesto</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <Stat label="Costo Directo" value={fmtQ(totales.costoDirecto)} />
                <Stat label={`Indirectos (${meta.factorIndirectos}%)`} value={fmtQ(totales.indirectos)} />
                <Stat label={`Administrativos (${meta.factorAdministrativos}%)`} value={fmtQ(totales.administrativos)} />
                <Stat label={`Imprevistos (${meta.factorImprevistos}%)`} value={fmtQ(totales.imprevistos)} />
                <Stat label="Subtotal" value={fmtQ(totales.subtotal)} />
                <Stat label={`Utilidad (${meta.factorUtilidad}%)`} value={fmtQ(totales.utilidad)} />
                <Stat label="Tiempo Estimado" value={`${totales.tiempo.toFixed(1)} días`} />
                <Stat label="TOTAL" value={fmtQ(totales.total)} highlight />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="text-[10px] text-slate-600 font-semibold">{label}</label>
    <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 text-xs border rounded" />
  </div>
);

const Stat: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`p-2 rounded ${highlight ? 'bg-emerald-500 col-span-2 md:col-span-1' : 'bg-white/10'}`}>
    <div className="text-[10px] opacity-80 uppercase tracking-wider">{label}</div>
    <div className={`font-bold ${highlight ? 'text-base' : 'text-sm'}`}>{value}</div>
  </div>
);

export default PresupuestoScreen;
