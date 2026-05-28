import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/AppContext';
import { Cliente } from '@/types/supabase';
import PageShell from '@/components/shared/PageShell';
import { Plus, Search, Trash2, Edit2, Phone, Mail, MapPin, Download, X } from 'lucide-react';
import { downloadCSV } from '@/lib/exporters';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

import { DateUtils } from '@/utils/dateUtils';

const ClientesScreen: React.FC = () => {
  const { clientes, addCliente, updateCliente, deleteCliente } = useAppContext();
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Cliente, 'id'>>({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipoProyecto: 'Residencial',
    estado: 'Potencial',
    notas: '',
    fecha: DateUtils.todayISO(),
  });

  const resetForm = () => setForm({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    tipoProyecto: 'Residencial',
    estado: 'Potencial',
    notas: '',
    fecha: DateUtils.todayISO(),
  });

  const filtered = clientes.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filtro === 'todos' || c.estado === filtro;
    return matchSearch && matchFilter;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) await updateCliente(editId, form);
      else await addCliente(form);
      resetForm(); setShowForm(false); setEditId(null);
    } catch (err) {
      toast.error('Error al guardar cliente');
      console.error(err);
    }
  };

  const handleEdit = (c: Cliente) => {
    const { id, ...rest } = c;
    setForm(rest as Omit<Cliente, 'id'>); setEditId(id); setShowForm(true);
  };

  const handleNew = () => {
    resetForm(); setEditId(null); setShowForm(true);
  };

  const handleExport = () => {
    const rows = [
      ['Nombre', 'Teléfono', 'Email', 'Dirección', 'Tipo Proyecto', 'Estado', 'Fecha Registro', 'Notas'],
      ...clientes.map(c => [c.nombre, c.telefono, c.email, c.direccion, c.tipoProyecto, c.estado, c.fecha, c.notas]),
    ];
    downloadCSV(`clientes_WM-MS_${DateUtils.todayISO()}.csv`, rows);
  };

  const badge = (e: string) => {
    const colors: Record<string, string> = {
      Activo: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
      Potencial: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      Cerrado: 'bg-muted text-card-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border',
    };
    return colors[e] || colors.Cerrado;
  };

  return (
    <PageShell showHome={false} title="Gestión de Clientes">
      <div className="p-3 sm:p-5 max-w-7xl mx-auto">
        <div className="bg-card rounded-xl shadow-md p-4 mb-4 flex flex-wrap items-center gap-3 justify-between border dark:border-border">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background dark:bg-muted dark:border-border dark:text-foreground" />
            </div>
            <select value={filtro} onChange={e => setFiltro(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-background dark:bg-muted dark:border-border dark:text-foreground">
              <option value="todos">Todos los estados</option>
              <option value="Activo">Activos</option>
              <option value="Potencial">Potenciales</option>
              <option value="Cerrado">Cerrados</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-2 rounded-lg text-sm font-semibold transition">
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button onClick={() => { handleNew(); }} className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-semibold transition shadow-sm">
              <Plus className="w-4 h-4" /> Nuevo Cliente
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-card rounded-xl shadow-lg border-l-4 border-primary p-4 mb-4 border dark:border-border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-card-foreground">{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => { setShowForm(false); }} className="p-1 hover:bg-muted rounded transition" aria-label="Cerrar formulario"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input required placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="px-3 py-2 text-sm border rounded-lg bg-background dark:bg-muted dark:border-border dark:text-foreground" />
              <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="px-3 py-2 text-sm border rounded-lg bg-background dark:bg-muted dark:border-border dark:text-foreground" />
              <input type="email" placeholder="Correo electrónico" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="px-3 py-2 text-sm border rounded-lg bg-background dark:bg-muted dark:border-border dark:text-foreground" />
              <input placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className="px-3 py-2 text-sm border rounded-lg bg-background dark:bg-muted dark:border-border dark:text-foreground" />
              <select value={form.tipoProyecto} onChange={e => setForm({ ...form, tipoProyecto: e.target.value })} className="px-3 py-2 text-sm border rounded-lg bg-background dark:bg-muted dark:border-border dark:text-foreground">
                <option>Residencial</option><option>Comercial</option><option>Industrial</option><option>Civil</option><option>Pública</option>
              </select>
               <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as 'Potencial' | 'Activo' | 'Cerrado' })} className="px-3 py-2 text-sm border rounded-lg bg-background dark:bg-muted dark:border-border dark:text-foreground">
                <option>Potencial</option><option>Activo</option><option>Cerrado</option>
              </select>
              <textarea placeholder="Notas y observaciones" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="md:col-span-2 px-3 py-2 text-sm border rounded-lg bg-background dark:bg-muted dark:border-border dark:text-foreground" rows={2} />
              <button type="submit" className="md:col-span-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-sm font-semibold transition shadow-sm">
                {editId ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-card rounded-xl shadow-md overflow-hidden border dark:border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-800 to-blue-700 text-white">
                <tr>
                  <th className="p-3 text-left text-xs uppercase tracking-wider font-bold">Cliente</th>
                  <th className="p-3 text-left text-xs uppercase tracking-wider font-bold hidden md:table-cell">Contacto</th>
                  <th className="p-3 text-left text-xs uppercase tracking-wider font-bold hidden lg:table-cell">Dirección</th>
                  <th className="p-3 text-left text-xs uppercase tracking-wider font-bold">Tipo</th>
                  <th className="p-3 text-left text-xs uppercase tracking-wider font-bold">Estado</th>
                  <th className="p-3 text-center text-xs uppercase tracking-wider font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b dark:border-border hover:bg-muted/30 transition">
                    <td className="p-3">
                      <div className="font-semibold text-card-foreground">{c.nombre}</div>
                      <div className="text-[10px] text-muted-foreground">{c.fecha}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-xs">
                      <div className="flex items-center gap-1 text-card-foreground opacity-80"><Phone className="w-3 h-3" />{c.telefono}</div>
                      <div className="flex items-center gap-1 text-card-foreground opacity-80"><Mail className="w-3 h-3" />{c.email}</div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground"><MapPin className="w-3 h-3 inline mr-1" />{c.direccion}</td>
                    <td className="p-3 text-xs">{c.tipoProyecto}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge(c.estado)}`}>{c.estado}</span></td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleEdit(c)} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setConfirmDelete(c.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Sin clientes registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={o => { if (!o) setConfirmDelete(null); }}
        onConfirm={async () => { try { if (confirmDelete) await deleteCliente(confirmDelete); } catch (err) { toast.error('Error al eliminar cliente'); console.error(err); } finally { setConfirmDelete(null); } }}
        title="Eliminar cliente"
        description="Esta acción no se puede deshacer. ¿Estás seguro de eliminar este cliente?"
        confirmText="Aceptar"
      />
    </PageShell>
  );
};

export default ClientesScreen;
