import { supabase } from '@/lib/supabase';
import { ChangeOrder } from '@/utils/changeOrders';

export class ChangeOrdersService {
  static async listar(presupuestoId: string): Promise<ChangeOrder[]> {
    const { data, error } = await supabase
      .from('cambios_presupuesto')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('version', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((c: any) => ({
      id: c.id,
      presupuesto_id: c.presupuesto_id,
      version: c.version,
      cambios: c.cambios,
      descripcion: c.motivo,
      estado: c.estado === 'aprobado' ? 'aprobada' : c.estado === 'rechazado' ? 'rechazada' : 'pendiente',
      solicitado_por: c.aprobado_por || '',
      solicitado_fecha: new Date(c.created_at),
      aprobado_por: c.aprobado_por,
      aprobado_fecha: undefined,
      comentarios: c.motivo,
    }));
  }

  static async crear(orden: ChangeOrder): Promise<void> {
    const { error } = await supabase.from('cambios_presupuesto').insert({
      id: orden.id,
      presupuesto_id: orden.presupuesto_id,
      version: orden.version,
      cambios: orden.cambios,
      motivo: orden.descripcion,
      estado: 'pendiente',
    });
    if (error) throw error;
  }

  static async aprobar(ordenId: string, aprobadoPor: string, comentarios?: string): Promise<void> {
    const { error } = await supabase
      .from('cambios_presupuesto')
      .update({ 
        estado: 'aprobado',
        aprobado_por: aprobadoPor,
        motivo: comentarios || '',
      })
      .eq('id', ordenId);
    if (error) throw error;
  }

  static async rechazar(ordenId: string, rechazadoPor: string, motivo: string): Promise<void> {
    const { error } = await supabase
      .from('cambios_presupuesto')
      .update({ 
        estado: 'rechazado',
        motivo,
      })
      .eq('id', ordenId);
    if (error) throw error;
  }
}
