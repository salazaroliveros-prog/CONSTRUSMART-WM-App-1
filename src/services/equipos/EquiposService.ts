import { supabase } from '@/lib/supabase';

export const EquiposService = {
  async getEquipos(userId: string) {
    const { data, error } = await supabase
      .from('equipos')
      .select('*, equipo_miembros(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async addEquipo(payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('equipos')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateEquipo(id: string, payload: Record<string, unknown>, userId?: string) {
    let query = supabase.from('equipos').update(payload).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data;
  },

  async deleteEquipo(id: string, userId?: string) {
    let query = supabase.from('equipos').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
  },

  async addMiembro(payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('equipo_miembros')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMiembro(id: string, payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('equipo_miembros')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMiembro(id: string, userId?: string) {
    let query = supabase.from('equipo_miembros').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
  }
};
