import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { Avance, AvanceSchema } from '@/lib/schemas';
import { BitacoraAvanceService } from '@/services/seguimiento/BitacoraAvanceService';
import { PresupuestosService } from '@/services/presupuestos/PresupuestosService';

interface BitacoraAvancePanelProps {
  presupuestoId: string;
  onAvanceChange?: (avanceFisico: number) => Promise<void>;
}

export const BitacoraAvancePanel: React.FC<BitacoraAvancePanelProps> = ({ presupuestoId, onAvanceChange }) => {
  const [avances, setAvances] = useState<Avance[]>([]);
  const [nuevoAvance, setNuevoAvance] = useState({ avance: 0, notas: '' });
  const [loading, setLoading] = useState(false);

  const fetchAvances = useCallback(async () => {
    try {
      const data = await BitacoraAvanceService.getAvances(presupuestoId);
      setAvances(data.map(a => AvanceSchema.parse(a)));
    } catch (error) {
      console.error('Error fetching avances:', error);
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
      await BitacoraAvanceService.addAvance({
        presupuesto_id: presupuestoId,
        avance: nuevoAvance.avance,
        notas: nuevoAvance.notas,
        fecha: new Date().toISOString(),
      });

      if (onAvanceChange) {
        await onAvanceChange(nuevoAvance.avance);
      } else {
        await PresupuestosService.updateAvance(presupuestoId, { avance_fisico: nuevoAvance.avance });
      }

      toast.success('Avance registrado y presupuesto actualizado');
      setNuevoAvance({ avance: 0, notas: '' });
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
      await BitacoraAvanceService.deleteAvance(id);
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
        <input placeholder="Descripción del hito" className="flex-1 p-2 text-xs border rounded" value={nuevoAvance.notas} onChange={e => setNuevoAvance({...nuevoAvance, notas: e.target.value})} />
        <button onClick={handleAdd} disabled={loading} className="bg-blue-700 text-white px-3 py-2 rounded text-xs"><Plus className="w-4 h-4" /></button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {avances.map(a => (
          <div key={a.id} className="flex items-center justify-between p-2 border rounded text-xs hover:bg-slate-50">
            <div>
              <span className="font-bold text-emerald-600">{a.avance}%</span> - {a.notas}
              <span className="text-slate-400 ml-2 text-[10px]">{new Date(a.fecha).toLocaleDateString()}</span>
            </div>
            <button onClick={() => handleDelete(a.id!)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
