import type { Transaccion } from '@/types/supabase';
import { FinancieroService } from './FinancieroService';

/**
 * @deprecated Usar FinancieroService.proyectarTendencia en su lugar.
 * CashFlowService ahora delega a FinancieroService (fuente única).
 */
export const CashFlowService = {
  proyectarTendencia(transacciones: Transaccion[]) {
    return FinancieroService.proyectarTendencia(transacciones);
  }
};
