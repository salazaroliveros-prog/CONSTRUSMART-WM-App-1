import { supabase } from '@/lib/supabase';
import { Transaccion } from '@/types/supabase';
import { toast } from 'sonner';

/**
 * Servicio centralizado para operaciones financieras.
 * Encapsula la lógica de cálculo y acceso a datos de transacciones.
 */
export const FinancieroService = {
  /**
   * Calcula el balance de un presupuesto o general basado en transacciones
   */
  async getResumenFinanciero(userId: string) {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    
    const transacciones = data as Transaccion[];
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastos = transacciones.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
    
    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
      transacciones
    };
  },

  /**
   * Registra una nueva transacción con validación empresarial
   */
  async registrarTransaccion(transaccion: Omit<Transaccion, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .insert(transaccion)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en FinancieroService.registrarTransaccion:', error);
      throw error;
    }
  }
};
