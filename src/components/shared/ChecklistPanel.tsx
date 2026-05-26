import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { CheckSquare, Square, Camera, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  presupuesto_id: string;
  fase: string;
  item: string;
  completado: boolean;
  foto_url: string | null;
  completado_por: string | null;
  completado_en: string | null;
}

const PREDEFINIDOS: Record<string, string[]> = {
  'planeación': ['Planos aprobados', 'Presupuesto detallado', 'Programa de obra', 'Permisos municipales', 'Contrato firmado'],
  'ejecución': ['Cimientos verificados', 'Estructura revisada', 'Instalaciones eléctricas', 'Instalaciones hidráulicas', 'Acabados inspeccionados'],
  'finalizado': ['Acta de recepción', 'Fianzas liberadas', 'Manuales entregados', 'Planos as-built', 'Liquidación financiera'],
};

const faseLabels: Record<string, string> = { 'planeación': 'Planeación', 'ejecución': 'Ejecución', 'pausa': 'Pausa', 'finalizado': 'Finalizado' };

const ChecklistPanel: React.FC<{ presupuestoId: string; fase: string; onCompleteChange?: (completado: boolean) => void }> = ({ presupuestoId, fase, onCompleteChange }) => {
  const { session } = useAppContext();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [nuevoItem, setNuevoItem] = useState('');

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('checklist_items').select('*')
      .eq('presupuesto_id', presupuestoId).eq('fase', fase).order('created_at');
    if (data) setItems(data as ChecklistItem[]);
  }, [presupuestoId, fase]);

  useEffect(() => { if (presupuestoId && fase) cargar(); }, [presupuestoId, fase, cargar]);

  const agregarItem = async (texto: string) => {
    if (!session) return;
    const { error } = await supabase.from('checklist_items').insert({
      presupuesto_id: presupuestoId, fase, item: texto,
    });
    if (error) { toast.error('Error al agregar item'); return; }
    await cargar();
  };

  const toggleItem = async (item: ChecklistItem) => {
    if (!session) return;
    const nuevo = !item.completado;
    try {
      const { error } = await supabase.from('checklist_items').update({
        completado: nuevo,
        completado_por: nuevo ? session.user.id : null,
        completado_en: nuevo ? new Date().toISOString() : null,
      }).eq('id', item.id);
      if (error) throw error;
      await cargar();
      onCompleteChange?.(items.every(i => i.completado || i.id === item.id));
    } catch (err) {
      toast.error('Error al actualizar item');
      console.error(err);
    }
  };

  const eliminarItem = async (id: string) => {
    if (!confirm('¿Eliminar este item del checklist?')) return;
    try {
      const { error } = await supabase.from('checklist_items').delete().eq('id', id);
      if (error) throw error;
      await cargar();
    } catch (err) {
      toast.error('Error al eliminar item');
      console.error(err);
    }
  };

  const completados = items.filter(i => i.completado).length;
  const total = items.length;

  const inicializarPredefinidos = async () => {
    const predef = PREDEFINIDOS[fase] || [];
    for (const item of predef) {
      await agregarItem(item);
    }
    await cargar();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-700">Checklist {faseLabels[fase] || fase}</h3>
        </div>
        {total > 0 && (
          <span className="text-[10px] font-semibold text-slate-500">{completados}/{total}</span>
        )}
      </div>

      {total > 0 && (
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(completados / total) * 100}%` }} />
        </div>
      )}

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 group">
            <button onClick={() => toggleItem(item)} className="shrink-0">
              {item.completado
                ? <CheckSquare className="w-4 h-4 text-emerald-600" />
                : <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
              }
            </button>
            <span className={`text-[11px] flex-1 ${item.completado ? 'line-through text-slate-400' : 'text-slate-700'}`}>
              {item.item}
            </span>
            {item.completado_por && (
              <span className="text-[8px] text-slate-400">{new Date(item.completado_en || '').toLocaleDateString()}</span>
            )}
            <button onClick={() => eliminarItem(item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-0.5">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-2">
          <p className="text-[10px] text-slate-400 mb-2">Sin items de checklist para esta fase</p>
          <button onClick={inicializarPredefinidos} className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-200 px-2.5 py-1 rounded font-semibold btn-press">
            + Cargar checklist predeterminado
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input value={nuevoItem} onChange={e => setNuevoItem(e.target.value)}
          placeholder="Nuevo item..." className="flex-1 px-2 py-1 text-[10px] border rounded"
          onKeyDown={e => { if (e.key === 'Enter' && nuevoItem.trim()) { agregarItem(nuevoItem.trim()); setNuevoItem(''); } }} />
        <button onClick={() => { if (nuevoItem.trim()) { agregarItem(nuevoItem.trim()); setNuevoItem(''); } }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-[10px] font-semibold btn-press">
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default ChecklistPanel;
