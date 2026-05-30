import { supabase } from '@/lib/supabase';
import { Actividad, CreateActividad, UpdateActividad, dbToActividad, actividadToDb } from '@/types/supabase';

export const ActividadesService = {
  async addActividad(payload: CreateActividad): Promise<Actividad> {
    const { data, error } = await supabase
      .from('actividades')
      .insert(actividadToDb(payload))
      .select()
      .single();
    if (error) throw error;
    return dbToActividad(data);
  },

  async updateActividad(id: string, payload: UpdateActividad, userId?: string): Promise<Actividad> {
    let query = supabase.from('actividades').update(actividadToDb(payload)).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().single();
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