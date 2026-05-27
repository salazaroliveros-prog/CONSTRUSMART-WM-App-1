import { useState, useCallback, useEffect } from 'react';
import { ConciliacionService } from '@/services/financiero/ConciliacionService';
import { useAppContext } from '@/contexts/AppContext';
import {
  inicializarCajaProyecto,
  registrarMovimiento,
  conciliarDiferencia,
  generarResumenConciliacion,
  type CajaProyecto,
} from '@/utils/conciliacionBancaria';

export function useConciliacionBancaria(presupuestoId: string, saldoInicial: number) {
  const { session } = useAppContext();
  const [caja, setCaja] = useState<CajaProyecto>(() =>
    inicializarCajaProyecto(presupuestoId, saldoInicial)
  );

  useEffect(() => {
    if (!presupuestoId) return;
    const cargar = async () => {
      try {
        const concs = await ConciliacionService.getConciliacionPorProyecto(presupuestoId);
        if (concs) {
          setCaja(prev => ({
            ...prev,
            saldo_sistema_actual: Number(concs.saldo_libros),
            saldo_real_actual: Number(concs.saldo_banco),
            movimientos: (concs.partidas_conciliacion || []).map((p: any) => ({
              id: p.id,
              proyecto_id: presupuestoId,
              fecha: new Date(p.fecha),
              descripcion: p.descripcion,
              subtipo: p.tipo === 'pendiente_libros' ? 'gasto' : p.tipo === 'pendiente_banco' ? 'ingreso' : 'ajuste',
              monto: Number(p.monto),
              saldo_sistema: 0,
              saldo_real: undefined,
              estado: p.aplicado ? 'conciliado' : 'sin_conciliar',
            })),
          }));
        }
      } catch (error) {
        console.error('Error al cargar conciliación:', error);
      }
    };
    cargar();
  }, [presupuestoId]);

  const registrar = useCallback(
    async (fecha: Date, descripcion: string, subtipo: 'retiro' | 'deposito' | 'gasto' | 'ingreso' | 'ajuste', monto: number, saldo_real?: number) => {
      setCaja(prev => registrarMovimiento(prev, fecha, descripcion, subtipo, monto, saldo_real));
      const nuevoSaldo = caja.saldo_sistema_actual + (subtipo === 'ingreso' || subtipo === 'deposito' ? monto : -monto);
      
      if (session?.user?.id) {
        await ConciliacionService.upsertConciliacion({
          proyecto_id: presupuestoId,
          user_id: session.user.id,
          banco: 'Caja chica',
          periodo: fecha.toISOString().slice(0, 7) + '-01',
          saldo_libros: nuevoSaldo,
          saldo_banco: saldo_real ?? caja.saldo_real_actual,
        });
      }
    },
    [caja, presupuestoId, session]
  );

  const conciliar = useCallback(
    async (movimiento_id: string, saldo_real_confirmado: number, motivo?: string) => {
      setCaja(prev => conciliarDiferencia(prev, movimiento_id, saldo_real_confirmado, motivo));
      await ConciliacionService.updatePartida(movimiento_id, true);
    },
    []
  );

  const resumen = generarResumenConciliacion(caja);

  return { caja, registrar, conciliar, resumen };
}
