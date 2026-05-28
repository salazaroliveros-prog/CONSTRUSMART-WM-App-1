import { supabase } from '@/lib/supabase';

export const ActividadesService = {
  async addActividad(payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('actividades')
      .insert(payload as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteActividad(id: string, userId?: string) {
    let query = supabase.from('actividades').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
  }
};