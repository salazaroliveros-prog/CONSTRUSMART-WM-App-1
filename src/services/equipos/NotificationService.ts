import { supabase } from '@/lib/supabase';
import { Notif } from '@/types/supabase';

export const NotificationService = {
  async getNotificaciones(userId: string) {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data as any as Notif[];
  },

  async marcarLeido(id: string) {
    const { data, error } = await supabase
      .from('notificaciones')
      .update({ leido: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async eliminar(id: string) {
    const { error } = await supabase
      .from('notificaciones')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
