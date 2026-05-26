import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Plus, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  id: string; nombre: string; codigo: string | null; unidad: string; cantidad_estimada: number; cantidad_utilizada: number; costo_unitario: number; proveedor: string | null;
}

interface Props { presupuestoId: string; onClose?: () => void; }

const MaterialesPanel: React.FC<Props> = ({ presupuestoId, onClose }) => {
  const [items, setItems] = useState<Material[]>([]);
  const [nuevo, setNuevo] = useState({ nombre: '', unidad: 'unidad', cantidad: 0 });

  const load = useCallback(async () => {
    const { data } = await supabase.from('materiales_proyecto').select('*').eq('presupuesto_id', presupuestoId);
    if (data) setItems(data as Material[]);
  }, [presupuestoId]);
  useEffect(() => { if (presupuestoId) load(); }, [presupuestoId, load]);

  const agregar = async () => {
    if (!nuevo.nombre) return;
    const { error } = await supabase.from('materiales_proyecto').insert({
      presupuesto_id: presupuestoId, nombre: nuevo.nombre, unidad: nuevo.unidad, cantidad_estimada: nuevo.cantidad,
    });
    if (error) toast.error('Error al agregar material');
    else { setNuevo({ nombre: '', unidad: 'unidad', cantidad: 0 }); await load(); }
  };

  const registrarUso = async (id: string, cantidad: number) => {
    try {
      const { error } = await supabase.from('movimientos_materiales').insert({ material_id: id, tipo: 'salida', cantidad });
      if (error) throw error;
      toast.success('Uso registrado');
      await load();
    } catch (err) {
      toast.error('Error al registrar uso de material');
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2.5 space-y-2">
      <div className="flex items-center gap-1.5">
        <Package className="w-4 h-4 text-emerald-600" />
        <h3 className="text-xs font-bold text-slate-700">Materiales</h3>
      </div>

      <div className="flex gap-1.5">
        <input value={nuevo.nombre} onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" className="flex-1 px-2 py-1 text-[10px] border rounded" />
        <input value={nuevo.cantidad || ''} onChange={e => setNuevo(p => ({ ...p, cantidad: Number(e.target.value) }))} type="number" placeholder="Cant" className="w-16 px-1 py-1 text-[10px] border rounded" />
        <button onClick={agregar} className="bg-emerald-600 text-white px-2 py-1 rounded text-[10px] font-semibold btn-press"><Plus className="w-3 h-3" /></button>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {items.map(m => {
          const restante = Number(m.cantidad_estimada) - Number(m.cantidad_utilizada);
          return (
            <div key={m.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-[11px] group">
              <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-700">{m.nombre}</span>
                <span className="text-slate-400 ml-1">{m.codigo ? `(${m.codigo})` : ''}</span>
                <div className="text-[9px] text-slate-400">
                  Est: {Number(m.cantidad_estimada).toFixed(0)} | Usado: {Number(m.cantidad_utilizada).toFixed(0)} | Restante: <span className={restante <= 0 ? 'text-red-500 font-bold' : 'text-emerald-600'}>{restante.toFixed(0)}</span>
                </div>
              </div>
              <div className="font-mono text-[10px] text-slate-500">Q{Number(m.costo_unitario).toFixed(0)}</div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                <button onClick={() => registrarUso(m.id, 1)} className="p-0.5 rounded hover:bg-emerald-100 text-emerald-600"><ArrowUpDown className="w-3 h-3" /></button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">Sin materiales registrados</p>}
      </div>
    </div>
  );
};

export default MaterialesPanel;
