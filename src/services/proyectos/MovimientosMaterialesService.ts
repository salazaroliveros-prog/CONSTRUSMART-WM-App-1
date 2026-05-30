import { supabase } from '@/lib/supabase';
import type { DBMovimientoMaterial } from '@/types/supabase';

const TABLE = 'movimientos_materiales' as const;

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
      .from(TABLE)
      .select('*')
      .eq('material_id', materialId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as unknown as MovimientoMaterial[];
  },

  async listarPorPresupuesto(presupuestoId: string): Promise<MovimientoMaterial[]> {
    // Primero obtener los IDs de materiales de este presupuesto
    const { data: materiales, error: errMat } = await supabase
      .from('materiales_proyecto')
      .select('id')
      .eq('presupuesto_id', presupuestoId);
    if (errMat) throw errMat;
    if (!materiales || materiales.length === 0) return [];

    const materialIds = materiales.map(m => m.id);

    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .in('material_id', materialIds)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as MovimientoMaterial[];
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
      .from(TABLE)
      .insert({
        material_id: params.materialId,
        tipo: params.tipo,
        cantidad: params.cantidad,
        ubicacion: params.ubicacion,
        referencia: params.referencia,
        user_id: params.userId,
      } satisfies Partial<DBMovimientoMaterial>)
      .select()
      .single<DBMovimientoMaterial>();

    if (error || !data) throw error || new Error('No se pudo registrar el movimiento');
    return data as unknown as MovimientoMaterial;
  },

  async calcularStock(materialId: string): Promise<number> {
    const { data, error } = await supabase
      .from(TABLE)
      .select<'', { tipo: string; cantidad: number }>('tipo, cantidad')
      .eq('material_id', materialId);
    if (error) throw error;
    const movs = data ?? [];
    return movs.reduce((acc: number, m) => {
      if (m.tipo === 'entrada') return acc + m.cantidad;
      if (m.tipo === 'salida') return acc - m.cantidad;
      return acc;
    }, 0);
  },
};