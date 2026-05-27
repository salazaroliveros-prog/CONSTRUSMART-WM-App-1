/**
 * CoreEngineService.ts
 * Motor centralizado de cálculos del ERP.
 * Consolida lógica de APUs, CashFlow, Gantt y Rentabilidad para evitar fragmentación.
 */

import { calcularAPU, type Renglon } from '@/data/renglones';
import type { Transaccion } from '@/types/supabase';

export interface ProyeccionCashFlow {
  fecha: Date;
  ingresos: number;
  egresos: number;
  saldo: number;
  saldoAcumulado: number;
  esCritico: boolean;
}

export const CoreEngineService = {
  // --- APU ENGINE ---
  calcularRenglon(renglon: Renglon) {
    return calcularAPU(renglon);
  },

  // --- CASH FLOW ENGINE (Unificado) ---
  proyectarCashflow(
    transacciones: Transaccion[],
    saldoInicial: number,
    dias: number = 90
  ): ProyeccionCashFlow[] {
    const proyecciones: ProyeccionCashFlow[] = [];
    const recurrencias = this.detectarRecurrencias(transacciones);
    let saldoAcumulado = saldoInicial;
    const ahora = new Date();

    for (let d = 0; d < dias; d++) {
      const fecha = new Date(ahora);
      fecha.setDate(ahora.getDate() + d);

      let ingresos = 0;
      let egresos = 0;

      recurrencias.forEach((txns, clave) => {
        if (txns.length > 0) {
          const montoPromedio = txns.reduce((sum, t) => sum + (t.costoTotal || 0), 0) / txns.length;
          const frecuencia = this.calcularFrecuencia(txns.map((t) => new Date(t.fecha || new Date())));

          let debeAgregar = false;
          if (frecuencia === 'diaria') debeAgregar = true;
          if (frecuencia === 'semanal' && fecha.getDay() === 1) debeAgregar = true;
          if (frecuencia === 'mensual' && fecha.getDate() === 1) debeAgregar = true;

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
  },

  detectarAlertas(proyecciones: ProyeccionCashFlow[]): string[] {
    const alertas: string[] = [];

    const proximosDias15 = proyecciones.slice(0, 15);
    const tieneDeficit15 = proximosDias15.some((p) => p.esCritico);
    if (tieneDeficit15) {
      alertas.push('🚨 ALERTA: Se proyecta déficit en los próximos 15 días');
    }

    const proximosDias30 = proyecciones.slice(0, 30);
    const peorSaldo30 = Math.min(...proximosDias30.map((p) => p.saldoAcumulado));
    if (peorSaldo30 < 0) {
      alertas.push(`⚠️ Se proyecta déficit máximo de Q ${Math.abs(peorSaldo30).toLocaleString()} en los próximos 30 días`);
    }

    const cambioPromedio =
      proyecciones.slice(-7).reduce((sum, p) => sum + (p.saldo || 0), 0) / Math.max(1, proyecciones.slice(-7).length);
    if (cambioPromedio < 0) {
      alertas.push(`📉 Tendencia negativa: promedio -Q ${Math.abs(cambioPromedio).toLocaleString()} por día`);
    }

    return alertas;
  },

  detectarRecurrencias(transacciones: Transaccion[]): Map<string, Transaccion[]> {
    const agrupadas = new Map<string, Transaccion[]>();
    transacciones.forEach((t) => {
      const clave = `${t.tipo}_${t.categoria}`;
      if (!agrupadas.has(clave)) {
        agrupadas.set(clave, []);
      }
      agrupadas.get(clave)!.push(t);
    });
    return agrupadas;
  },

  calcularFrecuencia(fechas: Date[]): 'diaria' | 'semanal' | 'mensual' | 'anual' | 'irregular' {
    if (fechas.length < 2) return 'irregular';
    const diferencias = [];
    const fechasOrdenadas = fechas.sort((a, b) => a.getTime() - b.getTime());

    for (let i = 1; i < fechasOrdenadas.length; i++) {
      const diff = Math.abs(fechasOrdenadas[i].getTime() - fechasOrdenadas[i - 1].getTime());
      diferencias.push(Math.round(diff / (1000 * 60 * 60 * 24)));
    }

    const promedioDias = diferencias.reduce((a, b) => a + b, 0) / diferencias.length;

    if (promedioDias <= 1) return 'diaria';
    if (promedioDias <= 7) return 'semanal';
    if (promedioDias <= 31) return 'mensual';
    if (promedioDias <= 365) return 'anual';
    return 'irregular';
  },

  // --- GANTT ENGINE ---
  // --- EVM ENGINE (Earned Value Management) ---
  calcularCurvaS(presupuestos: any[], transacciones: any[]) {
    // PV: Presupuesto planeado acumulado en el tiempo
    // EV: Presupuesto * Avance físico real
    // AC: Gastos reales acumulados
    return presupuestos.map(p => ({
      proyecto: p.proyecto,
      pv: p.total || 0,
      ev: (p.total || 0) * (p.avanceFisico || 0) / 100,
      ac: transacciones
            .filter(t => t.proyectoId === p.id)
            .reduce((s, t) => s + (t.tipo === 'gasto' ? t.costoTotal : 0), 0)
    }));
  },

  calcularDuracionRutaCritica(dias: number) {
    return Math.max(1, Math.round(dias));
  }
};
export type { Renglon };
