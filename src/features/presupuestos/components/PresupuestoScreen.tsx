import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import { renglonesPorTipologia, Tipologia, tipologiaLabels, Renglon, SubMaterial, SubManoObra, SubEquipo, Subrenglones, calcularAPU } from '@/data/renglones';
import { obtenerBibliotecaRenglones, crearRenglon } from '@/services/RenglonesService';
import type { Renglon as ServiceRenglon, MaterialUnitario, SubRenglon } from '@/services/RenglonesService';
import { downloadCSV, exportPresupuestoPDF, fmtQ } from '@/lib/exporters';
import { BitacoraAvancePanel } from '@/components/shared/BitacoraAvancePanel';
import { PanelAPUPredictor } from '@/components/PanelAPUPredictor';
import { Plus, Trash2, ChevronDown, ChevronRight, Download, FileText, Calculator, Search, Save, FolderOpen, AlertTriangle, CheckCircle2, Info, Users, Wrench, Package } from 'lucide-react';
import ChecklistPanel from '@/components/shared/ChecklistPanel';
import MaterialesPanel from '@/components/shared/MaterialesPanel';
import { validarFactores, sugerirFactores, detectarAnomalias } from '@/utils/validacionPresupuesto';
import type { Suggestion } from '@/utils/predictorAPU';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

function serviceRenglonToDataRenglon(serviceRenglon: ServiceRenglon): Renglon {
  const materiales: SubMaterial[] = (serviceRenglon.materiales || []).map((m: MaterialUnitario) => ({
    nombre: m.nombre,
    unidad: m.unidad,
    cantidad: m.cantidad,
    costoUnitario: m.costoUnitario,
  }));

  const subrenglones: Subrenglones = {
    materiales,
    manoObra: [],
    equipos: [],
  };

  return {
    id: serviceRenglon.id,
    codigo: serviceRenglon.codigo,
    descripcion: serviceRenglon.descripcion,
    unidad: serviceRenglon.unidad,
    rendimiento: serviceRenglon.rendimiento,
    costoMaterial: serviceRenglon.costoMaterial,
    costoManoObra: serviceRenglon.costoManoObra,
    costoHerramienta: serviceRenglon.costoHerramienta,
    subrenglones,
  };
}

function buildCustomServiceRenglon(customRenglon: CustomRenglonForm, tipologia: string): Omit<ServiceRenglon, 'id'> {
  return {
    codigo: customRenglon.codigo || `PERS-${Date.now()}`,
    descripcion: customRenglon.descripcion || 'Renglón personalizado',
    unidad: customRenglon.unidad || 'm²',
    rendimiento: customRenglon.rendimiento || 1,
    costoMaterial: customRenglon.costoMaterial || 0,
    costoManoObra: customRenglon.costoManoObra || 0,
    costoHerramienta: customRenglon.costoHerramienta || 0,
    materiales: [{
      id: 'custom-material',
      nombre: customRenglon.materialNombre || 'Material personal',
      cantidad: customRenglon.materialCantidad || 0,
      unidad: customRenglon.materialUnidad || 'u',
      costoUnitario: customRenglon.materialCostoUnitario || 0,
    }],
    subrenglones: [{
      id: `m-${Date.now()}`,
      descripcion: customRenglon.materialNombre || 'Material personal',
      cantidad: customRenglon.materialCantidad || 0,
      unidad: customRenglon.materialUnidad || 'u',
      costoUnitario: customRenglon.materialCostoUnitario || 0,
    }],
    activo: true,
    tipologia,
  };
}

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

type CalidadNivel = 'basico' | 'moderado' | 'premium';

interface CustomRenglonForm {
  codigo: string;
  descripcion: string;
  unidad: string;
  rendimiento: number;
  costoMaterial: number;
  costoManoObra: number;
  costoHerramienta: number;
  materialNombre: string;
  materialUnidad: string;
  materialCantidad: number;
  materialCostoUnitario: number;
  materialDesperdicio: number;
  manoDescripcion: string;
  manoCantidadPersonas: number;
  manoJornal: number;
  equipoDescripcion: string;
  equipoCantidad: number;
  equipoCostoHora: number;
}

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
    Object.fromEntries(lineas.map(l => [l.id, calcularAPU(l)])),
    [lineas]
  ) as Record<string, ReturnType<typeof calcularAPU>>;
}

function getDimensionLabels(descripcion: string) {
  const desc = descripcion.toLowerCase();
  if (desc.includes('cimiento') || desc.includes('zapata')) {
    return {
      title: 'Dimensiones de cimentación / zapata',
      fields: ['Largo (m)', 'Ancho (m)', 'Profundidad (m)'],
      tipo: 'volumen' as const,
    };
  }
  if (desc.includes('columna')) {
    return {
      title: 'Dimensiones de columna',
      fields: ['Base (m)', 'Lado (m)', 'Altura (m)'],
      tipo: 'volumen' as const,
    };
  }
  if (desc.includes('solera')) {
    return {
      title: 'Dimensiones de solera',
      fields: ['Largo (m)', 'Ancho (m)', 'Espesor (m)'],
      tipo: 'volumen' as const,
    };
  }
  return null;
}

const PresupuestoScreen: React.FC = () => {
  const { clientes, session, presupuestos, proyectos, addPresupuesto, updatePresupuesto, transicionFase } = useAppContext();
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
    proyectoId: '',
    areaConstruccion: 0,
    nivelCalidad: 'basico' as CalidadNivel,
    factorIndirectos: 12,
    factorAdministrativos: 8,
    factorImprevistos: 5,
    factorUtilidad: 15,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [savedPresupuestoId, setSavedPresupuestoId] = useState<string | null>(null);
  const [confirmRemoveLinea, setConfirmRemoveLinea] = useState<string | null>(null);
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [customRenglon, setCustomRenglon] = useState<CustomRenglonForm>({
    codigo: '', descripcion: '', unidad: 'm²', rendimiento: 1,
    costoMaterial: 0, costoManoObra: 0, costoHerramienta: 0,
    materialNombre: '', materialUnidad: 'u', materialCantidad: 1, materialCostoUnitario: 0, materialDesperdicio: 0,
    manoDescripcion: '', manoCantidadPersonas: 1, manoJornal: 150,
    equipoDescripcion: '', equipoCantidad: 1, equipoCostoHora: 0,
  });

  const catalogo = renglonesPorTipologia[tipologia];
  const [persistedCatalog, setPersistedCatalog] = useState<ServiceRenglon[]>([]);

  useEffect(() => {
    let mounted = true;
    if (session?.user?.id) {
      obtenerBibliotecaRenglones(session.user.id).then(list => {
        if (mounted) setPersistedCatalog(list);
      }).catch(e => console.warn('No se pudo cargar catálogo persistido', e));
    }
    return () => { mounted = false; };
  }, [session]);

  // Merge persisted catalog (user) with base catalog, prefer persisted entries
  const mergedCatalog: Renglon[] = [
    ...persistedCatalog.filter(p => (p.tipologia || 'general') === tipologia).map(serviceRenglonToDataRenglon),
    ...catalogo.filter(c => !(persistedCatalog || []).some(p => p.codigo === c.codigo))
  ];

  const catalogoFiltrado = mergedCatalog.filter(r =>
    r.descripcion.toLowerCase().includes(search.toLowerCase()) ||
    r.codigo.includes(search)
  );

  const addRenglon = useCallback((r: Renglon) => {
    // aplicar multiplicador por nivel de calidad
    const multiplier = meta.nivelCalidad === 'basico' ? 0.95 : meta.nivelCalidad === 'premium' ? 1.15 : 1.0;
    
    // escalar por área de construcción si es de tipo área
    const area = Math.max(0, meta.areaConstruccion || 0);
    const cantidadAuto = r.unidad === 'm²' || r.descripcion.toLowerCase().includes('superficie') || r.descripcion.toLowerCase().includes('piso')
      ? area || 1
      : 1;
    
    const scaled: LineaPresupuesto = {
      ...r,
      id: r.id,
      codigo: r.codigo,
      descripcion: r.descripcion,
      unidad: r.unidad,
      rendimiento: r.rendimiento,
      costoMaterial: Math.round((r.costoMaterial || 0) * multiplier),
      costoManoObra: Math.round((r.costoManoObra || 0) * multiplier),
      costoHerramienta: Math.round((r.costoHerramienta || 0) * multiplier),
      subrenglones: {
        materiales: (r.subrenglones?.materiales || []).map(m => ({ ...m, costoUnitario: Math.round((m.costoUnitario || 0) * multiplier) })),
        manoObra: (r.subrenglones?.manoObra || []).map(m => ({ ...m })),
        equipos: (r.subrenglones?.equipos || []).map(e => ({ ...e })),
      },
      cantidad: cantidadAuto,
      baseTotalPersonas: (r.subrenglones?.manoObra || []).reduce((s, m) => s + (m.cantidadPersonas || 0), 0),
    } as LineaPresupuesto;

    setLineas(prev => {
      if (prev.find(l => l.id === scaled.id)) return prev;
      return [...prev, scaled];
    });
    setExpanded(prev => new Set(prev).add(scaled.id));
  }, [meta.nivelCalidad, meta.areaConstruccion]);

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
      return { ...l, subrenglones: nuevosSub, costoMaterial: cm, costoManoObra: co, costoHerramienta: ce };
    }));
  }, []);

  // Agregar sub-material, sub-MO, sub-equipo
  const addSubMaterial = useCallback((id: string) => {
    setLineas(prev => prev.map(l => {
      if (l.id !== id) return l;
      const nuevoMaterial: SubMaterial = { nombre: 'Nuevo material', unidad: 'und', cantidad: 1, costoUnitario: 0, desperdicio: 0 };
      const materiales = [...l.subrenglones.materiales, nuevoMaterial];
      const nuevosSub = { ...l.subrenglones, materiales };
      const cm = materiales.reduce((s, m) => s + m.cantidad * (1 + (m.desperdicio ?? 0) / 100) * m.costoUnitario, 0);
      return { ...l, subrenglones: nuevosSub, costoMaterial: cm };
    }));
  }, []);

  const addSubMO = useCallback((id: string) => {
    setLineas(prev => prev.map(l => {
      if (l.id !== id) return l;
      const nuevaMO: SubManoObra = { descripcion: 'Nuevo oficial/albañil', cantidadPersonas: 1, jornal: 0 };
      const manoObra = [...l.subrenglones.manoObra, nuevaMO];
      const nuevosSub = { ...l.subrenglones, manoObra };
      const co = manoObra.reduce((s, m) => s + m.cantidadPersonas * m.jornal / l.rendimiento, 0);
      return { ...l, subrenglones: nuevosSub, costoManoObra: co };
    }));
  }, []);

  const addSubEquipo = useCallback((id: string) => {
    setLineas(prev => prev.map(l => {
      if (l.id !== id) return l;
      const nuevoEquipo: SubEquipo = { descripcion: 'Nuevo equipo/herramienta', cantidad: 1, costoHora: 0 };
      const equipos = [...l.subrenglones.equipos, nuevoEquipo];
      const nuevosSub = { ...l.subrenglones, equipos };
      const ce = equipos.reduce((s, e) => s + e.cantidad * e.costoHora, 0);
      return { ...l, subrenglones: nuevosSub, costoHerramienta: ce };
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

  const calidadReferencial = useMemo(() => {
    const niveles: Record<CalidadNivel, { min: number; max: number; label: string }> = {
      basico: { min: 3000, max: 3500, label: 'Básico' },
      moderado: { min: 3500, max: 4000, label: 'Moderado' },
      premium: { min: 4000, max: 5000, label: 'Premium' },
    };
    const nivel = niveles[meta.nivelCalidad];
    const area = Math.max(0, Number(meta.areaConstruccion) || 0);
    const promedio = ((nivel.min + nivel.max) / 2) * area;
    return {
      ...nivel,
      area,
      totalMin: nivel.min * area,
      totalMax: nivel.max * area,
      totalPromedio: promedio,
    };
  }, [meta.areaConstruccion, meta.nivelCalidad]);

  const resetCustomForm = useCallback(() => {
    setCustomRenglon({
      codigo: '', descripcion: '', unidad: 'm²', rendimiento: 1,
      costoMaterial: 0, costoManoObra: 0, costoHerramienta: 0,
      materialNombre: '', materialUnidad: 'u', materialCantidad: 1, materialCostoUnitario: 0, materialDesperdicio: 0,
      manoDescripcion: '', manoCantidadPersonas: 1, manoJornal: 150,
      equipoDescripcion: '', equipoCantidad: 1, equipoCostoHora: 0,
    });
  }, []);

  const addCustomRenglon = useCallback(() => {
    const id = `custom-${crypto.randomUUID()}`;
    addRenglon({
      id,
      codigo: customRenglon.codigo || 'PERS',
      descripcion: customRenglon.descripcion || 'Renglón personalizado',
      unidad: customRenglon.unidad || 'm²',
      rendimiento: Math.max(1, customRenglon.rendimiento),
      costoMaterial: customRenglon.costoMaterial,
      costoManoObra: customRenglon.costoManoObra,
      costoHerramienta: customRenglon.costoHerramienta,
      subrenglones: {
        materiales: [{
          nombre: customRenglon.materialNombre || 'Material personal',
          unidad: customRenglon.materialUnidad || 'u',
          cantidad: customRenglon.materialCantidad,
          costoUnitario: customRenglon.materialCostoUnitario,
          desperdicio: customRenglon.materialDesperdicio,
        }],
        manoObra: [{
          descripcion: customRenglon.manoDescripcion || 'Mano de obra general',
          cantidadPersonas: customRenglon.manoCantidadPersonas,
          jornal: customRenglon.manoJornal,
        }],
        equipos: [{
          descripcion: customRenglon.equipoDescripcion || 'Equipo general',
          cantidad: customRenglon.equipoCantidad,
          costoHora: customRenglon.equipoCostoHora,
        }],
      },
    });
    resetCustomForm();
    setCustomFormOpen(false);
  }, [addRenglon, customRenglon, resetCustomForm]);

  const saveCustomToCatalog = useCallback(async () => {
    if (!session?.user?.id) return;
    const renglonToSave: Omit<ServiceRenglon, 'id'> = buildCustomServiceRenglon(customRenglon, tipologia);

    const id = await crearRenglon(renglonToSave, session.user.id);
    if (id) {
      // refresh persisted catalog
      const list = await obtenerBibliotecaRenglones(session.user.id);
      setPersistedCatalog(list);
      // add immediately to presupuesto
      addRenglon({ id, codigo: renglonToSave.codigo, descripcion: renglonToSave.descripcion, unidad: renglonToSave.unidad, rendimiento: renglonToSave.rendimiento, costoMaterial: renglonToSave.costoMaterial, costoManoObra: renglonToSave.costoManoObra, costoHerramienta: renglonToSave.costoHerramienta, subrenglones: renglonToSave.subrenglones });
      resetCustomForm();
      setCustomFormOpen(false);
    } else {
      console.warn('No se pudo crear renglon en catálogo');
    }
  }, [customRenglon, session, tipologia, addRenglon, resetCustomForm]);

  const handleSugerirFactores = useCallback(() => {
    const s = sugerirFactores(tipologia);
    setMeta(m => ({ ...m, ...s }));
    toast.success('Factores sugeridos aplicados');
  }, [tipologia]);

  const calculadas = useDeepCalc(lineas);

  const totales = useMemo(() => {
    const costoDirecto = lineas.reduce((s, l) => s + (calculadas[l.id]?.subtotal ?? 0), 0);
    const totalMaterial = lineas.reduce((s, l) => s + ((calculadas[l.id]?.costoMaterial ?? 0) * l.cantidad), 0);
    const totalMO = lineas.reduce((s, l) => s + ((calculadas[l.id]?.costoManoObra ?? 0) * l.cantidad), 0);
    const totalEquipo = lineas.reduce((s, l) => s + ((calculadas[l.id]?.costoHerramienta ?? 0) * l.cantidad), 0);
    const indirectos = costoDirecto * (meta.factorIndirectos / 100);
    const administrativos = costoDirecto * (meta.factorAdministrativos / 100);
    const imprevistos = costoDirecto * (meta.factorImprevistos / 100);
    const subtotal = costoDirecto + indirectos + administrativos + imprevistos;
    const utilidad = subtotal * (meta.factorUtilidad / 100);
    const total = subtotal + utilidad;
    const tiempo = lineas.reduce((s, l) => s + (calculadas[l.id]?.dias ?? 0), 0);
    const totalPersonasDia = lineas.reduce((s, l) => s + (calculadas[l.id]?.totalPersonasDia ?? 0), 0);
    return { calculadas, costoDirecto, totalMaterial, totalMO, totalEquipo, indirectos, administrativos, imprevistos, subtotal, utilidad, total, tiempo, totalPersonasDia };
  }, [calculadas, lineas, meta]);

  const validacion = useMemo(() => validarFactores({ ...meta, total: totales.total }), [meta, totales.total]);

  const anomalias = useMemo(() =>
    lineas.length > 0 ? detectarAnomalias(totales.costoDirecto, totales.totalMaterial, totales.totalMO, totales.totalEquipo) : [],
    [lineas, totales]
  );

  const handleAplicarSugerencia = useCallback((sugerencia: Suggestion) => {
    if (sugerencia.tipo === 'factor' && sugerencia.valor && typeof sugerencia.valor === 'object') {
      const valores = sugerencia.valor as Record<string, number>;
      setMeta(m => ({
        ...m,
        factorIndirectos: valores.factor_indirectos ?? m.factorIndirectos,
        factorAdministrativos: valores.factor_administrativos ?? m.factorAdministrativos,
        factorImprevistos: valores.factor_imprevistos ?? m.factorImprevistos,
        factorUtilidad: valores.factor_utilidad ?? m.factorUtilidad,
      }));
      toast.success('Factores sugeridos aplicados');
      return;
    }

    if (sugerencia.tipo === 'rentabilidad' && typeof sugerencia.valor === 'number') {
      setMeta(m => ({ ...m, factorUtilidad: Number(sugerencia.valor) || m.factorUtilidad }));
      toast.success(`Utilidad sugerida de ${sugerencia.valor}% aplicada`);
      return;
    }

    if (sugerencia.tipo === 'duracion' && typeof sugerencia.valor === 'number') {
      const start = new Date(meta.fechaInicio);
      const end = new Date(start.getTime() + (Number(sugerencia.valor) * 24 * 60 * 60 * 1000));
      setMeta(m => ({ ...m, fechaFin: end.toISOString().split('T')[0] }));
      toast.success(`Duración estimada de ${sugerencia.valor} días aplicada`);
      return;
    }

    toast(sugerencia.mensaje);
  }, [meta.fechaInicio]);

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      ['CONSTRUCTORA WM/M&S - Edificando el Futuro'],
      [`Presupuesto: ${meta.proyecto}`, `Cliente: ${meta.cliente}`, `Ubicación: ${meta.ubicacion}`, `Fecha: ${new Date().toLocaleDateString('es-GT')}`],
      [`Área de construcción (m²): ${meta.areaConstruccion}`],
      [`Nivel de calidad: ${meta.nivelCalidad}`],
      [`Costo referencial: Q ${calidadReferencial.totalMin.toLocaleString()} - Q ${calidadReferencial.totalMax.toLocaleString()}`],
      [],
      ['RESUMEN DE RENGLONES'],
      ['Código', 'Descripción', 'Unidad', 'Cantidad', 'Costo Unitario (Q)', 'Subtotal (Q)'],
      ...lineas.map(l => {
        const apu = calculadas[l.id];
        const costoUnitario = apu?.costoUnitario ?? (l.costoMaterial + l.costoManoObra + l.costoHerramienta);
        return [l.codigo, l.descripcion, l.unidad, l.cantidad, Number(costoUnitario.toFixed(2)), Number((costoUnitario * l.cantidad).toFixed(2))];
      }),
      [],
      ['EXPLOSION DE MATERIALES UNITARIOS POR RENGLON'],
      ['Renglón', 'Material', 'Unidad', 'Cantidad Unitaria', 'Costo Unitario (Q)', 'Subtotal (Q)'],
      ...lineas.flatMap(l =>
        l.subrenglones.materiales.map(m => [l.codigo + ' ' + l.descripcion, m.nombre, m.unidad, m.cantidad, m.costoUnitario, Number((m.cantidad * m.costoUnitario).toFixed(2))])
      ),
      [],
      ['MANO DE OBRA POR RENGLON'],
      ['Renglón', 'Descripción', 'Personas', 'Jornal (Q/día)', 'Costo Unitario (Q)'],
      ...lineas.flatMap(l =>
        l.subrenglones.manoObra.map(m => [l.codigo + ' ' + l.descripcion, m.descripcion, m.cantidadPersonas, m.jornal, Number((m.cantidadPersonas * m.jornal / l.rendimiento).toFixed(2))])
      ),
      [],
      ['EQUIPO POR RENGLON'],
      ['Renglón', 'Equipo', 'Horas', 'Costo/hora (Q)', 'Subtotal (Q)'],
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
      [`Tiempo estimado: ${totales.tiempo.toFixed(1)} días`],
      [`Total personas-día: ${totales.totalPersonasDia.toFixed(0)}`],
    ];
    downloadCSV(`presupuesto_${meta.proyecto.replace(/\s+/g, '_')}.csv`, rows);
  };

  const cantidadTotal = useMemo(() => lineas.reduce((s, l) => s + l.cantidad, 0), [lineas]);

  const handleExportPDF = (tipo: 'admin' | 'cliente' = 'admin') => {
    exportPresupuestoPDF({
      proyecto: meta.proyecto,
      cliente: meta.cliente,
      ubicacion: meta.ubicacion,
      tipologia: tipologiaLabels[tipologia],
      areaConstruccion: meta.areaConstruccion,
      nivelCalidad: meta.nivelCalidad,
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
      tipo,
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
        proyecto_id: meta.proyectoId || null,
        area_construccion: meta.areaConstruccion || 0,
        nivel_calidad: meta.nivelCalidad || 'basico',
        fechaInicio: meta.fechaInicio,
        fechaFin: meta.fechaFin,
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
          <div className="bg-card rounded-xl shadow-md p-4 border dark:border-border">
            <h3 className="font-bold text-card-foreground text-sm mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Datos del Proyecto</h3>
            <div className="space-y-2">
              <input placeholder="Nombre del proyecto" value={meta.proyecto} onChange={e => setMeta({ ...meta, proyecto: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground" />
              <select value={meta.proyectoId} onChange={e => setMeta({ ...meta, proyectoId: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground">
                <option value="">-- Vincular a proyecto (opcional) --</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.cliente ? `(${p.cliente})` : ''}</option>)}
              </select>
              <select value={meta.cliente} onChange={e => setMeta({ ...meta, cliente: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground">
                <option value="">-- Seleccionar cliente --</option>
                {clientes.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
              <input placeholder="Ubicación" value={meta.ubicacion} onChange={e => setMeta({ ...meta, ubicacion: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground" />
              <div>
                <label className="text-tiny font-semibold text-muted-foreground">Tipología</label>
                <select value={tipologia} onChange={e => setTipologia(e.target.value as Tipologia)} className="w-full px-2 py-1.5 text-xs border rounded bg-blue-50 dark:bg-blue-900/20 dark:text-blue-100">
                  {Object.entries(tipologiaLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-tiny font-semibold text-muted-foreground">Área de construcción (m²)</label>
                <input type="number" min={0} value={meta.areaConstruccion} onChange={e => setMeta({ ...meta, areaConstruccion: Number(e.target.value) || 0 })} className="w-full px-2 py-1.5 text-xs border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground" />
              </div>
              <div>
                <label className="text-tiny font-semibold text-muted-foreground">Nivel de calidad</label>
                <select value={meta.nivelCalidad} onChange={e => setMeta({ ...meta, nivelCalidad: e.target.value as CalidadNivel })} className="w-full px-2 py-1.5 text-xs border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground">
                  <option value="basico">Básico (Q 3,000 - Q 3,500 /m²)</option>
                  <option value="moderado">Moderado (Q 3,500 - Q 4,000 /m²)</option>
                  <option value="premium">Premium (Q 4,000 - Q 5,000 /m²)</option>
                </select>
                {calidadReferencial.area > 0 && (
                  <div className="mt-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[10px]">
                    <div className="font-semibold text-blue-800 dark:text-blue-200">
                      Costo referencial: Q {calidadReferencial.totalMin.toLocaleString()} – Q {calidadReferencial.totalMax.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-blue-600 dark:text-blue-300">
                      {calidadReferencial.area} m² × {calidadReferencial.label} (Q {calidadReferencial.min.toLocaleString()}-{calidadReferencial.max.toLocaleString()}/m²) · Promedio: Q {calidadReferencial.totalPromedio.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-tiny font-semibold text-muted-foreground">Fecha Inicio</label>
                  <input type="date" value={meta.fechaInicio} onChange={e => setMeta({ ...meta, fechaInicio: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground" />
                </div>
                <div>
                  <label className="text-tiny font-semibold text-muted-foreground">Fecha Fin</label>
                  <input type="date" value={meta.fechaFin} onChange={e => setMeta({ ...meta, fechaFin: e.target.value })} className="w-full px-2 py-1.5 text-xs border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t dark:border-border">
                {[
                  { k: 'factorIndirectos', lbl: 'Indirectos %' },
                  { k: 'factorAdministrativos', lbl: 'Administrativos %' },
                  { k: 'factorImprevistos', lbl: 'Imprevistos %' },
                  { k: 'factorUtilidad', lbl: 'Utilidad %' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="text-[10px] font-semibold text-muted-foreground">{f.lbl}</label>
                    <input type="number" value={meta[f.k as keyof typeof meta]} onChange={e => setMeta({ ...meta, [f.k]: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 text-xs border rounded bg-background dark:bg-muted dark:border-border dark:text-foreground" />
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
                    <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground p-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" /><span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setCustomFormOpen(true)} className="text-[10px] px-2 py-1 rounded bg-white/20 hover:bg-white/30">+ Nuevo renglón personalizado</button>
              <button onClick={async () => {
                // Quick add default pergola metálica if present in base catalog
                const perg = mergedCatalog.find(r => r.descripcion.toLowerCase().includes('pergola metálica') || r.codigo.toLowerCase().includes('pergola'));
                if (perg) addRenglon(perg);
                else {
                  // open custom form prefilled
                  setCustomRenglon(prev => ({ ...prev, codigo: 'PERG-MET', descripcion: 'Pergola metálica (personalizada)' }));
                  setCustomFormOpen(true);
                }
              }} className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-700">Agregar pergola metálica</button>
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
              {lineas.length > 0 && (
                <div className="mt-4">
                  <PanelAPUPredictor
                    presupuestosHistorico={presupuestos}
                    tipologia={tipologia}
                    montoBase={totales.total}
                    cantidadRenglones={lineas.length}
                    cantidadTotal={cantidadTotal}
                    onAceptarSugerencia={handleAplicarSugerencia}
                  />
                </div>
              )}
            </div>
          
          {savedPresupuestoId && (
            <>
              <div className="bg-card rounded-xl shadow-md p-3 border dark:border-border"><ChecklistPanel presupuestoId={savedPresupuestoId} fase={faseAlGuardar} /></div>
              <MaterialesPanel presupuestoId={savedPresupuestoId} />
              <BitacoraAvancePanel presupuestoId={savedPresupuestoId} onAvanceChange={async (af) => { await updatePresupuesto(savedPresupuestoId, { avanceFisico: af }); }} />
            </>
          )}

          <div className="bg-card rounded-xl shadow-md p-4 border dark:border-border">
            <h3 className="font-bold text-card-foreground text-sm mb-2 flex items-center gap-2"><FolderOpen className="w-4 h-4 text-primary" />Presupuestos Guardados</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {(['planeación', 'ejecución', 'pausa', 'finalizado'] as const).map(f => {
                const count = presupuestos.filter(p => p.fase === f).length;
                return (
                  <button key={f} onClick={() => { setTabFase(f); setSavedPresupuestoId(null); setLineas([]); }}
                    className={`text-[10px] px-2 py-1 rounded-full border font-semibold transition ${tabFase === f ? faseColors[f] : 'bg-muted text-muted-foreground border-transparent'}`}>
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
                    className="w-full text-left p-2 rounded text-[10px] bg-muted/50 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition">
                    <div className="font-semibold text-card-foreground truncate">{p.proyecto}</div>
                    <div className="text-[9px] text-muted-foreground">{p.cliente || 'Sin cliente'} · Q {(p.total || 0).toLocaleString()}</div>
                  </button>
                ))}
                {presupuestos.filter(p => p.fase === tabFase).length === 0 && (
                  <div className="text-[10px] text-muted-foreground text-center py-4">Sin presupuestos en esta fase</div>
                )}
              </div>
            )}
          </div>
          {customFormOpen && (
            <div className="bg-card rounded-xl shadow-md p-4 mt-3 border dark:border-border">
              <h4 className="font-bold text-sm mb-2">Renglón personalizado</h4>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Código" value={customRenglon.codigo} onChange={e => setCustomRenglon(prev => ({ ...prev, codigo: e.target.value }))} className="px-2 py-1 text-xs border rounded" />
                <input placeholder="Unidad" value={customRenglon.unidad} onChange={e => setCustomRenglon(prev => ({ ...prev, unidad: e.target.value }))} className="px-2 py-1 text-xs border rounded" />
                <input placeholder="Descripción" value={customRenglon.descripcion} onChange={e => setCustomRenglon(prev => ({ ...prev, descripcion: e.target.value }))} className="col-span-2 px-2 py-1 text-xs border rounded" />
                <input type="number" placeholder="Costo Material" value={customRenglon.costoMaterial} onChange={e => setCustomRenglon(prev => ({ ...prev, costoMaterial: parseFloat(e.target.value) || 0 }))} className="px-2 py-1 text-xs border rounded" />
                <input type="number" placeholder="Costo ManoObra" value={customRenglon.costoManoObra} onChange={e => setCustomRenglon(prev => ({ ...prev, costoManoObra: parseFloat(e.target.value) || 0 }))} className="px-2 py-1 text-xs border rounded" />
                <input type="number" placeholder="Costo Herramienta" value={customRenglon.costoHerramienta} onChange={e => setCustomRenglon(prev => ({ ...prev, costoHerramienta: parseFloat(e.target.value) || 0 }))} className="px-2 py-1 text-xs border rounded" />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={addCustomRenglon} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Agregar al presupuesto</button>
                <button onClick={saveCustomToCatalog} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">Guardar en catálogo</button>
                <button onClick={() => { resetCustomForm(); setCustomFormOpen(false); }} className="px-3 py-1 rounded border text-sm">Cancelar</button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl shadow-md p-4 border dark:border-border">
            <h3 className="font-bold text-card-foreground text-sm mb-2 flex items-center gap-2"><Search className="w-4 h-4 text-blue-700" />Catálogo de Renglones</h3>
            <div className="text-[10px] text-muted-foreground mb-2">{catalogo.length} renglones · Tipología: <strong>{tipologiaLabels[tipologia]}</strong></div>
            <input placeholder="Buscar renglón..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded mb-2" />
            <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1">
              {catalogoFiltrado.map(r => {
                const added = lineas.find(l => l.id === r.id);
                return (
                  <button key={r.id} onClick={() => addRenglon(r)} disabled={!!added}
                    className={`w-full text-left p-2 rounded text-[11px] transition ${added ? 'bg-emerald-50 text-emerald-700 cursor-not-allowed' : 'bg-muted/50 hover:bg-blue-50 hover:border-blue-300 border border-transparent'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-card-foreground truncate">{r.codigo} · {r.descripcion}</div>
                        <div className="text-[9px] text-muted-foreground">{r.unidad} · Q {(r.costoMaterial + r.costoManoObra + r.costoHerramienta).toFixed(2)}</div>
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
          <div className="bg-card rounded-xl shadow-md overflow-hidden border dark:border-border">
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
                <button onClick={() => handleExportPDF()} disabled={!lineas.length} className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded text-[11px] font-semibold disabled:opacity-40"><FileText className="w-3 h-3" />PDF</button>
              </div>
            </div>

            {lineas.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">
                <Calculator className="w-12 h-12 mx-auto mb-2 opacity-30" />
                Agregue renglones desde el catálogo para iniciar el presupuesto
              </div>
            ) : (
              <div className="divide-y">
                {lineas.map(l => {
                  const apu = calculadas[l.id];
                  return (
                    <RenglonCard
                      key={l.id}
                      linea={l}
                      apu={apu}
                      isOpen={expanded.has(l.id)}
                      onUpdate={updateLinea}
                      onUpdateSubMaterial={updateSubMaterial}
                      onUpdateSubMO={updateSubMO}
                      onUpdateSubEquipo={updateSubEquipo}
                      onUpdateMemoria={updateMemoriaCalculo}
                      onRemove={removeLinea}
                      onToggle={toggleExpand}
                      onAddSubMaterial={addSubMaterial}
                      onAddSubMO={addSubMO}
                      onAddSubEquipo={addSubEquipo}
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
  onAddSubMaterial?: (id: string) => void;
  onAddSubMO?: (id: string) => void;
  onAddSubEquipo?: (id: string) => void;
}>(({ linea: l, apu, isOpen, onUpdate, onUpdateSubMaterial, onUpdateSubMO, onUpdateSubEquipo, onUpdateMemoria, onRemove, onToggle, onAddSubMaterial, onAddSubMO, onAddSubEquipo }) => {
  const [showMemoria, setShowMemoria] = useState(false);
  const costoUnit = apu?.costoUnitario ?? l.costoMaterial + l.costoManoObra + l.costoHerramienta;
  const subtotal = apu?.subtotal ?? costoUnit * l.cantidad;
  const dias = apu?.dias ?? (l.rendimiento > 0 ? l.cantidad / l.rendimiento : 0);
  const sub = l.subrenglones;
  const dimensionConfig = getDimensionLabels(l.descripcion);

  /**
   * Handlers memorizados para evitar parpadeo en inputs
   * Estos callbacks son estables entre renders
   */
  const createMaterialHandler = useCallback((idx: number, field: keyof SubMaterial) => {
    return (value: number) => onUpdateSubMaterial(l.id, idx, field, value);
  }, [l.id, onUpdateSubMaterial]);

  const createMOHandler = useCallback((idx: number, field: keyof SubManoObra) => {
    return (value: number) => onUpdateSubMO(l.id, idx, field, value);
  }, [l.id, onUpdateSubMO]);

  const createEquipoHandler = useCallback((idx: number, field: keyof SubEquipo) => {
    return (value: number) => onUpdateSubEquipo(l.id, idx, field, value);
  }, [l.id, onUpdateSubEquipo]);
  const m = l.memoriaCalculo || { veces: 1, largo: 0, ancho: 0, alto: 0, tipo: 'unidades' };

  return (
    <div>
      <div className="flex items-center gap-2 p-3 hover:bg-accent">
        <button onClick={() => onToggle(l.id)} className="text-muted-foreground">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-card-foreground truncate">{l.codigo} · {l.descripcion}</div>
          <div className="text-[10px] text-muted-foreground">{l.unidad} · {fmtQ(costoUnit)} c/u</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowMemoria(!showMemoria)}
            className={`p-1 rounded text-xs hover:bg-accent ${showMemoria ? 'bg-blue-100 text-blue-800 font-bold' : 'text-muted-foreground'}`}
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
        <div className="space-y-3">
          {dimensionConfig && (
            <div className="rounded-xl border border-border dark:border-border bg-card p-3 text-[10px] text-card-foreground">
              <div className="font-bold text-card-foreground mb-1">{dimensionConfig.title}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {dimensionConfig.fields.map((label, idx) => {
                  const key = idx === 0 ? 'largo' : idx === 1 ? 'ancho' : 'alto';
                  return (
                    <div key={label}>
                      <label className="text-[9px] text-muted-foreground font-medium">{label}</label>
                      <input
                        type="number"
                        value={m[key as keyof MemoriaCalculo]}
                        onChange={e => onUpdateMemoria(l.id, { [key]: parseFloat(e.target.value) || 0 })}
                        className="w-full px-1.5 py-1 text-xs border rounded"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-[9px] text-muted-foreground">
                El sistema usa estas dimensiones para calcular la cantidad de obra automáticamente y nutrir su memoria de cálculo.
              </div>
            </div>
          )}
        <div className="mx-3 mb-3 p-3 bg-blue-50/40 border border-blue-100 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-900 uppercase">Auxiliar de Memoria de Cálculo</span>
            <span className="text-[9px] text-muted-foreground font-semibold">Cálculo en base a dimensiones</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div>
              <label className="text-[9px] text-muted-foreground font-medium">Tipo de Dimensión</label>
              <select
                value={m.tipo}
                onChange={e => onUpdateMemoria(l.id, { tipo: e.target.value as any })}
                className="w-full px-1.5 py-1 text-xs border rounded bg-card dark:bg-card"
              >
                <option value="unidades">Unidades (Veces × Cant)</option>
                <option value="lineal">Lineal (Veces × Largo)</option>
                <option value="area">Área (Largo × Ancho)</option>
                <option value="volumen">Volumen (L × A × Alto)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground font-medium">Veces / Cant.</label>
              <input
                type="number"
                value={m.veces}
                onChange={e => onUpdateMemoria(l.id, { veces: parseFloat(e.target.value) || 0 })}
                className="w-full px-1.5 py-1 text-xs border rounded"
              />
            </div>
            {(m.tipo === 'lineal' || m.tipo === 'area' || m.tipo === 'volumen' || m.tipo === 'unidades') && (
              <div>
                <label className="text-[9px] text-muted-foreground font-medium">
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
                <label className="text-[9px] text-muted-foreground font-medium">Ancho (m)</label>
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
                <label className="text-[9px] text-muted-foreground font-medium">Alto / Espesor (m)</label>
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
      </div>
      )}
      {isOpen && (
        <div className="bg-muted/50 p-3 border-t border-dashed space-y-3">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-3 h-3" />Análisis de Precios Unitarios (APU)
          </div>

          {sub.materiales.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-blue-800 mb-1 flex items-center justify-between gap-1">
                <span><Package className="w-3 h-3 inline mr-1" /> Materiales</span>
                {onAddSubMaterial && (
                  <button onClick={() => onAddSubMaterial(l.id)} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold transition whitespace-nowrap">
                    + Agregar material
                  </button>
                )}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead><tr className="text-muted-foreground border-b"><th className="text-left py-0.5">Material</th><th className="text-center py-0.5">Unidad</th><th className="text-right py-0.5">Cant.</th><th className="text-right py-0.5">Q/Und</th><th className="text-right py-0.5">Desp.%</th><th className="text-right py-0.5">Subtotal</th></tr></thead>
                  <tbody>
                    {sub.materiales.map((m, i) => (
                      <tr key={i} className="border-b border-dashed border-border">
                        <td className="py-0.5 text-card-foreground">{m.nombre}</td>
                        <td className="py-0.5 text-center text-muted-foreground">{m.unidad}</td>
                        <td className="py-0.5"><input type="number" value={m.cantidad} onChange={e => createMaterialHandler(i, 'cantidad')(parseFloat(e.target.value) || 0)} className="w-14 px-1 py-0.5 text-xs border rounded text-right" /></td>
                        <td className="py-0.5"><input type="number" value={m.costoUnitario} onChange={e => createMaterialHandler(i, 'costoUnitario')(parseFloat(e.target.value) || 0)} className="w-16 px-1 py-0.5 text-xs border rounded text-right" /></td>
                        <td className="py-0.5"><input type="number" value={m.desperdicio ?? 0} onChange={e => createMaterialHandler(i, 'desperdicio')(parseFloat(e.target.value) || 0)} className="w-12 px-1 py-0.5 text-xs border rounded text-right" min={0} max={100} /></td>
                        <td className="py-0.5 text-right font-semibold text-card-foreground">{fmtQ(m.cantidad * (1 + (m.desperdicio ?? 0) / 100) * m.costoUnitario)}</td>
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
              <h4 className="text-[10px] font-bold text-emerald-800 mb-1 flex items-center justify-between gap-1">
                <span><Users className="w-3 h-3 inline mr-1" /> Mano de Obra</span>
                {onAddSubMO && (
                  <button onClick={() => onAddSubMO(l.id)} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold transition whitespace-nowrap">
                    + Agregar MO
                  </button>
                )}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead><tr className="text-muted-foreground border-b"><th className="text-left py-0.5">Cuadrilla</th><th className="text-center py-0.5">Personas</th><th className="text-right py-0.5">Jornal (Q/día)</th><th className="text-right py-0.5">Costo/día</th><th className="text-right py-0.5">Costo/und</th></tr></thead>
                  <tbody>
                    {sub.manoObra.map((m, i) => {
                      const costoPorDia = m.cantidadPersonas * m.jornal;
                      const costoPorUnd = l.rendimiento > 0 ? costoPorDia / l.rendimiento : 0;
                      return (
                        <tr key={i} className="border-b border-dashed border-border">
                          <td className="py-0.5 text-card-foreground">{m.descripcion}</td>
                          <td className="py-0.5"><input type="number" value={m.cantidadPersonas} onChange={e => createMOHandler(i, 'cantidadPersonas')(parseFloat(e.target.value) || 0)} className="w-14 px-1 py-0.5 text-xs border rounded text-center" /></td>
                          <td className="py-0.5"><input type="number" value={m.jornal} onChange={e => createMOHandler(i, 'jornal')(parseFloat(e.target.value) || 0)} className="w-16 px-1 py-0.5 text-xs border rounded text-right" /></td>
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
                  <thead><tr className="text-muted-foreground border-b"><th className="text-left py-0.5">Equipo</th><th className="text-right py-0.5">Horas</th><th className="text-right py-0.5">Q/hora</th><th className="text-right py-0.5">Subtotal</th></tr></thead>
                  <tbody>
                    {sub.equipos.map((e, i) => (
                      <tr key={i} className="border-b border-dashed border-border">
                        <td className="py-0.5 text-card-foreground">{e.descripcion}</td>
                        <td className="py-0.5"><input type="number" value={e.cantidad} onChange={evt => createEquipoHandler(i, 'cantidad')(parseFloat(evt.target.value) || 0)} className="w-14 px-1 py-0.5 text-xs border rounded text-right" /></td>
                        <td className="py-0.5"><input type="number" value={e.costoHora} onChange={evt => createEquipoHandler(i, 'costoHora')(parseFloat(evt.target.value) || 0)} className="w-16 px-1 py-0.5 text-xs border rounded text-right" /></td>
                        <td className="py-0.5 text-right font-semibold text-card-foreground">{fmtQ(e.cantidad * e.costoHora)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="font-bold text-amber-800"><td colSpan={3} className="py-0.5 text-right">Total Equipo por unidad</td><td className="py-0.5 text-right">{fmtQ(apu?.costoHerramienta ?? 0)}</td></tr></tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
            <span className="text-muted-foreground">Costo Unitario Total: <strong className="text-blue-800">{fmtQ(costoUnit)}</strong></span>
            <span className="text-muted-foreground">Subtotal: <strong className="text-blue-800">{fmtQ(subtotal)}</strong></span>
            <span className="text-muted-foreground">Tiempo: <strong>{dias.toFixed(2)} días</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}, areEqualRenglonCardProps);

function areEqualRenglonCardProps(prev: React.ComponentProps<typeof RenglonCard>, next: React.ComponentProps<typeof RenglonCard>) {
  if (prev.linea !== next.linea || prev.isOpen !== next.isOpen) return false;
  const p = prev.apu;
  const n = next.apu;
  if (!p && !n) return true;
  if (!p || !n) return false;
  return (
    p.costoMaterial === n.costoMaterial &&
    p.costoManoObra === n.costoManoObra &&
    p.costoHerramienta === n.costoHerramienta &&
    p.costoUnitario === n.costoUnitario &&
    p.subtotal === n.subtotal &&
    p.dias === n.dias &&
    p.totalPersonasDia === n.totalPersonasDia &&
    prev.onUpdate === next.onUpdate &&
    prev.onUpdateSubMaterial === next.onUpdateSubMaterial &&
    prev.onUpdateSubMO === next.onUpdateSubMO &&
    prev.onUpdateSubEquipo === next.onUpdateSubEquipo &&
    prev.onUpdateMemoria === next.onUpdateMemoria &&
    prev.onRemove === next.onRemove &&
    prev.onToggle === next.onToggle
  );
}

const Stat = React.memo<{ label: string; value: string; highlight?: boolean }>(({ label, value, highlight }) => (
  <div className={`p-2 rounded ${highlight ? 'bg-emerald-500 col-span-2 md:col-span-1' : 'bg-white/10'}`}>
    <div className="text-[10px] opacity-80 uppercase tracking-wider">{label}</div>
    <div className={`font-bold ${highlight ? 'text-base' : 'text-sm'}`}>{value}</div>
  </div>
));

export default PresupuestoScreen;
