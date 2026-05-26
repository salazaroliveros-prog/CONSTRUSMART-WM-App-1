import { Transaccion } from '@/types/supabase';

/**
 * Servicio de Proyecciones Financieras (CashFlow).
 * Analiza la tendencia histórica y proyecta el saldo a 30, 60 y 90 días.
 */
export const CashFlowService = {
  /**
   * Calcula el promedio de gasto/ingreso diario de los últimos 30 días 
   * y proyecta hacia adelante.
   */
  proyectarTendencia(transacciones: Transaccion[]) {
    const ahora = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(ahora.getDate() - 30);

    const recientes = transacciones.filter(t => new Date(t.fecha) >= hace30Dias);
    
    const promIngresoDiario = recientes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0) / 30;
    const promGastoDiario = recientes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0) / 30;

    const netoDiario = promIngresoDiario - promGastoDiario;

    return {
      dias30: netoDiario * 30,
      dias60: netoDiario * 60,
      dias90: netoDiario * 90,
      netoDiario
    };
  }
};
