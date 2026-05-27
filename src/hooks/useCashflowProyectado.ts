/**
 * useCashflowProyectado
 * Hook reactivo que delega los cálculos al motor unificado CoreEngineService.
 */

import { useState, useEffect } from 'react';
import type { Transaccion } from '@/types/supabase';
import { CoreEngineService, type ProyeccionCashFlow } from '@/services/CoreEngineService';

export function useCashflowProyectado(
  transacciones: Transaccion[],
  saldoInicial: number = 0,
  dias: number = 90
) {
  const [proyecciones, setProyecciones] = useState<ProyeccionCashFlow[]>([]);
  const [alertas, setAlertas] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    try {
      const proys = CoreEngineService.proyectarCashflow(transacciones, saldoInicial, dias);
      setProyecciones(proys);
      setAlertas(CoreEngineService.detectarAlertas(proys));
    } catch (error) {
      console.error('Error proyectando cash flow:', error);
    } finally {
      setCargando(false);
    }
  }, [transacciones, saldoInicial, dias]);

  return {
    proyecciones,
    alertas,
    cargando,
    saldoFinal: proyecciones.length > 0 ? proyecciones[proyecciones.length - 1].saldoAcumulado : saldoInicial,
    peorSaldo: proyecciones.length > 0 ? Math.min(...proyecciones.map((p) => p.saldoAcumulado)) : saldoInicial,
  };
}
export type { ProyeccionCashFlow };
