// Hook para presencia colaborativa básica usando Supabase Realtime
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface PresenciaUsuario {
  userId: string;
  nombre: string;
  avatar: string;
  presupuestoId: string;
  timestamp: number;
}

interface PresenciaPayload {
  eventType?: string;
  event?: string;
  payload?: PresenciaUsuario;
}

export function usePresenciaPresupuesto(presupuestoId: string | null, user: { nombre: string; avatar: string; id: string }) {
  const [usuarios, setUsuarios] = useState<PresenciaUsuario[]>([]);

  useEffect(() => {
    if (!presupuestoId || !user?.id) return;
    const canal = supabase.channel('presencia_presupuesto_' + presupuestoId);
    const presenceKey = user.id + '-' + presupuestoId;
    const presencePayload: PresenciaUsuario = {
      userId: user.id,
      nombre: user.nombre,
      avatar: user.avatar,
      presupuestoId,
      timestamp: Date.now(),
    };
    // Join presence
    canal.send({ type: 'broadcast', event: 'join', payload: presencePayload });
    // Listen for presence
    const handler = (payload: PresenciaPayload) => {
      if (payload.eventType === 'broadcast' && payload.event === 'join') {
        setUsuarios((prev) => {
          const otros = prev.filter(u => u.userId !== payload.payload?.userId);
          return [...otros, payload.payload as PresenciaUsuario];
        });
      }
    };
    canal.on('broadcast', handler);
    canal.subscribe();
    // Cleanup
    return () => {
      canal.unsubscribe();
    };
  }, [presupuestoId, user]);

  return usuarios;
}
