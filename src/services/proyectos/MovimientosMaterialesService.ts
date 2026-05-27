import { supabase } from '@/lib/supabase';

export interface MovimientoMaterial {
  id: string;
  material_id: string;
  tipo: 'entrada' | 'salida' | 'devolucion';
  cantidad: number;
  ubicacion?: string;
  referencia?: string;
  user_id?: string;
  created_at: string;
}

export const MovimientosMaterialesService = {
  async listar(materialId: string): Promise<MovimientoMaterial[]> {
    const { data, error } = await supabase
      .from('movimientos_materiales')
      .select('*')
      .eq('material_id', materialId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as MovimientoMaterial[];
  },

  async listarPorPresupuesto(presupuestoId: string): Promise<MovimientoMaterial[]> {
    const { data, error } = await supabase
      .from('movimientos_materiales')
      .select('*, materiales_proyecto!inner(presupuesto_id)')
      .eq('materiales_proyecto.presupuesto_id', presupuestoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as MovimientoMaterial[];
  },

  async registrar(params: {
    materialId: string;
    tipo: 'entrada' | 'salida' | 'devolucion';
    cantidad: number;
    ubicacion?: string;
    referencia?: string;
    userId?: string;
  }): Promise<MovimientoMaterial> {
    const { data, error } = await supabase
      .from('movimientos_materiales')
      .insert({
        material_id: params.materialId,
        tipo: params.tipo,
        cantidad: params.cantidad,
        ubicacion: params.ubicacion,
        referencia: params.referencia,
        user_id: params.userId,
      })
      .select()
      .single();
    if (error) throw error;
    return data as MovimientoMaterial;
  },

  async calcularStock(materialId: string): Promise<number> {
    const { data, error } = await supabase
      .from('movimientos_materiales')
      .select('tipo, cantidad')
      .eq('material_id', materialId);
    if (error) throw error;
    const movs = data as { tipo: string; cantidad: number }[];
    return movs.reduce((acc, m) => {
      if (m.tipo === 'entrada') return acc + m.cantidad;
      if (m.tipo === 'salida') return acc - m.cantidad;
      return acc;
    }, 0);
  },
};
