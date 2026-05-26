import { supabase } from '@/lib/supabase';
import { Proyecto } from '@/types/supabase';

export const ProyectosService = {
  async updateProyecto(id: string, userId: string, payload: Partial<Proyecto>) {
    const { data, error } = await supabase
      .from('proyectos')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
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
