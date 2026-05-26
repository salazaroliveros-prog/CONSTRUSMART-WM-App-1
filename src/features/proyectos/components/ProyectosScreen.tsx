import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Presupuesto } from '@/types/supabase';
import Header from '@/components/shared/Header';
import { Play, PauseCircle, CheckCircle, Folder, Filter, Edit3, Save, Trash2, X } from 'lucide-react';
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

const ProyectosScreen: React.FC = () => {
  const { presupuestos, updatePresupuesto, deleteProyecto, transicionFase } = useAppContext();
  const [filtroFase, setFiltroFase] = useState<Fase | 'todas'>('todas');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    ingresos: 0, gastos: 0, pendienteAportar: 0, avanceFisico: 0, avanceFinanciero: 0,
  });

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
      await deleteProyecto(id);
    } catch {
      toast.error('Error al eliminar proyecto');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-fadeIn">
      <Header title="Proyectos por Fase" />
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
              return (
                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition">
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
                        </div>
                      )}
                      {p.fase === 'ejecución' && !isEditing && (
                        <div className="mt-2 bg-slate-100 rounded-full h-1.5 max-w-[200px] overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${p.avanceFisico || 0}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
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
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};

export default ProyectosScreen;
