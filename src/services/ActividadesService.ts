import { supabase } from '@/lib/supabase';
import { Actividad, CreateActividad, dbToActividad, actividadToDb } from '@/types/supabase';

export const ActividadesService = {
  async addActividad(payload: CreateActividad): Promise<Actividad> {
    const { data, error } = await supabase
      .from('actividades')
      .insert(actividadToDb(payload) as any)
      .select()
      .single();
    if (error) throw error;
    return dbToActividad(data);
  },

  async deleteActividad(id: string, userId?: string) {
    let query = supabase.from('actividades').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
  }
};