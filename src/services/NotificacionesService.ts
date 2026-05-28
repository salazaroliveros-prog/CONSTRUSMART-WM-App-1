import { supabase } from '@/lib/supabase';

export type TipoNotificacion = 'info' | 'alerta' | 'exito' | 'warning';

export class NotificacionesService {
  static async crear(
    userId: string,
    tipo: TipoNotificacion,
    titulo: string,
    mensaje?: string,
  ): Promise<void> {
    try {
      const { error } = await supabase.from('notificaciones').insert({
        user_id: userId,
        tipo,
        titulo,
        mensaje: mensaje || null,
        leido: false,
      } as any);
      if (error) throw error;
    } catch (e) {
      console.warn('Error creando notificación:', e);
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
