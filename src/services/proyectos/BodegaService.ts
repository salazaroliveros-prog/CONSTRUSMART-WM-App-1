import { supabase } from '@/lib/supabase';

/**
 * Servicio de Logística y Bodega.
 * Encargado de la explosión de materiales: al confirmar un presupuesto,
 * genera la lista maestra de materiales necesarios para la obra.
 */
export const BodegaService = {
  /**
   * Genera el stock de materiales necesarios para un presupuesto
   */
  async explosionarMateriales(presupuestoId: string, lineas: any[]) {
    // 1. Limpiar materiales actuales para evitar duplicados
    await supabase.from('materiales_proyecto').delete().eq('presupuesto_id', presupuestoId);

    // 2. Extraer todos los materiales de todos los renglones
    const materialesMaestros: any[] = [];
    
    lineas.forEach(renglon => {
      renglon.materiales.forEach((mat: any) => {
        materialesMaestros.push({
          presupuesto_id: presupuestoId,
          nombre: mat.nombre,
          cantidad_estimada: mat.cantidad * renglon.cantidad, // Cantidad en renglón * cantidad renglones
          unidad: mat.unidad || 'unidad',
          costo_unitario: mat.costoUnitario
        });
      });
    });

    // 3. Insertar lista consolidada en bodega
    const { error } = await supabase.from('materiales_proyecto').insert(materialesMaestros);
    if (error) throw error;
  },

  /**
   * Registra una compra de materiales y actualiza el stock estimado
   */
  async registrarCompra(materialId: string, cantidad: number, referencia: string) {
    const { error } = await supabase
      .from('movimientos_materiales')
      .insert({ 
        material_id: materialId, 
        tipo: 'entrada', 
        cantidad, 
        referencia 
      });
    if (error) throw error;
    
    // Actualizar cantidad_utilizada como proxy de stock disponible/comprado
    const { error: updErr } = await supabase
      .from('materiales_proyecto')
      .update({ cantidad_utilizada: supabase.rpc('increment_cantidad', { row_id: materialId, delta: cantidad }) })
      .eq('id', materialId);
    if (updErr) throw updErr;
  },
};

