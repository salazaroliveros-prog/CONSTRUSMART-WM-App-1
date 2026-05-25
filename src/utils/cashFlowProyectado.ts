/**
 * M4: Cash Flow Proyectado - Proyección automática de flujo de caja
 */

import type { Transaccion, Presupuesto } from '@/types/supabase';

export interface ProyeccionDia {
  fecha: Date;
  saldoInicial: number;
  ingresos: number;
  gastos: number;
  saldoFinal: number;
  deficit: boolean;
}

export interface ResumenCashFlow {
  saldoActual: number;
  proyeccionDias: number;
  diasDeficit: number;
  montoMinimo: number;
  montoMaximo: number;
  promedioSaldo: number;
  ingresosTotales: number;
  gastosTotales: number;
  alertas: string[];
}

export interface TransaccionRecurrente {
  descripcion: string;
  monto: number;
  tipo: 'ingreso' | 'gasto';
  frecuencia: 'diaria' | 'semanal' | 'mensual'; // días
  proximaFecha: Date;
  activa: boolean;
}

/**
 * Detectar transacciones recurrentes automáticamente
 */
export function detectarRecurrencias(transacciones: Transaccion[]): TransaccionRecurrente[] {
  if (transacciones.length < 3) return [];

  const grupos = new Map<string, Transaccion[]>();
  
  // Agrupar por descripción y categoría
  transacciones.forEach(t => {
    const key = `${t.descripcion}-${t.categoria}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(t);
  });

  const recurrentes: TransaccionRecurrente[] = [];

  grupos.forEach((txns, key) => {
    if (txns.length < 2) return;

    // Ordenar por fecha
    txns.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Calcular diferencias entre transacciones
    const diferencias: number[] = [];
    for (let i = 1; i < txns.length; i++) {
      const diff = Math.abs(
        new Date(txns[i].fecha).getTime() - new Date(txns[i - 1].fecha).getTime()
      ) / (1000 * 60 * 60 * 24); // en días
      diferencias.push(diff);
    }

    // Si hay patrón, agregar como recurrente
    const promedioDias = diferencias.reduce((a, b) => a + b, 0) / diferencias.length;
    const esRegular = diferencias.every(d => Math.abs(d - promedioDias) < promedioDias * 0.3);

    if (esRegular && promedioDias < 365) {
      let frecuencia: 'diaria' | 'semanal' | 'mensual' = 'mensual';
      if (promedioDias <= 1.5) frecuencia = 'diaria';
      else if (promedioDias <= 10) frecuencia = 'semanal';

      const ultimaTxn = txns[txns.length - 1];
      const proximaFecha = new Date(ultimaTxn.fecha);
      
      if (frecuencia === 'diaria') proximaFecha.setDate(proximaFecha.getDate() + 1);
      else if (frecuencia === 'semanal') proximaFecha.setDate(proximaFecha.getDate() + 7);
      else proximaFecha.setMonth(proximaFecha.getMonth() + 1);

      recurrentes.push({
        descripcion: txns[0].descripcion || key,
        monto: txns[0].costoTotal,
        tipo: txns[0].tipo as 'ingreso' | 'gasto',
        frecuencia,
        proximaFecha,
        activa: true,
      });
    }
  });

  return recurrentes;
}

/**
 * Proyectar flujo de caja a N días
 */
export function proyectarCashFlow(
  saldoInicial: number,
  transacciones: Transaccion[],
  presupuestos: Presupuesto[],
  diasProyeccion: number = 90
): ProyeccionDia[] {
  const proyecciones: ProyeccionDia[] = [];
  const recurrentes = detectarRecurrencias(transacciones);

  let saldoActual = saldoInicial;
  const hoy = new Date();

  // Consolidar transacciones futuras
  const futuras = transacciones.filter(t => new Date(t.fecha) >= hoy);

  for (let dia = 0; dia <= diasProyeccion; dia++) {
    const fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + dia);

    let ingresosDia = 0;
    let gastosDia = 0;

    // Transacciones programadas
    futuras.forEach(t => {
      if (t.fecha === fecha.toISOString().split('T')[0]) {
        if (t.tipo === 'ingreso') ingresosDia += t.costoTotal;
        else gastosDia += t.costoTotal;
      }
    });

    // Transacciones recurrentes
    recurrentes
      .filter(r => r.activa)
      .forEach(r => {
        if (
          fecha.getDate() === r.proximaFecha.getDate() &&
          fecha.getMonth() === r.proximaFecha.getMonth()
        ) {
          if (r.tipo === 'ingreso') ingresosDia += r.monto;
          else gastosDia += r.monto;
        }
      });

    // Pagos por fase de presupuesto (simulado)
    presupuestos
      .filter(p => p.fase === 'ejecución')
      .forEach(p => {
        if (dia % 14 === 0) {
          // Simulación: ingreso cada 2 semanas
          ingresosDia += (p.total || 0) * 0.1;
        }
      });

    const saldoFinal = saldoActual + ingresosDia - gastosDia;

    proyecciones.push({
      fecha,
      saldoInicial: saldoActual,
      ingresos: ingresosDia,
      gastos: gastosDia,
      saldoFinal,
      deficit: saldoFinal < 0,
    });

    saldoActual = saldoFinal;
  }

  return proyecciones;
}

/**
 * Generar resumen y alertas
 */
export function analizarCashFlow(proyecciones: ProyeccionDia[]): ResumenCashFlow {
  if (proyecciones.length === 0) {
    return {
      saldoActual: 0,
      proyeccionDias: 0,
      diasDeficit: 0,
      montoMinimo: 0,
      montoMaximo: 0,
      promedioSaldo: 0,
      ingresosTotales: 0,
      gastosTotales: 0,
      alertas: [],
    };
  }

  const diasDeficit = proyecciones.filter(p => p.deficit).length;
  const saldos = proyecciones.map(p => p.saldoFinal);
  const ingresosTotales = proyecciones.reduce((sum, p) => sum + p.ingresos, 0);
  const gastosTotales = proyecciones.reduce((sum, p) => sum + p.gastos, 0);

  const alertas: string[] = [];

  if (diasDeficit > 0) {
    alertas.push(`🚨 Déficit proyectado en ${diasDeficit} días`);
  }

  if (Math.min(...saldos) < 0) {
    alertas.push(`⚠️ Saldo negativo proyectado: Q ${Math.min(...saldos).toFixed(2)}`);
  }

  const ultimoSaldo = proyecciones[proyecciones.length - 1].saldoFinal;
  if (ultimoSaldo < ingresosTotales * 0.1) {
    alertas.push(`⚠️ Saldo final bajo (${(ultimoSaldo / ingresosTotales * 100).toFixed(0)}% de ingresos)`);
  }

  if (ingresosTotales === 0) {
    alertas.push('🚨 Sin ingresos proyectados en el período');
  }

  return {
    saldoActual: proyecciones[0].saldoInicial,
    proyeccionDias: proyecciones.length - 1,
    diasDeficit,
    montoMinimo: Math.min(...saldos),
    montoMaximo: Math.max(...saldos),
    promedioSaldo: saldos.reduce((a, b) => a + b, 0) / saldos.length,
    ingresosTotales,
    gastosTotales,
    alertas,
  };
}

/**
 * Sugerir acciones preventivas
 */
export function sugerenciasPreventivas(resumen: ResumenCashFlow): string[] {
  const sugerencias: string[] = [];

  if (resumen.diasDeficit > 0) {
    sugerencias.push('💡 Considera acelerar cobros de proyectos en ejecución');
  }

  if (resumen.montoMinimo < 0) {
    sugerencias.push('💡 Establece una línea de crédito contingente');
  }

  if (resumen.gastosTotales > resumen.ingresosTotales * 0.8) {
    sugerencias.push('💡 Gastos altos - revisar presupuestos y eficiencia');
  }

  if (resumen.promedioSaldo < 50000) {
    sugerencias.push('💡 Saldo promedio bajo - considera capitalización');
  }

  return sugerencias;
}
