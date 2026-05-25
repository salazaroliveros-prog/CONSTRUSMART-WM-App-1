// Hook para bloqueo optimista de edición colaborativa
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface BloqueoPayload {
  eventType?: string;
  event?: string;
  payload?: { userId: string; presupuestoId: string };
}

export function useBloqueoEdicion(presupuestoId: string | null, userId: string) {
  const [bloqueadoPor, setBloqueadoPor] = useState<string | null>(null);

  useEffect(() => {
    if (!presupuestoId || !userId) return;
    const canal = supabase.channel('bloqueo_presupuesto_' + presupuestoId);
    // Notificar que este usuario está editando
    canal.send({ type: 'broadcast', event: 'lock', payload: { userId, presupuestoId } });
    // Escuchar bloqueos
    const handler = (payload: BloqueoPayload) => {
      if (payload.eventType === 'broadcast' && payload.event === 'lock') {
        if (payload.payload?.userId !== userId) {
          setBloqueadoPor(payload.payload?.userId || null);
        }
      }
    };
    canal.on('broadcast', handler);
    canal.subscribe();
    return () => {
      canal.unsubscribe();
    };
  }, [presupuestoId, userId]);

  return bloqueadoPor;
}
