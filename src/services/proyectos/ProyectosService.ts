import { supabase } from '@/lib/supabase';

export const ProyectosService = {
  async addProyecto(payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('proyectos')
      .insert(payload as any)
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },

  async updateProyecto(id: string, userId: string, payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('proyectos')
      .update(payload as any)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },

  async deleteProyecto(id: string, userId: string) {
    const { error } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }
};