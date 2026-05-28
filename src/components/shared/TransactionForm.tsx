import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Transaccion } from '@/types/supabase';
import { Plus, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

const categorias: { v: Transaccion['categoria']; label: string }[] = [
  { v: 'materiales', label: 'Materiales' },
  { v: 'mano-obra', label: 'Mano de Obra' },
  { v: 'herramienta', label: 'Herramienta' },
  { v: 'sub-contrato', label: 'Sub-Contrato' },
  { v: 'administrativo', label: 'Administrativo' },
  { v: 'personal', label: 'Personal' },
  { v: 'transporte', label: 'Transporte' },
  { v: 'fijos', label: 'Gastos Fijos' },
  { v: 'hogar', label: 'Hogar' },
  { v: 'aporte', label: 'Aporte' },
  { v: 'trabajos-extra', label: 'Trabajos Extra (Planificación, Planos, 3D, Topografía)' },
];

const TransactionForm: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { presupuestos, addTransaccion } = useAppContext();
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('gasto');
  const [form, setForm] = useState({
    proyectoId: 'admin',
    descripcion: '',
    cantidad: 1,
    unidad: 'global',
    categoria: 'materiales' as Transaccion['categoria'],
    costoUnitario: 0,
    fecha: new Date().toISOString().split('T')[0],
  });

  const total = form.cantidad * form.costoUnitario;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descripcion) return;
    addTransaccion({ ...form, tipo, costoTotal: total });
    setForm({ ...form, descripcion: '', cantidad: 1, costoUnitario: 0 });
  };

  return (
    <div className="bg-card dark:bg-card rounded-xl shadow-md border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" /> Registro Rápido
        </h3>
        <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
          <button onClick={() => setTipo('ingreso')} className={`px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${tipo === 'ingreso' ? 'bg-emerald-500 text-white' : 'text-card-foreground'}`}>
            <TrendingUp className="w-3 h-3" /> Ingreso
          </button>
          <button onClick={() => setTipo('gasto')} className={`px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${tipo === 'gasto' ? 'bg-red-500 text-white' : 'text-card-foreground'}`}>
            <TrendingDown className="w-3 h-3" /> Gasto
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
<select value={form.proyectoId} onChange={e => setForm({ ...form, proyectoId: e.target.value })} className="col-span-2 px-2 py-1.5 text-xs border rounded-lg bg-muted border-border focus:ring-2 focus:ring-blue-500" required>
           <option value="">-- Seleccionar proyecto --</option>
           <option value="admin">— Administrativo —</option>
           <option value="personal">— Gasto Personal —</option>
           {presupuestos.filter(p => p.fase !== 'finalizado').map(p => <option key={p.id} value={p.id}>{p.proyecto}</option>)}
         </select>
         <input placeholder="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} className="col-span-2 px-2 py-1.5 text-xs border rounded-lg" required />
         <input type="number" placeholder="Cantidad" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: parseFloat(e.target.value) || 0 })} className="px-2 py-1.5 text-xs border rounded-lg" />
         <input placeholder="Unidad (ej: m², kg)" value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} className="px-2 py-1.5 text-xs border rounded-lg" />
         <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as Transaccion['categoria'] })} className="col-span-2 px-2 py-1.5 text-xs border rounded-lg bg-muted">
           {categorias.map(c => <option key={c.v} value={c.v}>{c.label}</option>)}
         </select>
         <input type="number" placeholder="Costo unitario" value={form.costoUnitario} onChange={e => setForm({ ...form, costoUnitario: parseFloat(e.target.value) || 0 })} className="px-2 py-1.5 text-xs border rounded-lg" />
         <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="px-2 py-1.5 text-xs border rounded-lg" />
        <div className="col-span-2 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-900 dark:text-blue-300 text-right">
          Total: Q {total.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
        </div>
        <button type="submit" className={`col-span-2 ${tipo === 'ingreso' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1`}>
          <Plus className="w-3 h-3" /> Registrar {tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
