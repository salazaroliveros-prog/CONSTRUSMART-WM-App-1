import { supabase } from '@/lib/supabase';
import type { Proyecto, CreateProyecto, UpdateProyecto } from '@/types/supabase';

export const ProyectosService = {
  async addProyecto(payload: CreateProyecto): Promise<Proyecto> {
    const { data, error } = await supabase
      .from('proyectos')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Proyecto;
  },

  async updateProyecto(id: string, userId: string, payload: UpdateProyecto): Promise<Proyecto> {
    const { data, error } = await supabase
      .from('proyectos')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as Proyecto;
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
