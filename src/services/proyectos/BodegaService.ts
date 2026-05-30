import { MovimientosMaterialesService } from '@/services/proyectos/MovimientosMaterialesService';

export const BodegaService = {
  async registrarMovimiento(materialId: string, tipo: 'entrada' | 'salida', cantidad: number, referencia = 'Movimiento automático', userId?: string) {
    await MovimientosMaterialesService.registrar({
      materialId,
      tipo,
      cantidad,
      referencia,
      userId,
    });
    return { success: true };
  },

  async registrarCompra(materialId: string, cantidad: number, referencia: string, userId?: string) {
    return await this.registrarMovimiento(materialId, 'entrada', cantidad, referencia || 'Compra directa', userId);
  },

  async registrarUso(materialId: string, cantidad: number, referencia = 'Uso de almacén', userId?: string) {
    return await this.registrarMovimiento(materialId, 'salida', cantidad, referencia, userId);
  },

  async getMovimientos(presupuestoId: string) {
    return await MovimientosMaterialesService.listarPorPresupuesto(presupuestoId);
  }
};
