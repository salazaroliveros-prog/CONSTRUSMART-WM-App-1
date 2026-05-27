import { supabase } from '@/lib/supabase';
import { Avance } from '@/lib/schemas';

export const BitacoraAvanceService = {
  async getAvances(presupuestoId: string) {
    const { data, error } = await supabase
      .from('bitacora_avance')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return (data || []) as Avance[];
  },

  async addAvance(payload: {
    presupuesto_id: string;
    avance: number;
    notas: string;
    fecha: string;
  }) {
    const { data, error } = await supabase
      .from('bitacora_avance')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Avance;
  },

  async deleteAvance(id: string) {
    const { error } = await supabase
      .from('bitacora_avance')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
