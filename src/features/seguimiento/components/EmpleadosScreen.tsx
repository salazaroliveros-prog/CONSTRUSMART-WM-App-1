import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import PageShell from '@/components/shared/PageShell';
import { toast } from 'sonner';
import { 
  Users, Plus, Search, Edit2, Trash2, X, Save, 
  Phone, Briefcase, DollarSign, UserCheck, UserMinus 
} from 'lucide-react';
import type { Empleado, CreateEmpleado } from '@/types/supabase';

const EmpleadosScreen: React.FC = () => {
  const { session, empleados, addEmpleado, updateEmpleado, deleteEmpleado } = useAppContext();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState<CreateEmpleado>({
    nombre: '',
    puesto: 'Operario',
    telefono: '',
    salario_diario: 0,
    activo: true,
  });

  const filtered = useMemo(() => {
    return empleados.filter(e => 
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.puesto.toLowerCase().includes(search.toLowerCase())
    );
  }, [empleados, search]);

  const resetForm = () => {
    setForm({ nombre: '', puesto: 'Operario', telefono: '', salario_diario: 0, activo: true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (e: Empleado) => {
    setForm({
      nombre: e.nombre,
      puesto: e.puesto,
      telefono: e.telefono,
      salario_diario: e.salario_diario,
      activo: e.activo,
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return; }
    setLoading(true);
    try {
      if (editingId) {
        await updateEmpleado(editingId, form);
      } else {
        await addEmpleado(form);
      }
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este empleado?')) return;
    try {
      await deleteEmpleado(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageShell showHome={false} title="Recursos Humanos">
      <div className="p-4 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar empleado o puesto..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-standard pl-9 w-full"
            />
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Empleado
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(e => (
            <div key={e.id} className={`card-standard border-l-4 ${e.activo ? 'border-l-emerald-500' : 'border-l-slate-400'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${e.activo ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-card-foreground leading-tight">{e.nombre}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> {e.puesto}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(e)} className="p-1.5 text-muted-foreground hover:text-blue-500 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono:</span>
                  <span className="text-card-foreground font-medium">{e.telefono || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Salario Diario:</span>
                  <span className="text-emerald-700 font-bold">Q {e.salario_diario.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {e.activo ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                    <UserCheck className="w-3 h-3" /> ACTIVO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    <UserMinus className="w-3 h-3" /> INACTIVO
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No se encontraron empleados registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-card dark:bg-card rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                {editingId ? <Edit2 className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
                {editingId ? 'Editar Colaborador' : 'Registrar Colaborador'}
              </h2>
              <button onClick={resetForm} className="p-1 text-muted-foreground hover:bg-accent rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Nombre Completo</label>
                <input 
                  type="text" 
                  value={form.nombre} 
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  className="input-standard w-full"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Puesto / Cargo</label>
                  <input 
                    type="text" 
                    value={form.puesto} 
                    onChange={e => setForm({...form, puesto: e.target.value})}
                    className="input-standard w-full"
                    placeholder="Ej: Maestro de Obra"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Teléfono</label>
                  <input 
                    type="text" 
                    value={form.telefono} 
                    onChange={e => setForm({...form, telefono: e.target.value})}
                    className="input-standard w-full"
                    placeholder="####-####"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Salario Diario (Q)</label>
                  <input 
                    type="number" 
                    value={form.salario_diario || ''} 
                    onChange={e => setForm({...form, salario_diario: parseFloat(e.target.value) || 0})}
                    className="input-standard w-full text-right"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={form.activo} 
                      onChange={e => setForm({...form, activo: e.target.checked})}
                      className="w-4 h-4 accent-emerald-500 rounded border-border"
                    />
                    <span className="text-sm font-medium text-muted-foreground">Activo</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-border bg-muted/30">
              <button onClick={resetForm} className="btn-secondary text-sm">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="btn-primary text-sm px-6">
                {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default EmpleadosScreen;
