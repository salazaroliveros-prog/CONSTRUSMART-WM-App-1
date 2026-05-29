import { supabase } from '@/lib/supabase';

export const PlanillaService = {
  async registrarPago(
    presupuestoId: string,
    empleadoId: string,
    monto: number,
    fecha: string,
    notas: string,
    userId?: string,
  ) {
    if (!userId) {
      throw new Error('userId requerido para registrar pago');
    }

    // Validar existencia de empleado
    const { data: empleado, error: eError } = await supabase
      .from('empleados')
      .select('id')
      .eq('id', empleadoId)
      .eq('user_id', userId)
      .single();

    if (eError || !empleado) {
      throw new Error('El empleado seleccionado no existe o no es válido');
    }

    // Validar duplicados (mismo empleado, mismo proyecto, misma fecha)
    const { data: duplicado } = await supabase
      .from('transacciones')
      .select('id')
      .eq('empleado_id', empleadoId)
      .eq('proyecto_id', presupuestoId)
      .eq('fecha', fecha)
      .eq('categoria', 'mano-obra')
      .maybeSingle();

    if (duplicado) {
      throw new Error(`Ya existe un registro de pago para este empleado en la fecha ${fecha}`);
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
        user_id: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },

  async getPagosPorProyecto(presupuestoId: string) {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('proyecto_id', presupuestoId)
      .eq('categoria', 'mano-obra');
    if (error) throw error;
    return data as any;
  },

  async getPagosPorEmpleado(empleadoId: string) {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('empleado_id', empleadoId)
      .eq('categoria', 'mano-obra')
      .order('fecha', { ascending: false });
    if (error) throw error;
    return data as any;
  },
};