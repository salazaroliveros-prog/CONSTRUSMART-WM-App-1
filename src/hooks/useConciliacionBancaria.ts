/**
 * useConciliacionBancaria - Hook para conciliación de caja
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import {
  inicializarCajaProyecto,
  registrarMovimiento,
  conciliarDiferencia,
  generarResumenConciliacion,
  type CajaProyecto,
} from '@/utils/conciliacionBancaria';

export function useConciliacionBancaria(proyecto_id: string, saldo_inicial: number) {
  const { session } = useAppContext();
  const [caja, setCaja] = useState<CajaProyecto>(() =>
    inicializarCajaProyecto(proyecto_id, saldo_inicial)
  );

  useEffect(() => {
    if (!proyecto_id) return;
    const cargar = async () => {
      const { data: concs } = await supabase
        .from('conciliaciones')
        .select('*, partidas_conciliacion(*)')
        .eq('id', proyecto_id)
        .single();
      if (concs) {
        setCaja(prev => ({
          ...prev,
          saldo_sistema_actual: Number(concs.saldo_libros),
          saldo_real_actual: Number(concs.saldo_banco),
          movimientos: (concs.partidas_conciliacion || []).map((p: any) => ({
            id: p.id,
            proyecto_id,
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
    };
    cargar();
  }, [proyecto_id]);

  const registrar = useCallback(
    async (fecha: Date, descripcion: string, subtipo: 'retiro' | 'deposito' | 'gasto' | 'ingreso' | 'ajuste', monto: number, saldo_real?: number) => {
      setCaja(prev => registrarMovimiento(prev, fecha, descripcion, subtipo, monto, saldo_real));
      await supabase.from('conciliaciones').upsert({
        id: proyecto_id,
        user_id: session?.user?.id,
        banco: 'Caja chica',
        periodo: fecha.toISOString().slice(0, 7) + '-01',
        saldo_libros: caja.saldo_sistema_actual + (subtipo === 'ingreso' || subtipo === 'deposito' ? monto : -monto),
        saldo_banco: saldo_real ?? caja.saldo_real_actual,
      }, { onConflict: 'id' });
    },
    [caja, proyecto_id, session]
  );

  const conciliar = useCallback(
    async (movimiento_id: string, saldo_real_confirmado: number, motivo?: string) => {
      setCaja(prev => conciliarDiferencia(prev, movimiento_id, saldo_real_confirmado, motivo));
      await supabase.from('partidas_conciliacion').update({ aplicado: true }).eq('id', movimiento_id);
    },
    []
  );

  const resumen = generarResumenConciliacion(caja);

  return { caja, registrar, conciliar, resumen };
}
