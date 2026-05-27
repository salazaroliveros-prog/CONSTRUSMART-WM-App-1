import React, { useMemo, useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Presupuesto } from '@/types/supabase';
import PageShell from '@/components/shared/PageShell';
import { Play, PauseCircle, CheckCircle, Folder, Filter, Edit3, Save, Trash2, X, ChevronDown, ChevronRight, DollarSign, TrendingUp, TrendingDown, Ruler, Percent } from 'lucide-react';
import { toast } from 'sonner';

type Fase = Presupuesto['fase'];
const nextFase: Record<Fase, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; fase: Fase } | null> = {
  'planeación': { label: 'Iniciar Ejecución', icon: Play, color: 'bg-blue-600 hover:bg-blue-700', fase: 'ejecución' },
  'ejecución': { label: 'Pausar', icon: PauseCircle, color: 'bg-amber-500 hover:bg-amber-600', fase: 'pausa' },
  'pausa': { label: 'Reanudar', icon: Play, color: 'bg-blue-600 hover:bg-blue-700', fase: 'ejecución' },
  'finalizado': null,
};
const faseLabels: Record<Fase, string> = { 'planeación': 'Planeación', 'ejecución': 'Ejecución', 'pausa': 'Pausa', 'finalizado': 'Finalizado' };
const faseColors: Record<Fase, string> = {
  'planeación': 'bg-purple-100 text-purple-800 border-purple-300',
  'ejecución': 'bg-blue-100 text-blue-800 border-blue-300',
  'pausa': 'bg-amber-100 text-amber-800 border-amber-300',
  'finalizado': 'bg-emerald-100 text-emerald-800 border-emerald-300',
};
const faseBadgeColors: Record<Fase, string> = {
  'planeación': 'from-purple-500 to-purple-600',
  'ejecución': 'from-blue-500 to-blue-600',
  'pausa': 'from-amber-500 to-amber-600',
  'finalizado': 'from-emerald-500 to-emerald-600',
};

const FASES: Fase[] = ['planeación', 'ejecución', 'pausa', 'finalizado'];

interface EditForm {
  ingresos: number;
  gastos: number;
  pendienteAportar: number;
  avanceFisico: number;
  avanceFinanciero: number;
}

interface RenglonDetalle {
  id: string;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  costoMaterial: number;
  costoManoObra: number;
  costoHerramienta: number;
  rendimiento: number;
  avance: number;
}

const ProyectosScreen: React.FC = () => {
  const { presupuestos, updatePresupuesto, transicionFase, deletePresupuesto } = useAppContext();
  const [filtroFase, setFiltroFase] = useState<Fase | 'todas'>('todas');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    ingresos: 0, gastos: 0, pendienteAportar: 0, avanceFisico: 0, avanceFinanciero: 0,
  });
  const [renglonAvances, setRenglonAvances] = useState<Record<string, number>>({});

  const filtrados = useMemo(() => {
    let r = presupuestos;
    if (filtroFase !== 'todas') r = r.filter(p => p.fase === filtroFase);
    if (search) r = r.filter(p => p.proyecto.toLowerCase().includes(search.toLowerCase()) || (p.cliente || '').toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [presupuestos, filtroFase, search]);

  const stats = useMemo(() => ({
    total: presupuestos.length,
    porFase: Object.fromEntries(FASES.map(f => [f, presupuestos.filter(p => p.fase === f).length])) as Record<Fase, number>,
  }), [presupuestos]);

  const startEditing = (p: Presupuesto) => {
    setEditingId(p.id);
    setEditForm({
      ingresos: p.ingresos ?? 0,
      gastos: p.gastos ?? 0,
      pendienteAportar: p.pendienteAportar ?? 0,
      avanceFisico: p.avanceFisico ?? 0,
      avanceFinanciero: p.avanceFinanciero ?? 0,
    });
  };

  const saveEditing = async (id: string) => {
    try {
      await updatePresupuesto(id, editForm);
      setEditingId(null);
      toast.success('Datos financieros actualizados');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDelete = async (id: string, proyecto: string) => {
    if (!window.confirm(`¿Eliminar el proyecto "${proyecto}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deletePresupuesto(id);
    } catch {
      toast.error('Error al eliminar proyecto');
    }
  };

  const parseLineas = (lineas: unknown[]): RenglonDetalle[] => {
    return (lineas || []).map(l => {
      const r = l as Record<string, unknown>;
      return {
        id: String(r.id || ''),
        codigo: String(r.codigo || ''),
        descripcion: String(r.descripcion || ''),
        unidad: String(r.unidad || ''),
        cantidad: Number(r.cantidad) || 0,
        costoMaterial: Number(r.costoMaterial) || 0,
        costoManoObra: Number(r.costoManoObra) || 0,
        costoHerramienta: Number(r.costoHerramienta) || 0,
        rendimiento: Number(r.rendimiento) || 0,
        avance: Number(r.avance) || 0,
      };
    });
  };

  const CalcularSubtotal = (r: RenglonDetalle) => r.cantidad * (r.costoMaterial + r.costoManoObra + r.costoHerramienta);
  const avancePonderado = (renglones: RenglonDetalle[]) => {
    const total = renglones.reduce((s, r) => s + CalcularSubtotal(r), 0);
    if (total === 0) return 0;
    return renglones.reduce((s, r) => s + (renglonAvances[r.id] ?? r.avance) * CalcularSubtotal(r), 0) / total;
  };

  const guardarAvancesRenglones = useCallback(async (presupuestoId: string, p: Presupuesto) => {
    const current = parseLineas(p.lineas);
    const updated = current.map(r => ({ ...r, avance: Number((renglonAvances[r.id] ?? r.avance) || 0) }));
    const total = current.reduce((s, r) => s + CalcularSubtotal(r), 0);
    const ponderado = total === 0 ? 0 : current.reduce((s, r) => s + (Number((renglonAvances[r.id] ?? r.avance) || 0)) * CalcularSubtotal(r), 0) / total;
    try {
      await updatePresupuesto(presupuestoId, { lineas: updated, avanceFisico: Math.round(ponderado) });
      toast.success(`Avances guardados — Progreso general: ${Math.round(ponderado)}%`);
      setRenglonAvances({});
    } catch { toast.error('Error al guardar avances'); }
  }, [renglonAvances, updatePresupuesto]);

  return (
    <PageShell showHome={false} title="Proyectos por Fase">
      <div className="p-3 sm:p-5 max-w-[1600px] mx-auto space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => setFiltroFase('todas')}
            className={`p-3 rounded-xl shadow-sm border text-left transition ${filtroFase === 'todas' ? 'bg-blue-900 text-white border-blue-800' : 'bg-white hover:bg-slate-50'}`}>
            <div className="text-lg font-bold">{stats.total}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">Todos</div>
          </button>
          {FASES.map(f => (
            <button key={f} onClick={() => setFiltroFase(f)}
              className={`p-3 rounded-xl shadow-sm border text-left transition ${filtroFase === f ? `${faseBadgeColors[f]} text-white` : 'bg-white hover:bg-slate-50'}`}>
              <div className="text-lg font-bold">{stats.porFase[f]}</div>
              <div className="text-[10px] uppercase tracking-wider opacity-70">{faseLabels[f]}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input placeholder="Buscar proyecto..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border rounded-lg" />
          <Filter className="w-4 h-4 text-slate-400" />
        </div>

        <div className="space-y-2">
          {filtrados.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center text-slate-400 text-sm">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-30" />
              No hay proyectos en esta categoría
            </div>
          )}
          {FASES.map(f => {
            const items = filtrados.filter(p => p.fase === f);
            if (items.length === 0 && filtroFase !== 'todas' && filtroFase !== f) return null;
            if (filtroFase !== 'todas' && filtroFase !== f) return null;
            return items.map(p => {
              const accion = nextFase[p.fase];
              const isEditing = editingId === p.id;
              const isExpanded = expandedId === p.id;
              const renglones = parseLineas(p.lineas);
              const totalRenglones = renglones.reduce((s, r) => s + CalcularSubtotal(r), 0);
              return (
                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                  {/* Cabecera */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm">{p.proyecto}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${faseColors[p.fase]}`}>{faseLabels[p.fase]}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{p.cliente || 'Sin cliente'} · {p.tipologia || 'General'}</div>

                        {isEditing ? (
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                            <div>
                              <label className="text-[9px] font-semibold text-slate-500">Ingresos (Q)</label>
                              <input type="number" value={editForm.ingresos}
                                onChange={e => setEditForm(f => ({ ...f, ingresos: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-2 py-1 text-xs border rounded" />
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-slate-500">Gastos (Q)</label>
                              <input type="number" value={editForm.gastos}
                                onChange={e => setEditForm(f => ({ ...f, gastos: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-2 py-1 text-xs border rounded" />
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-slate-500">Pendiente (Q)</label>
                              <input type="number" value={editForm.pendienteAportar}
                                onChange={e => setEditForm(f => ({ ...f, pendienteAportar: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-2 py-1 text-xs border rounded" />
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-slate-500">Avance Físico %</label>
                              <input type="number" min={0} max={100} value={editForm.avanceFisico}
                                onChange={e => setEditForm(f => ({ ...f, avanceFisico: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-2 py-1 text-xs border rounded" />
                            </div>
                            <div>
                              <label className="text-[9px] font-semibold text-slate-500">Avance Financiero %</label>
                              <input type="number" min={0} max={100} value={editForm.avanceFinanciero}
                                onChange={e => setEditForm(f => ({ ...f, avanceFinanciero: parseFloat(e.target.value) || 0 }))}
                                className="w-full px-2 py-1 text-xs border rounded" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4 mt-2 text-xs text-slate-600 flex-wrap">
                            <span>Total: <strong className="text-blue-900">Q {(p.total || 0).toLocaleString()}</strong></span>
                            <span>Avance: <strong>{p.avanceFisico || 0}%</strong></span>
                            <span>Ingresos: <strong className="text-emerald-700">Q {(p.ingresos || 0).toLocaleString()}</strong></span>
                            <span>Gastos: <strong className="text-red-700">Q {(p.gastos || 0).toLocaleString()}</strong></span>
                            <span>Pendiente: <strong className="text-amber-700">Q {(p.pendienteAportar || 0).toLocaleString()}</strong></span>
                            {renglones.length > 0 && <span>Renglones: <strong>{renglones.length}</strong></span>}
                          </div>
                        )}
                        {p.fase === 'ejecución' && !isEditing && (
                          <div className="mt-2 bg-slate-100 rounded-full h-1.5 max-w-[200px] overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${p.avanceFisico || 0}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0 flex-wrap">
                        {/* Expandir / Detalle */}
                        {renglones.length > 0 && (
                          <button onClick={() => setExpandedId(isExpanded ? null : p.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            {isExpanded ? 'Cerrar' : 'Renglones'}
                          </button>
                        )}
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEditing(p.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition">
                              <Save className="w-3.5 h-3.5" /> Guardar
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-300 hover:bg-slate-400 text-slate-700 transition">
                              <X className="w-3.5 h-3.5" /> Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditing(p)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
                              <Edit3 className="w-3.5 h-3.5" /> Editar
                            </button>
                            {accion && (
                              <button onClick={() => transicionFase(p.id, accion.fase)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${accion.color} transition`}>
                                <accion.icon className="w-3.5 h-3.5" /> {accion.label}
                              </button>
                            )}
                            {p.fase !== 'finalizado' && (
                              <button onClick={() => transicionFase(p.id, 'finalizado')}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition">
                                <CheckCircle className="w-3.5 h-3.5" /> Finalizar
                              </button>
                            )}
                            <button onClick={() => handleDelete(p.id, p.proyecto)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-600 transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel expandible: Renglones + Financiero */}
                  {isExpanded && renglones.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      <div className="p-4 space-y-3">
                        {/* Resumen financiero */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-semibold uppercase tracking-wider mb-1">
                              <TrendingUp className="w-3 h-3" /> Ingresos
                            </div>
                            <div className="text-lg font-bold text-slate-900">Q {(p.ingresos || 0).toLocaleString()}</div>
                          </div>
                          <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-semibold uppercase tracking-wider mb-1">
                              <TrendingDown className="w-3 h-3" /> Gastos
                            </div>
                            <div className="text-lg font-bold text-slate-900">Q {(p.gastos || 0).toLocaleString()}</div>
                          </div>
                          <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center gap-1.5 text-amber-600 text-[10px] font-semibold uppercase tracking-wider mb-1">
                              <DollarSign className="w-3 h-3" /> Pendiente
                            </div>
                            <div className="text-lg font-bold text-slate-900">Q {(p.pendienteAportar || 0).toLocaleString()}</div>
                          </div>
                          <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="flex items-center gap-1.5 text-blue-700 text-[10px] font-semibold uppercase tracking-wider mb-1">
                              <Ruler className="w-3 h-3" /> Costo Directo
                            </div>
                            <div className="text-lg font-bold text-slate-900">Q {(p.costo_directo || 0).toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Tabla de renglones */}
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                          <div className="bg-slate-100 px-3 py-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                              Renglones de presupuesto ({renglones.length})
                            </span>
                            <span className="text-[10px] font-bold text-blue-700">
                              Avance total: {Math.round(avancePonderado(renglones))}%
                            </span>
                          </div>
                          <div className="overflow-x-auto max-h-80 overflow-y-auto">
                            <table className="w-full text-[11px]">
                              <thead className="sticky top-0 bg-slate-50">
                                <tr className="border-b border-slate-200">
                                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Código</th>
                                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Descripción</th>
                                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Cant.</th>
                                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Unidad</th>
                                  <th className="text-right px-3 py-2 font-semibold text-slate-600">Subtotal (Q)</th>
                                  <th className="text-center px-3 py-2 font-semibold text-slate-600">Avance %</th>
                                </tr>
                              </thead>
                              <tbody>
                                {renglones.map(r => {
                                  const av = renglonAvances[r.id] ?? r.avance;
                                  const sub = CalcularSubtotal(r);
                                  return (
                                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                                      <td className="px-3 py-2 text-slate-500 font-mono">{r.codigo}</td>
                                      <td className="px-3 py-2 font-medium text-slate-800 max-w-[200px] truncate">{r.descripcion}</td>
                                      <td className="px-3 py-2 text-right text-slate-700">{r.cantidad} <span className="text-slate-400">{r.unidad}</span></td>
                                      <td className="px-3 py-2 text-right text-slate-500">{r.unidad}</td>
                                      <td className="px-3 py-2 text-right font-medium text-blue-800">Q {sub.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                                      <td className="px-3 py-2 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          <input type="range" min={0} max={100} value={av}
                                            onChange={e => setRenglonAvances(p => ({ ...p, [r.id]: Number(e.target.value) }))}
                                            className="w-20 h-1.5 accent-blue-600 cursor-pointer" />
                                          <input type="number" min={0} max={100} value={av}
                                            onChange={e => setRenglonAvances(p => ({ ...p, [r.id]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                                            className="w-12 px-1 py-0.5 text-[10px] border rounded text-right" />
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="bg-blue-50">
                                  <td colSpan={4} className="px-3 py-2 text-right font-bold text-slate-700">TOTAL RENGLONES</td>
                                  <td className="px-3 py-2 text-right font-bold text-blue-900">Q {totalRenglones.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
                                  <td className="px-3 py-2 text-center font-bold text-blue-800">
                                    <div className="flex items-center justify-center gap-2">
                                      <Percent className="w-3 h-3" />
                                      {Math.round(avancePonderado(renglones))}%
                                      {Object.keys(renglonAvances).length > 0 && (
                                        <button onClick={() => guardarAvancesRenglones(p.id, p)}
                                          className="ml-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white">
                                          Guardar
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        {/* Factores del presupuesto */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
                          <div className="bg-white rounded border border-slate-200 px-3 py-2">
                            <span className="text-slate-500">Indirectos:</span>{' '}
                            <span className="font-semibold">{p.factor_indirectos || 0}%</span>
                          </div>
                          <div className="bg-white rounded border border-slate-200 px-3 py-2">
                            <span className="text-slate-500">Administrativos:</span>{' '}
                            <span className="font-semibold">{p.factor_administrativos || 0}%</span>
                          </div>
                          <div className="bg-white rounded border border-slate-200 px-3 py-2">
                            <span className="text-slate-500">Imprevistos:</span>{' '}
                            <span className="font-semibold">{p.factor_imprevistos || 0}%</span>
                          </div>
                          <div className="bg-white rounded border border-slate-200 px-3 py-2">
                            <span className="text-slate-500">Utilidad:</span>{' '}
                            <span className="font-semibold">{p.factor_utilidad || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>
    </PageShell>
  );
};

export default ProyectosScreen;
