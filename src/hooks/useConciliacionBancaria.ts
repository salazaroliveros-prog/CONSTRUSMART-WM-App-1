/**
 * useConciliacionBancaria - Hook para conciliación de caja
 */

import { useState, useCallback } from 'react';
import {
  inicializarCajaProyecto,
  registrarMovimiento,
  conciliarDiferencia,
  generarResumenConciliacion,
  type CajaProyecto,
} from '@/utils/conciliacionBancaria';

export function useConciliacionBancaria(proyecto_id: string, saldo_inicial: number) {
  const [caja, setCaja] = useState<CajaProyecto>(() =>
    inicializarCajaProyecto(proyecto_id, saldo_inicial)
  );

  const registrar = useCallback(
    (fecha: Date, descripcion: string, subtipo: 'retiro' | 'deposito' | 'gasto' | 'ingreso' | 'ajuste', monto: number, saldo_real?: number) => {
      setCaja(prev => registrarMovimiento(prev, fecha, descripcion, subtipo, monto, saldo_real));
    },
    []
  );

  const conciliar = useCallback(
    (movimiento_id: string, saldo_real_confirmado: number, motivo?: string) => {
      setCaja(prev => conciliarDiferencia(prev, movimiento_id, saldo_real_confirmado, motivo));
    },
    []
  );

  const resumen = generarResumenConciliacion(caja);

  return { caja, registrar, conciliar, resumen };
}
