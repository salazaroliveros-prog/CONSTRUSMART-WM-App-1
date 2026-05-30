import { supabase } from '@/lib/supabase';
import type { CambiosPresupuesto } from '@/types/supabase';

const TABLE = 'cambios_presupuesto' as const;

export const ChangeOrderService = {
  async getCambios(presupuestoId: string): Promise<CambiosPresupuesto[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('version', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as CambiosPresupuesto[];
  },

  async crearCambio(presupuestoId: string, version: number, motivo: string): Promise<CambiosPresupuesto> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        presupuesto_id: presupuestoId,
        version,
        cambios: [{ campo: 'manual', anterior: null, nuevo: null, motivo: '' }],
        motivo,
        estado: 'pendiente',
      })
      .select()
      .single<CambiosPresupuesto>();
    if (error) throw error;
    if (!data) throw new Error('No se pudo crear cambio');
    return data;
  },

  async actualizarEstado(id: string, estado: 'aprobado' | 'rechazado', userId?: string): Promise<CambiosPresupuesto> {
    const payload: Partial<CambiosPresupuesto> = { estado };
    if (estado === 'aprobado' && userId) {
      payload.aprobado_por = userId;
      payload.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', id)
      .select()
      .single<CambiosPresupuesto>();
    if (error) throw error;
    if (!data) throw new Error('No se pudo actualizar estado');
    return data;
  }
};