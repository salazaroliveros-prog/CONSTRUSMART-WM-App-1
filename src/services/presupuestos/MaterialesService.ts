import { supabase } from '@/lib/supabase';
import type { Material } from '@/types/supabase';

export const MaterialesService = {
  async getMateriales(presupuestoId: string): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materiales_proyecto')
      .select('*')
      .eq('presupuesto_id', presupuestoId);
    if (error) throw error;
    return (data || []) as Material[];
  },

  // Extrae materiales del JSON embebido de lineas (subrenglones.materiales)
  async getDesglosado(presupuestoId: string) {
    const { data: presupuesto, error } = await supabase
      .from('presupuestos')
      .select('lineas')
      .eq('id', presupuestoId)
      .single();
    if (error) throw error;

    const lineas = presupuesto?.lineas || [];
    const materialesDesglosados: Record<string, { cantidad: number; unidad: string; costoUnitario: number; nombre: string; codigo: string }> = {};

    lineas.forEach((linea: any) => {
      (linea?.subrenglones?.materiales || []).forEach((mat: any) => {
        const key = mat.nombre?.toLowerCase() || 'material sin nombre';
        if (!materialesDesglosados[key]) {
          materialesDesglosados[key] = {
            cantidad: 0,
            unidad: mat.unidad || 'u',
            costoUnitario: mat.costoUnitario || 0,
            nombre: mat.nombre || key,
            codigo: mat.codigo || linea.codigo || '',
          };
        }
        materialesDesglosados[key].cantidad += (mat.cantidad || 0) * (linea.cantidad || 1);
      });
    });

    return Object.entries(materialesDesglosados).map(([_, m]) => ({
      nombre: m.nombre,
      unidad: m.unidad,
      cantidad_estimada: m.cantidad,
      cantidad_utilizada: 0,
      costo_unitario: m.costoUnitario,
      proveedor: null,
    }));
  },

  // Persiste materiales desglosados en la tabla real (evita IDs efímeros)
  async persistDesglosados(presupuestoId: string): Promise<Material[]> {
    const existentes = await this.getMateriales(presupuestoId);
    if (existentes.length > 0) return existentes;

    const desglosados = await this.getDesglosado(presupuestoId);
    if (desglosados.length === 0) return [];

    const inserts = desglosados.map(m => ({
      presupuesto_id: presupuestoId,
      nombre: m.nombre,
      unidad: m.unidad,
      cantidad_estimada: m.cantidad_estimada,
      costo_unitario: m.costo_unitario,
      cantidad_utilizada: 0,
      proveedor: null,
    }));

    const { data, error } = await supabase
      .from('materiales_proyecto')
      .insert(inserts)
      .select();
    if (error) throw error;
    return (data || []) as Material[];
  },

  async addMaterial(material: Partial<Material>) {
    const { data, error } = await supabase
      .from('materiales_proyecto')
      .insert(material)
      .select()
      .single();
    if (error) throw error;
    return data as Material;
  },

  async buscarPorNombre(presupuestoId: string, nombre: string) {
    const criterio = nombre.trim();
    if (!criterio) return null;

    const { data, error } = await supabase
      .from('materiales_proyecto')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .ilike('nombre', `%${criterio}%`)
      .limit(1);

    if (error) throw error;
    return (data && data[0]) as Material | null;
  },

  async registrarUso(materialId: string, cantidad: number) {
    const { data, error } = await supabase
      .from('movimientos_materiales')
      .insert({ material_id: materialId, tipo: 'salida', cantidad })
      .select()
      .single();
    if (error) throw error;
    return data as any;
  }
};