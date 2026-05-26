import { supabase } from '@/lib/supabase';
import { Material } from '@/types/supabase';

export const MaterialesService = {
  async getMateriales(presupuestoId: string) {
    const { data, error } = await supabase
      .from('materiales_proyecto')
      .select('*')
      .eq('presupuesto_id', presupuestoId);
    if (error) throw error;
    return data as any as Material[];
  },

  async addMaterial(material: any) {
    const { data, error } = await supabase
      .from('materiales_proyecto')
      .insert(material)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async registrarUso(materialId: string, cantidad: number) {
    const { data, error } = await supabase
      .from('movimientos_materiales')
      .insert({ material_id: materialId, tipo: 'salida', cantidad })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
