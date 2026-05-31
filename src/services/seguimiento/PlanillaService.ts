import { supabase } from '@/lib/supabase';
import { EmpleadoService } from './EmpleadoService';
import type { CreateTransaccion, Transaccion } from '@/types/supabase';
import { FinancieroService } from '../financiero/FinancieroService';

export const PlanillaService = {
  /**
   * Registra un pago de planilla validando la existencia del empleado.
   * Crea una transacción de gasto en la categoría 'mano-obra'.
   */
  async registrarPago(
    userId: string,
    datos: {
      empleadoId: string;
      proyectoId: string;
      monto: number;
      fecha: string;
      descripcion?: string;
    }
  ): Promise<Transaccion> {
    // 1. Validar que el empleado existe
    const empleado = await EmpleadoService.getPorId(datos.empleadoId);
    if (!empleado) {
      throw new Error(`El empleado con ID ${datos.empleadoId} no existe.`);
    }

    // 2. Preparar payload de la transacción
    const payload: CreateTransaccion = {
      tipo: 'gasto',
      descripcion: datos.descripcion || `Pago planilla: ${empleado.nombre}`,
      cantidad: 1,
      unidad: 'pago',
      categoria: 'mano-obra',
      costoUnitario: datos.monto,
      costoTotal: datos.monto,
      fecha: datos.fecha,
      proyectoId: datos.proyectoId,
      empleadoId: datos.empleadoId,
    };

    // 3. Registrar vía FinancieroService para mantener consistencia
    return await FinancieroService.registrarTransaccion(payload, userId);
  },

  /**
   * Obtiene el historial de pagos para un proyecto o empleado específico.
   */
  async obtenerPagos(filters: { proyectoId?: string; empleadoId?: string }): Promise<Transaccion[]> {
    let query = supabase
      .from('transacciones')
      .select('*')
      .eq('categoria', 'mano-obra')
      .order('fecha', { ascending: false });

    if (filters.proyectoId) {
      query = query.eq('proyecto_id', filters.proyectoId);
    }
    if (filters.empleadoId) {
      query = query.eq('empleado_id', filters.empleadoId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as Transaccion[];
  }
};
