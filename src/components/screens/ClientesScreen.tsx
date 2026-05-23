import React, { useState } from 'react';
import { useAppContext, Cliente } from '@/contexts/AppContext';
import Header from '@/components/shared/Header';
import { Plus, Search, Trash2, Edit2, Phone, Mail, MapPin, Download, X } from 'lucide-react';
import { downloadCSV } from '@/lib/exporters';

const empty: Omit<Cliente, 'id'> = {
  nombre: '', telefono: '', email: '', direccion: '',
  tipoProyecto: 'Residencial', estado: 'Potencial', notas: '',
  fecha: new Date().toISOString().split('T')[0],
};

const ClientesScreen: React.FC = () => {
  const { clientes, addCliente, updateCliente, deleteCliente } = useAppContext();
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Cliente, 'id'>>(empty);

  const filtered = clientes.filter(c => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filtro === 'todos' || c.estado === filtro;
    return matchSearch && matchFilter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) updateCliente(editId, form);
    else addCliente(form);
    setForm(empty); setShowForm(false); setEditId(null);
  };

  const handleEdit = (c: Cliente) => {
    const { id, ...rest } = c;
    setForm(rest); setEditId(id); setShowForm(true);
  };

  const handleExport = () => {
    const rows = [
      ['Nombre', 'Teléfono', 'Email', 'Dirección', 'Tipo Proyecto', 'Estado', 'Fecha Registro', 'Notas'],
      ...clientes.map(c => [c.nombre, c.telefono, c.email, c.direccion, c.tipoProyecto, c.estado, c.fecha, c.notas]),
    ];
    downloadCSV(`clientes_WM-MS_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  const badge = (e: string) => {
    const colors: Record<string, string> = {
      Activo: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      Potencial: 'bg-amber-100 text-amber-700 border-amber-300',
      Cerrado: 'bg-slate-100 text-slate-700 border-slate-300',
    };
    return colors[e] || colors.Cerrado;
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-fadeIn">
      <Header title="Gestión de Clientes" />

      <div className="p-3 sm:p-5 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg" />
            </div>
            <select value={filtro} onChange={e => setFiltro(e.target.value)} className="px-3 py-2 text-sm border rounded-lg bg-white">
              <option value="todos">Todos los estados</option>
              <option value="Activo">Activos</option>
              <option value="Potencial">Potenciales</option>
              <option value="Cerrado">Cerrados</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-semibold">
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button onClick={() => { setShowForm(true); setEditId(null); setForm(empty); }} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-sm font-semibold">
              <Plus className="w-4 h-4" /> Nuevo Cliente
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-700 p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800">{editId ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); }}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input required placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
              <input type="email" placeholder="Correo electrónico" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
              <input placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className="px-3 py-2 text-sm border rounded-lg" />
              <select value={form.tipoProyecto} onChange={e => setForm({ ...form, tipoProyecto: e.target.value })} className="px-3 py-2 text-sm border rounded-lg bg-white">
                <option>Residencial</option><option>Comercial</option><option>Industrial</option><option>Civil</option><option>Pública</option>
              </select>
              <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as any })} className="px-3 py-2 text-sm border rounded-lg bg-white">
                <option>Potencial</option><option>Activo</option><option>Cerrado</option>
              </select>
              <textarea placeholder="Notas y observaciones" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="md:col-span-2 px-3 py-2 text-sm border rounded-lg" rows={2} />
              <button type="submit" className="md:col-span-2 bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-sm font-semibold">
                {editId ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-800 to-blue-700 text-white">
                <tr>
                  <th className="p-3 text-left text-xs">Cliente</th>
                  <th className="p-3 text-left text-xs hidden md:table-cell">Contacto</th>
                  <th className="p-3 text-left text-xs hidden lg:table-cell">Dirección</th>
                  <th className="p-3 text-left text-xs">Tipo</th>
                  <th className="p-3 text-left text-xs">Estado</th>
                  <th className="p-3 text-center text-xs">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b hover:bg-blue-50/50 transition">
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{c.nombre}</div>
                      <div className="text-[10px] text-slate-500">{c.fecha}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-xs">
                      <div className="flex items-center gap-1 text-slate-600"><Phone className="w-3 h-3" />{c.telefono}</div>
                      <div className="flex items-center gap-1 text-slate-600"><Mail className="w-3 h-3" />{c.email}</div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-slate-600"><MapPin className="w-3 h-3 inline mr-1" />{c.direccion}</td>
                    <td className="p-3 text-xs">{c.tipoProyecto}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge(c.estado)}`}>{c.estado}</span></td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleEdit(c)} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteCliente(c.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">Sin clientes registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientesScreen;
