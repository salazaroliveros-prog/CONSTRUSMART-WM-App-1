import { supabase } from '@/lib/supabase';
import type { Material } from '@/types/supabase';

type SubMaterial = {
  nombre?: string;
  unidad?: string;
  cantidad?: number;
  costoUnitario?: number;
  codigo?: string;
};

type PresupuestoLinea = {
  codigo?: string;
  cantidad?: number;
  subrenglones?: {
    materiales?: SubMaterial[];
  };
};

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

    const lineas = (presupuesto?.lineas || []) as PresupuestoLinea[];
    const materialesDesglosados: Record<string, { cantidad: number; unidad: string; costoUnitario: number; nombre: string; codigo: string }> = {};

    lineas.forEach((linea) => {
      const materiales = linea.subrenglones?.materiales ?? [];
      materiales.forEach((mat) => {
        const nombre = mat.nombre?.trim() || 'Material sin nombre';
        const key = nombre.toLowerCase();
        if (!materialesDesglosados[key]) {
          materialesDesglosados[key] = {
            cantidad: 0,
            unidad: mat.unidad || 'u',
            costoUnitario: mat.costoUnitario ?? 0,
            nombre,
            codigo: mat.codigo || linea.codigo || '',
          };
        }
        materialesDesglosados[key].cantidad += (mat.cantidad ?? 0) * (linea.cantidad ?? 1);
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
  // Si ya existen, compara y actualiza cantidades y costos
  async persistDesglosados(presupuestoId: string): Promise<Material[]> {
    const desglosados = await this.getDesglosado(presupuestoId);
    if (desglosados.length === 0) return [];

    // Obtener materiales existentes
    const existentes = await this.getMateriales(presupuestoId);
    const existentesPorNombre = new Map(
      existentes.map(m => [m.nombre?.toLowerCase() || '', m])
    );

    const actualizaciones: Promise<any>[] = [];
    const inserciones: typeof desglosados = [];

    // Comparar desglosados actuales con existentes
    for (const desg of desglosados) {
      const nombre = desg.nombre?.trim() || 'Material sin nombre';
      const key = nombre.toLowerCase();
      const existente = existentesPorNombre.get(key);

      if (existente) {
        // Actualizar si cambió la cantidad o costo
        if (
          existente.cantidad_estimada !== desg.cantidad_estimada ||
          existente.costo_unitario !== desg.costo_unitario ||
          existente.unidad !== desg.unidad
        ) {
          actualizaciones.push(
            supabase
              .from('materiales_proyecto')
              .update({
                cantidad_estimada: desg.cantidad_estimada,
                costo_unitario: desg.costo_unitario,
                unidad: desg.unidad,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existente.id)
          );
        }
      } else {
        // Insertar si no existe
        inserciones.push({
          presupuesto_id: presupuestoId,
          nombre: desg.nombre,
          unidad: desg.unidad,
          cantidad_estimada: desg.cantidad_estimada,
          costo_unitario: desg.costo_unitario,
          cantidad_utilizada: 0,
          proveedor: null,
        });
      }
    }

    // Ejecutar actualizaciones
    if (actualizaciones.length > 0) {
      const resultados = await Promise.all(actualizaciones);
      resultados.forEach(r => {
        if (r.error) console.error('Error actualizando material:', r.error);
      });
    }

    // Insertar nuevos materiales
    let insertados: Material[] = [];
    if (inserciones.length > 0) {
      const { data, error } = await supabase
        .from('materiales_proyecto')
        .insert(inserciones)
        .select();
      if (error) {
        console.error('Error insertando materiales:', error);
      } else {
        insertados = (data || []) as Material[];
      }
    }

    // Retornar todos los materiales (existentes + insertados)
    return [...existentes, ...insertados];
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