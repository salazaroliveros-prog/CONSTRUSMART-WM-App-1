import { supabase } from '@/lib/supabase';
import type { Avance } from '@/lib/schemas';
import type { DBBitacoraAvance } from '@/types/supabase';

const TABLE = 'bitacora_avance' as const;

export const BitacoraAvanceService = {
  async getAvances(presupuestoId: string): Promise<Avance[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return (data ?? []) as unknown as Avance[];
  },

  async addAvance(payload: {
    presupuesto_id: string;
    avance: number;
    notas: string;
    fecha: string;
  }): Promise<Avance> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...payload, user_id: user?.id } satisfies Partial<DBBitacoraAvance>)
      .select()
      .single<DBBitacoraAvance>();

    if (error || !data) throw error || new Error('No se pudo crear el avance');
    return data as unknown as Avance;
  },

  async deleteAvance(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Actualiza el avance físico del presupuesto directamente desde el servicio.
   * Encapsula la llamada a la tabla presupuestos para que el panel no acceda a supabase directamente.
   */
  async actualizarAvanceFisico(presupuestoId: string, avanceFisico: number): Promise<void> {
    const { error } = await supabase
      .from('presupuestos')
      .update({ avance_fisico: Math.min(100, Math.max(0, avanceFisico)) })
      .eq('id', presupuestoId);
    if (error) throw error;
  },

  /**
   * Obtiene el último avance registrado para un presupuesto.
   */
  async getUltimoAvance(presupuestoId: string): Promise<number> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('avance')
      .eq('presupuesto_id', presupuestoId)
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle<{ avance: number }>();
    if (error || !data) return 0;
    return data.avance ?? 0;
  },
};