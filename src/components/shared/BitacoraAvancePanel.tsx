import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { Avance, AvanceSchema } from '@/lib/schemas';

interface BitacoraAvancePanelProps {
  presupuestoId: string;
  onAvanceChange?: (avanceFisico: number) => Promise<void>;
}

export const BitacoraAvancePanel: React.FC<BitacoraAvancePanelProps> = ({ presupuestoId, onAvanceChange }) => {
  const [avances, setAvances] = useState<Avance[]>([]);
  const [nuevoAvance, setNuevoAvance] = useState({ avance: 0, descripcion: '' });
  const [loading, setLoading] = useState(false);

  const fetchAvances = useCallback(async () => {
    const { data, error } = await supabase
      .from('bitacora_avance')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('fecha', { ascending: false });

    if (!error && data) {
      setAvances(data.map(a => AvanceSchema.parse(a)));
    }
  }, [presupuestoId]);

  useEffect(() => { fetchAvances(); }, [fetchAvances]);

  const handleAdd = async () => {
    if (nuevoAvance.avance <= 0) {
      toast.error('El avance debe ser mayor a 0');
      return;
    }
    setLoading(true);
    try {
      const { error: errorBitacora } = await supabase.from('bitacora_avance').insert({
        presupuesto_id: presupuestoId,
        avance_fisico: nuevoAvance.avance,
        descripcion: nuevoAvance.descripcion,
        fecha: new Date().toISOString()
      });
      if (errorBitacora) throw errorBitacora;

      if (onAvanceChange) {
        await onAvanceChange(nuevoAvance.avance);
      } else {
        const { error: errorPresupuesto } = await supabase
          .from('presupuestos')
          .update({ avance_fisico: nuevoAvance.avance })
          .eq('id', presupuestoId);
        if (errorPresupuesto) throw errorPresupuesto;
      }

      toast.success('Avance registrado y presupuesto actualizado');
      setNuevoAvance({ avance: 0, descripcion: '' });
      await fetchAvances();
    } catch (e) {
      toast.error('Error al guardar avance');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro de avance?')) return;
    try {
      const { error } = await supabase.from('bitacora_avance').delete().eq('id', id);
      if (error) throw error;
      toast.success('Registro eliminado');
      await fetchAvances();
    } catch (e) {
      toast.error('Error al eliminar');
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mt-4">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Bitácora de Avance</h3>
      <div className="flex gap-2 mb-4">
        <input type="number" placeholder="%" className="w-20 p-2 text-xs border rounded" value={nuevoAvance.avance} onChange={e => setNuevoAvance({...nuevoAvance, avance: Number(e.target.value)})} />
        <input placeholder="Descripción del hito" className="flex-1 p-2 text-xs border rounded" value={nuevoAvance.descripcion} onChange={e => setNuevoAvance({...nuevoAvance, descripcion: e.target.value})} />
        <button onClick={handleAdd} disabled={loading} className="bg-blue-700 text-white px-3 py-2 rounded text-xs"><Plus className="w-4 h-4" /></button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {avances.map(a => (
          <div key={a.id} className="flex items-center justify-between p-2 border rounded text-xs hover:bg-slate-50">
            <div>
              <span className="font-bold text-emerald-600">{a.avance_fisico}%</span> - {a.descripcion}
              <span className="text-slate-400 ml-2 text-[10px]">{new Date(a.fecha).toLocaleDateString()}</span>
            </div>
            <button onClick={() => handleDelete(a.id!)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
