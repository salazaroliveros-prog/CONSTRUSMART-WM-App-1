import { supabase } from '@/lib/supabase';

export const BodegaService = {
  async registrarMovimiento(materialId: string, tipo: 'entrada' | 'salida', cantidad: number, referencia: string = 'Movimiento automático') {
    const { error } = await supabase.from('movimientos_materiales').insert({
      material_id: materialId,
      tipo,
      cantidad,
      referencia,
    });
    if (error) throw error;
  },

  async registrarCompra(materialId: string, cantidad: number, referencia: string) {
    return await this.registrarMovimiento(materialId, 'entrada', cantidad, referencia || 'Compra directa');
  },

  async getMovimientos(proyectoId: string) {
    // Nota: Esta consulta debe ser optimizada si la tabla crece mucho.
    // Actualmente obtiene movimientos para el proyecto, asumiendo relacion indirecta o directa.
    const { data, error } = await supabase
      .from('movimientos_materiales')
      .select('material_id, tipo, cantidad');
    
    if (error) throw error;
    return data || [];
  }
};
