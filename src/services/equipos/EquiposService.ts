import { supabase } from '@/lib/supabase';
import { Equipo, EquipoMiembro } from '@/types/supabase';

export const EquiposService = {
  async getEquipos(userId: string) {
    const { data, error } = await supabase
      .from('equipos')
      .select('*, equipo_miembros(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async addEquipo(nombre: string, userId: string) {
    const { data, error } = await supabase
      .from('equipos')
      .insert({ nombre, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addMiembro(equipoId: string, userEmail: string, rol: 'admin' | 'miembro' | 'visor') {
    const { data, error } = await supabase
      .from('equipo_miembros')
      .insert({ equipo_id: equipoId, user_id: userEmail, rol })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMiembro(miembroId: string) {
    const { error } = await supabase
      .from('equipo_miembros')
      .delete()
      .eq('id', miembroId);
    if (error) throw error;
  }
};
