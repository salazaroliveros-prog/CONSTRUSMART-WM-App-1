import { supabase } from '@/lib/supabase';
import { CambiosPresupuesto } from '@/types/supabase';

export const ChangeOrderService = {
  async getCambios(presupuestoId: string) {
    const { data, error } = await supabase
      .from('cambios_presupuesto')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('version', { ascending: false });
    if (error) throw error;
    return data as any as CambiosPresupuesto[];
  },

  async crearCambio(presupuestoId: string, version: number, motivo: string) {
    const { data, error } = await supabase
      .from('cambios_presupuesto')
      .insert({
        presupuesto_id: presupuestoId,
        version,
        cambios: [{ campo: 'manual', anterior: null, nuevo: null }],
        motivo,
        estado: 'pendiente',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async actualizarEstado(id: string, estado: 'aprobado' | 'rechazado', userId?: string) {
    const payload: any = { estado };
    if (estado === 'aprobado' && userId) payload.aprobado_por = userId;
    
    const { data, error } = await supabase
      .from('cambios_presupuesto')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
