import { supabase } from '@/lib/supabase';

/**
 * Servicio para gestión de nómina y pagos de personal.
 */
export const PlanillaService = {
  async registrarPago(presupuestoId: string, empleadoId: string, monto: number, fecha: string, notas: string) {
    const { data, error } = await supabase
      .from('transacciones')
      .insert({
        tipo: 'gasto',
        categoria: 'mano-obra',
        costo_total: monto,
        descripcion: `Pago planilla: ${notas}`,
        fecha: fecha,
        proyecto_id: presupuestoId
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  async getPagosPorProyecto(presupuestoId: string) {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('proyecto_id', presupuestoId)
      .eq('categoria', 'mano-obra');
    if (error) throw error;
    return data;
  }
};
