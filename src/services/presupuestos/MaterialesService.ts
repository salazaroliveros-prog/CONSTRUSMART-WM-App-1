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

  // Nueva función: desglosar materiales desde renglones del presupuesto
  async getDesglosado(presupuestoId: string) {
    const { data: presupuesto, error } = await supabase
      .from('presupuestos')
      .select('lineas')
      .eq('id', presupuestoId)
      .single();
    if (error) throw error;
    
    const lineas = presupuesto.lineas || [];
    const materialesDesglosados: Record<string, { cantidad: number; unidad: string; costoUnitario: number; nombre: string }> = {};
    
    lineas.forEach((linea: any) => {
      (linea?.subrenglones?.materiales || []).forEach((mat: any) => {
        const key = mat.nombre?.toLowerCase() || 'material sin nombre';
        if (!materialesDesglosados[key]) {
          materialesDesglosados[key] = {
            cantidad: 0,
            unidad: mat.unidad || 'u',
            costoUnitario: mat.costoUnitario || 0,
            nombre: mat.nombre || key,
          };
        }
        materialesDesglosados[key].cantidad += (mat.cantidad || 0) * (linea.cantidad || 1);
      });
    });
    
    return Object.entries(materialesDesglosados).map(([_, m]) => ({
      id: crypto.randomUUID(),
      nombre: m.nombre,
      unidad: m.unidad,
      cantidad_estimada: m.cantidad,
      cantidad_utilizada: 0,
      costo_unitario: m.costoUnitario,
      proveedor: null,
    }));
  },

  async addMaterial(material: any) {
    const { data, error } = await (supabase
      .from('materiales_proyecto') as any)
      .insert(material)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async buscarPorNombre(presupuestoId: string, nombre: string) {
    const criterio = nombre.trim();
    if (!criterio) return null;

    const { data, error } = await (supabase
      .from('materiales_proyecto') as any)
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .ilike('nombre', `%${criterio}%`)
      .limit(1);

    if (error) throw error;
    return (data && data[0]) || null;
  },

  async registrarUso(materialId: string, cantidad: number) {
    const { data, error } = await (supabase
      .from('movimientos_materiales') as any)
      .insert({ material_id: materialId, tipo: 'salida', cantidad })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
