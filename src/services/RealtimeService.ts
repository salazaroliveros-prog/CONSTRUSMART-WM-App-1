import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database, TableName } from '@/types/supabase';

export type RealtimeChangeHandler = <T extends TableName>(table: T, payload: unknown) => void;

const channelConfigs: Array<{
  table: TableName;
  filter?: (userId: string) => string;
}> = [
  { table: 'clientes', filter: userId => `user_id=eq.${userId}` },
  { table: 'proyectos', filter: userId => `user_id=eq.${userId}` },
  { table: 'presupuestos', filter: userId => `user_id=eq.${userId}` },
  { table: 'transacciones', filter: userId => `user_id=eq.${userId}` },
  { table: 'actividades', filter: userId => `user_id=eq.${userId}` },
  { table: 'equipos', filter: userId => `user_id=eq.${userId}` },
  { table: 'equipo_miembros', filter: userId => `user_id=eq.${userId}` },
  { table: 'proveedores', filter: userId => `user_id=eq.${userId}` },
  { table: 'ordenes_compra', filter: userId => `user_id=eq.${userId}` },
  { table: 'notificaciones', filter: userId => `user_id=eq.${userId}` },
  { table: 'movimientos_materiales', filter: userId => `user_id=eq.${userId}` },
  { table: 'conciliaciones', filter: userId => `user_id=eq.${userId}` },
  { table: 'renglones' },
  { table: 'renglon_usage' },
  { table: 'renglon_precios_historial' },
  { table: 'cambios_presupuesto' },
  { table: 'materiales_proyecto' },
  { table: 'partidas_conciliacion' },
  { table: 'checklist_items' },
];

const createChannel = <T extends TableName>(table: T, userId: string, onChange: RealtimeChangeHandler): RealtimeChannel => {
  const name = `realtime_${table}_${userId}`;
  const config = channelConfigs.find(c => c.table === table);
  const channel = supabase.channel(name);

  channel.on('postgres_changes', {
    event: '*',
    schema: 'public',
    table,
    filter: config?.filter?.(userId),
  }, (payload) => {
    onChange(table, payload);
  });

  return channel.subscribe();
};

export const RealtimeService = {
  subscribe(userId: string, onChange: RealtimeChangeHandler) {
    const channels: RealtimeChannel[] = channelConfigs.map((config) =>
      createChannel(config.table, userId, onChange)
    );

    return () => {
      channels.forEach(channel => {
        try {
          channel.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing realtime channel:', error);
        }
      });
    };
  },
};
