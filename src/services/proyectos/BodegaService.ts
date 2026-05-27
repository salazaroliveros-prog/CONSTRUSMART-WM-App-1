import { supabase } from '@/lib/supabase';
import { MovimientosMaterialesService } from '@/services/proyectos/MovimientosMaterialesService';

export const BodegaService = {
  async registrarMovimiento(materialId: string, tipo: 'entrada' | 'salida', cantidad: number, referencia: string = 'Movimiento automático', userId?: string) {
    const payload: Record<string, unknown> = {
      material_id: materialId,
      tipo,
      cantidad,
      referencia,
    };
    if (userId) payload.user_id = userId;

    const { error } = await supabase.from('movimientos_materiales').insert(payload);
    if (error) throw error;
  },

  async registrarCompra(materialId: string, cantidad: number, referencia: string, userId?: string) {
    return await this.registrarMovimiento(materialId, 'entrada', cantidad, referencia || 'Compra directa', userId);
  },

  async registrarUso(materialId: string, cantidad: number, referencia: string = 'Uso de almacén', userId?: string) {
    return await this.registrarMovimiento(materialId, 'salida', cantidad, referencia, userId);
  },

  async getMovimientos(presupuestoId: string) {
    return await MovimientosMaterialesService.listarPorPresupuesto(presupuestoId);
  }
};
