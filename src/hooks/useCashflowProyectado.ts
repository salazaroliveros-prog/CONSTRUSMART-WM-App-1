/**
 * M4: CASH FLOW PROYECTADO AUTOMÁTICO
 * Sistema de proyección automática de ingresos y egresos
 */

import { useState, useEffect } from 'react';
import type { Transaccion } from '@/types/supabase';

export interface ProyeccionCashFlow {
  fecha: Date;
  ingresos: number;
  egresos: number;
  saldo: number;
  saldoAcumulado: number;
  esCritico: boolean; // true si saldo < 0
}

/**
 * Detectar transacciones recurrentes
 */
export function detectarRecurrencias(transacciones: Transaccion[]): Map<string, Transaccion[]> {
  const agrupadas = new Map<string, Transaccion[]>();

  // Agrupar por descripción similar
  transacciones.forEach((t) => {
    const clave = `${t.tipo}_${t.categoria}`;
    if (!agrupadas.has(clave)) {
      agrupadas.set(clave, []);
    }
    agrupadas.get(clave)!.push(t);
  });

  return agrupadas;
}

/**
 * Calcular frecuencia de transacción (diaria, semanal, mensual, etc)
 */
export function calcularFrecuencia(fechas: Date[]): 'diaria' | 'semanal' | 'mensual' | 'anual' | 'irregular' {
  if (fechas.length < 2) return 'irregular';

  const diferencias = [];
  const fechasOrdenadas = fechas.sort((a, b) => a.getTime() - b.getTime());

  for (let i = 1; i < fechasOrdenadas.length; i++) {
    const diff = Math.abs(fechasOrdenadas[i].getTime() - fechasOrdenadas[i - 1].getTime());
    diferencias.push(Math.round(diff / (1000 * 60 * 60 * 24))); // en días
  }

  const promedioDias = diferencias.reduce((a, b) => a + b, 0) / diferencias.length;

  if (promedioDias <= 1) return 'diaria';
  if (promedioDias <= 7) return 'semanal';
  if (promedioDias <= 31) return 'mensual';
  if (promedioDias <= 365) return 'anual';
  return 'irregular';
}

/**
 * Proyectar cash flow para N días
 */
export function proyectarCashflow(
  transacciones: Transaccion[],
  saldoInicial: number,
  dias: number = 90
): ProyeccionCashFlow[] {
  const proyecciones: ProyeccionCashFlow[] = [];
  const recurrencias = detectarRecurrencias(transacciones);
  let saldoAcumulado = saldoInicial;

  for (let d = 0; d < dias; d++) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + d);

    let ingresos = 0;
    let egresos = 0;

    // Simular transacciones recurrentes
    recurrencias.forEach((txns, clave) => {
      if (txns.length > 0) {
        const montoPromedio = txns.reduce((sum, t) => sum + (t.costoTotal || 0), 0) / txns.length;
        const frecuencia = calcularFrecuencia(txns.map((t) => new Date(t.fecha || new Date())));

        let debeAgregar = false;
        if (frecuencia === 'diaria') debeAgregar = true;
        if (frecuencia === 'semanal' && fecha.getDay() === 1) debeAgregar = true; // Lunes
        if (frecuencia === 'mensual' && fecha.getDate() === 1) debeAgregar = true; // Primer día
        if (frecuencia === 'anual' && fecha.getMonth() === 0 && fecha.getDate() === 1) debeAgregar = true; // 1 de enero

        if (debeAgregar) {
          const [tipo] = clave.split('_');
          if (tipo === 'ingreso') ingresos += montoPromedio;
          else egresos += montoPromedio;
        }
      }
    });

    saldoAcumulado += ingresos - egresos;

    proyecciones.push({
      fecha,
      ingresos,
      egresos,
      saldo: ingresos - egresos,
      saldoAcumulado,
      esCritico: saldoAcumulado < 0,
    });
  }

  return proyecciones;
}

/**
 * Detectar alertas de déficit
 */
export function detectarAlertas(proyecciones: ProyeccionCashFlow[]): string[] {
  const alertas: string[] = [];

  // Alerta si hay déficit en los próximos 15 días
  const proximosDias15 = proyecciones.slice(0, 15);
  const tieneDeficit15 = proximosDias15.some((p) => p.esCritico);
  if (tieneDeficit15) {
    alertas.push('🚨 ALERTA: Se proyecta déficit en los próximos 15 días');
  }

  // Alerta si hay déficit en los próximos 30 días
  const proximosDias30 = proyecciones.slice(0, 30);
  const peorSaldo30 = Math.min(...proximosDias30.map((p) => p.saldoAcumulado));
  if (peorSaldo30 < 0) {
    alertas.push(`⚠️ Se proyecta déficit máximo de Q ${Math.abs(peorSaldo30).toLocaleString()} en los próximos 30 días`);
  }

  // Tendencia negativa
  const cambioPromedio =
    proyecciones.slice(-7).reduce((sum, p) => sum + (p.saldo || 0), 0) / Math.max(1, proyecciones.slice(-7).length);
  if (cambioPromedio < 0) {
    alertas.push(`📉 Tendencia negativa: promedio -Q ${Math.abs(cambioPromedio).toLocaleString()} por día`);
  }

  return alertas;
}

/**
 * Hook para proyección de cash flow
 */
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
      const proys = proyectarCashflow(transacciones, saldoInicial, dias);
      setProyecciones(proys);
      setAlertas(detectarAlertas(proys));
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
