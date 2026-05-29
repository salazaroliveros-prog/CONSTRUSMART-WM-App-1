import { supabase } from '@/lib/supabase';
import { 
  Equipo, CreateEquipo, UpdateEquipo, 
  EquipoMiembro, CreateEquipoMiembro, UpdateEquipoMiembro,
  dbToEquipo, equipoToDb, dbToEquipoMiembro, equipoMiembroToDb 
} from '@/types/supabase';

export const EquiposService = {
  async getEquipos(userId: string): Promise<Equipo[]> {
    const { data, error } = await supabase
      .from('equipos')
      .select('*, equipo_miembros(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(dbToEquipo);
  },

  async addEquipo(payload: CreateEquipo): Promise<Equipo> {
    const { data, error } = await supabase
      .from('equipos')
      .insert(equipoToDb(payload))
      .select()
      .single();
    if (error) throw error;
    return dbToEquipo(data);
  },

  async updateEquipo(id: string, payload: UpdateEquipo, userId?: string): Promise<Equipo> {
    let query = supabase.from('equipos').update(equipoToDb(payload as CreateEquipo)).eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return dbToEquipo(data);
  },

  async deleteEquipo(id: string, userId?: string) {
    let query = supabase.from('equipos').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
  },

  async addMiembro(payload: CreateEquipoMiembro): Promise<EquipoMiembro> {
    const { data, error } = await supabase
      .from('equipo_miembros')
      .insert(equipoMiembroToDb(payload))
      .select()
      .single();
    if (error) throw error;
    return dbToEquipoMiembro(data);
  },

  async updateMiembro(id: string, payload: UpdateEquipoMiembro): Promise<EquipoMiembro> {
    const { data, error } = await supabase
      .from('equipo_miembros')
      .update(equipoMiembroToDb(payload as CreateEquipoMiembro))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return dbToEquipoMiembro(data);
  },

  async deleteMiembro(id: string, userId?: string) {
    let query = supabase.from('equipo_miembros').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
  }
};
