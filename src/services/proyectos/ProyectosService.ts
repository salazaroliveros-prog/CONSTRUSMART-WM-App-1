import { supabase } from '@/lib/supabase';

export const ProyectosService = {
  async addProyecto(payload: Record<string, unknown>) {
    const { data, error } = await (supabase
      .from('proyectos') as any)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },

  async updateProyecto(id: string, userId: string, payload: Record<string, unknown>) {
    const { data, error } = await (supabase
      .from('proyectos') as any)
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },

  async deleteProyecto(id: string, userId: string) {
    const { error } = await (supabase
      .from('proyectos') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }
};
