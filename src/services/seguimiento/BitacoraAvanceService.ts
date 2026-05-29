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
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await (supabase
      .from('bitacora_avance') as any)
      .insert({ ...payload, user_id: user?.id })
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

  /**
   * Actualiza el avance físico del presupuesto directamente desde el servicio.
   * Encapsula la llamada a la tabla presupuestos para que el panel no acceda a supabase directamente.
   */
  async actualizarAvanceFisico(presupuestoId: string, avanceFisico: number) {
    const { error } = await (supabase
      .from('presupuestos') as any)
      .update({ avance_fisico: Math.min(100, Math.max(0, avanceFisico)) })
      .eq('id', presupuestoId);
    if (error) throw error;
  },

  /**
   * Obtiene el último avance registrado para un presupuesto.
   */
  async getUltimoAvance(presupuestoId: string): Promise<number> {
    const { data, error } = await supabase
      .from('bitacora_avance')
      .select('avance')
      .eq('presupuesto_id', presupuestoId)
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return 0;
    return (data as any)?.avance ?? 0;
  },
};
