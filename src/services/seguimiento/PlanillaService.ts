import { supabase } from '@/lib/supabase';

export const PlanillaService = {
  async registrarPago(
    presupuestoId: string,
    empleadoId: string,
    monto: number,
    fecha: string,
    notas: string
  ) {
    // Validar existencia de empleado
    const { data: empleado, error: eError } = await supabase
      .from('empleados')
      .select('id')
      .eq('id', empleadoId)
      .single();

    if (eError || !empleado) {
      throw new Error('El empleado seleccionado no existe o no es válido');
    }

    const { data, error } = await supabase
      .from('transacciones')
      .insert({
        tipo: 'gasto',
        categoria: 'mano-obra',
        costo_total: monto,
        descripcion: `Pago planilla: ${notas}`,
        fecha: fecha,
        proyecto_id: presupuestoId,
        empleado_id: empleadoId,
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
  },

  async getPagosPorEmpleado(empleadoId: string) {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('empleado_id', empleadoId)
      .eq('categoria', 'mano-obra')
      .order('fecha', { ascending: false });
    if (error) throw error;
    return data;
  },
};
