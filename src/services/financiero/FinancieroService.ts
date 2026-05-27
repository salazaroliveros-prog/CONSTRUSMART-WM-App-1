import { supabase } from '@/lib/supabase';
import { Transaccion } from '@/types/supabase';
import { toast } from 'sonner';

/**
 * Servicio centralizado para operaciones financieras.
 * Encapsula la lógica de cálculo y acceso a datos de transacciones.
 * FUENTE ÚNICA para proyecciones de cash flow.
 */
export const FinancieroService = {
  /**
   * Calcula el balance incluyendo la nómina real (mano-obra)
   */
  async getResumenFinancieroDetallado(userId: string) {
    const { data, error } = await supabase
      .from('transacciones')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    
    const transacciones = data as Transaccion[];
    const ingresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
    const gastosGenerales = transacciones.filter(t => t.tipo === 'gasto' && t.categoria !== 'mano-obra').reduce((s, t) => s + t.costoTotal, 0);
    const gastosPersonal = transacciones.filter(t => t.tipo === 'gasto' && t.categoria === 'mano-obra').reduce((s, t) => s + t.costoTotal, 0);
    
    return {
      ingresos,
      gastosGenerales,
      gastosPersonal,
      rentabilidadNeta: ingresos - gastosGenerales - gastosPersonal
    };
  },


  /**
   * Obtiene transacciones, opcionalmente filtradas por proyecto
   */
  async getTransacciones(userId?: string, proyectoId?: string) {
    let query = supabase.from('transacciones').select('*');
    if (userId) query = query.eq('user_id', userId);
    if (proyectoId) query = query.eq('proyecto_id', proyectoId);
    query = query.order('fecha', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Transaccion[];
  },

  async deleteTransaccion(id: string, userId?: string) {
    let query = supabase.from('transacciones').delete().eq('id', id);
    if (userId) query = query.eq('user_id', userId);
    const { error } = await query;
    if (error) throw error;
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
  },

  /** Proyecta tendencia financiera 30/60/90 días basado en últimos 30 días */
  proyectarTendencia(transacciones: Transaccion[]) {
    const ahora = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(ahora.getDate() - 30);
    const recientes = transacciones.filter(t => new Date(t.fecha) >= hace30Dias);
    const promIngresoDiario = recientes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0) / 30;
    const promGastoDiario = recientes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0) / 30;
    const netoDiario = promIngresoDiario - promGastoDiario;
    return { dias30: netoDiario * 30, dias60: netoDiario * 60, dias90: netoDiario * 90, netoDiario };
  }
};
