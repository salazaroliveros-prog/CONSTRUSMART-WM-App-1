import { supabase } from '@/lib/supabase';
import { addPendingMutation } from '@/services/offline';
import type { DBNotificacion, TipoNotificacion } from '@/types/supabase';

export class NotificacionesService {
  static async crear(
    userId: string,
    tipo: TipoNotificacion,
    titulo: string,
    mensaje?: string,
  ): Promise<DBNotificacion> {
    const payload: Omit<DBNotificacion, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      tipo,
      titulo,
      mensaje: mensaje || null,
      leido: false,
    };

    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as DBNotificacion;
    } catch (e) {
      try {
        if (typeof window !== 'undefined' && !navigator.onLine) {
          addPendingMutation({ table: 'notificaciones', action: 'INSERT', data: payload, userId });
          return {
            ...payload,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as DBNotificacion;
        }
      } catch (ee) {
        console.warn('Error guardando notificación en pending:', ee);
      }
      console.warn('Error creando notificación:', e);
      throw e;
    }
  }

  static async listar(userId: string): Promise<DBNotificacion[]> {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []) as DBNotificacion[];
  }

  static async marcarLeida(id: string) {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error al marcar notificación como leída:', e);
      throw e;
    }
  }

  static async eliminar(id: string) {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error al eliminar notificación:', e);
      throw e;
    }
  }
}
