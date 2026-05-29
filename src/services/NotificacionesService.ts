import { supabase } from '@/lib/supabase';
import { addPendingMutation } from '@/services/offline';

export type TipoNotificacion = 'info' | 'alerta' | 'exito' | 'warning';

export class NotificacionesService {
  static async crear(
    userId: string,
    tipo: TipoNotificacion,
    titulo: string,
    mensaje?: string,
  ): Promise<Record<string, unknown>> {
    const payload: Record<string, unknown> = {
      user_id: userId,
      tipo,
      titulo,
      mensaje: mensaje || null,
      leido: false,
    };

    // Intentar insertar en el servidor; si falla y estamos offline, guardar pending
    try {
      const { data, error } = await supabase.from('notificaciones').insert(payload).select().single();
      if (error) throw error;
      return data as Record<string, unknown>;
    } catch (e) {
      try {
        if (typeof window !== 'undefined' && !navigator.onLine) {
          addPendingMutation({ table: 'notificaciones', action: 'INSERT', data: payload, userId });
          return { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
        }
      } catch (ee) {
        console.warn('Error guardando notificación en pending:', ee);
      }
      console.warn('Error creando notificación:', e);
      throw e;
    }
  }

  static async listar(userId: string) {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  }

  static async marcarLeida(id: string) {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true })
      .eq('id', id);
    if (error) throw error;
  }

  static async eliminar(id: string) {
    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
