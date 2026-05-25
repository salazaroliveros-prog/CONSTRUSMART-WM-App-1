import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { RefreshCw } from 'lucide-react';

interface ChangeEvent {
  table: string;
  type: string;
  time: Date;
}

const RealtimeFeed: React.FC = () => {
  const { presupuestos, transacciones } = useAppContext();
  const [events, setEvents] = useState<ChangeEvent[]>([]);

  useEffect(() => {
    const channel = supabase.channel('feed-cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presupuestos' }, (payload) => {
        setEvents(prev => [{ table: 'Presupuesto', type: payload.eventType, time: new Date() }, ...prev].slice(0, 10));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacciones' }, (payload) => {
        setEvents(prev => [{ table: 'Transacción', type: payload.eventType, time: new Date() }, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  const typeLabel: Record<string, string> = { INSERT: 'creado', UPDATE: 'actualizado', DELETE: 'eliminado' };
  const typeColor: Record<string, string> = {
    INSERT: 'text-emerald-600 bg-emerald-50',
    UPDATE: 'text-blue-600 bg-blue-50',
    DELETE: 'text-red-600 bg-red-50',
  };

  if (events.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <RefreshCw className="w-3 h-3 text-blue-600 animate-pulse" />
        <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Actividad Reciente</h3>
      </div>
      <div className="space-y-1 max-h-24 overflow-y-auto">
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <span className={`px-1.5 py-0.5 rounded ${typeColor[e.type] || 'bg-slate-100 text-slate-600'} font-semibold`}>
              {e.table} {typeLabel[e.type] || e.type}
            </span>
            <span className="text-slate-400">{e.time.toLocaleTimeString('es-GT')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealtimeFeed;
