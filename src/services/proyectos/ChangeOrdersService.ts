import { supabase } from '@/lib/supabase';
import type { ChangeOrder } from '@/utils/changeOrders';
import type { CambiosPresupuesto } from '@/types/supabase';

export class ChangeOrdersService {
  static async listar(presupuestoId: string): Promise<ChangeOrder[]> {
    const { data, error } = await supabase
      .from('cambios_presupuesto')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('version', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((db: CambiosPresupuesto) => ({
      id: db.id,
      presupuesto_id: db.presupuesto_id,
      version: db.version,
      cambios: Object.entries(db.cambios || {}).map(([key, val]) => ({
        renglon_id: key,
        cantidad_anterior: val.anterior,
        cantidad_nueva: val.nuevo,
        unitario_anterior: val.anterior,
        unitario_nuevo: val.nuevo,
        motivo: val.motivo,
        impacto: val.nuevo - val.anterior,
      })),
      descripcion: db.descripcion_cambios || '',
      estado: db.estado === 'aprobado' ? 'aprobada' : db.estado === 'rechazado' ? 'rechazada' : 'pendiente',
      solicitado_por: db.usuario_creador || '',
      solicitado_fecha: db.created_at ? new Date(db.created_at) : new Date(),
      aprobado_por: db.aprobado_por,
      aprobado_fecha: db.approved_at ? new Date(db.approved_at) : undefined,
      comentarios: db.descripcion_cambios,
    }));
  }

  static async crear(orden: ChangeOrder): Promise<void> {
    const { error } = await supabase.from('cambios_presupuesto').insert({
      id: orden.id,
      presupuesto_id: orden.presupuesto_id,
      version: orden.version,
      cambios: orden.cambios.reduce((acc, c) => ({
        ...acc,
        [c.renglon_id]: { anterior: c.cantidad_anterior, nuevo: c.cantidad_nueva, motivo: c.motivo }
      }), {} as Record<string, { anterior: number; nuevo: number; motivo: string }>),
      descripcion_cambios: orden.descripcion,
      usuario_creador: orden.solicitado_por,
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
        descripcion_cambios: comentarios || '',
      })
      .eq('id', ordenId);
    if (error) throw error;
  }

  static async rechazar(ordenId: string, rechazadoPor: string, motivo: string): Promise<void> {
    const { error } = await supabase
      .from('cambios_presupuesto')
      .update({ 
        estado: 'rechazado',
        descripcion_cambios: motivo,
      })
      .eq('id', ordenId);
    if (error) throw error;
  }
}