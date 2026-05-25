/**
 * M8: Conciliación Bancaria / Caja Chica - Seguimiento de efectivo
 */

import type { Transaccion } from '@/types/supabase';

export type SubtipoMovimiento = 'retiro' | 'deposito' | 'gasto' | 'ingreso' | 'ajuste';

export interface Movimiento {
  id: string;
  proyecto_id: string;
  fecha: Date;
  descripcion: string;
  subtipo: SubtipoMovimiento;
  monto: number;
  saldo_sistema: number;
  saldo_real?: number;
  diferencia?: number;
  estado: 'sin_conciliar' | 'conciliado' | 'ajustado';
}

export interface CajaProyecto {
  proyecto_id: string;
  saldo_inicial: number;
  saldo_sistema_actual: number;
  saldo_real_actual: number;
  diferencia_total: number;
  movimientos: Movimiento[];
  ultimas_5_diferencias: number[];
}

export interface ResumenConciliacion {
  saldo_sistema: number;
  saldo_real: number;
  diferencia: number;
  porcentaje_diferencia: number;
  movimientos_sin_conciliar: number;
  alertas_diferencia: string[];
}

/**
 * Inicializar caja para proyecto
 */
export function inicializarCajaProyecto(
  proyecto_id: string,
  saldo_inicial: number
): CajaProyecto {
  return {
    proyecto_id,
    saldo_inicial,
    saldo_sistema_actual: saldo_inicial,
    saldo_real_actual: saldo_inicial,
    diferencia_total: 0,
    movimientos: [],
    ultimas_5_diferencias: [],
  };
}

/**
 * Registrar movimiento de caja (retiro, depósito, etc.)
 */
export function registrarMovimiento(
  caja: CajaProyecto,
  fecha: Date,
  descripcion: string,
  subtipo: SubtipoMovimiento,
  monto: number,
  saldo_real?: number
): CajaProyecto {
  // Calcular nuevo saldo sistema
  let saldo_sistema = caja.saldo_sistema_actual;
  
  if (subtipo === 'retiro' || subtipo === 'gasto') {
    saldo_sistema -= monto;
  } else if (subtipo === 'deposito' || subtipo === 'ingreso' || subtipo === 'ajuste') {
    saldo_sistema += monto;
  }

  // Calcular diferencia si se proporciona saldo real
  let diferencia = 0;
  if (saldo_real !== undefined) {
    diferencia = saldo_sistema - saldo_real;
  }

  const movimiento: Movimiento = {
    id: crypto.randomUUID(),
    proyecto_id: caja.proyecto_id,
    fecha,
    descripcion,
    subtipo,
    monto,
    saldo_sistema,
    saldo_real,
    diferencia,
    estado: diferencia === 0 ? 'conciliado' : 'sin_conciliar',
  };

  const nuevosCajaUltimas5 = [...caja.ultimas_5_diferencias, diferencia].slice(-5);

  return {
    ...caja,
    saldo_sistema_actual: saldo_sistema,
    saldo_real_actual: saldo_real ?? caja.saldo_real_actual,
    diferencia_total: diferencia,
    movimientos: [...caja.movimientos, movimiento],
    ultimas_5_diferencias: nuevosCajaUltimas5,
  };
}

/**
 * Procesar conciliación manual (ajustar diferencias)
 */
export function conciliarDiferencia(
  caja: CajaProyecto,
  movimiento_id: string,
  saldo_real_confirmado: number,
  motivo_ajuste?: string
): CajaProyecto {
  const movimiento = caja.movimientos.find(m => m.id === movimiento_id);
  
  if (!movimiento) return caja;

  // Si hay diferencia, crear ajuste
  if (movimiento.saldo_real !== saldo_real_confirmado) {
    const diferencia = movimiento.saldo_sistema - saldo_real_confirmado;
    
    // Registrar ajuste automático
    const ajuste: Movimiento = {
      id: crypto.randomUUID(),
      proyecto_id: caja.proyecto_id,
      fecha: new Date(),
      descripcion: `AJUSTE: ${motivo_ajuste || 'Diferencia conciliada'}`,
      subtipo: 'ajuste',
      monto: Math.abs(diferencia),
      saldo_sistema: movimiento.saldo_sistema,
      saldo_real: saldo_real_confirmado,
      diferencia: 0,
      estado: 'conciliado',
    };

    // Actualizar movimiento original y agregar ajuste
    const movimientosActualizados = caja.movimientos.map(m =>
      m.id === movimiento_id
        ? { ...m, saldo_real: saldo_real_confirmado, estado: 'ajustado' as const, diferencia: 0 }
        : m
    );

    return {
      ...caja,
      saldo_sistema_actual: movimiento.saldo_sistema,
      saldo_real_actual: saldo_real_confirmado,
      diferencia_total: 0,
      movimientos: [...movimientosActualizados, ajuste],
    };
  }

  return {
    ...caja,
    movimientos: caja.movimientos.map(m =>
      m.id === movimiento_id ? { ...m, estado: 'conciliado' as const } : m
    ),
  };
}

/**
 * Detectar tendencias de diferencias
 */
export function detectarTendenciasDiferencias(caja: CajaProyecto): {
  tendencia: 'positiva' | 'negativa' | 'estable';
  velocidad: 'lenta' | 'moderada' | 'rapida';
  diferencia_promedio: number;
} {
  if (caja.ultimas_5_diferencias.length < 2) {
    return {
      tendencia: 'estable',
      velocidad: 'lenta',
      diferencia_promedio: 0,
    };
  }

  const difs = caja.ultimas_5_diferencias;
  const promedio = difs.reduce((a, b) => a + b, 0) / difs.length;

  // Tendencia: comparar últimas 2 vs primeras 3
  const ultimasRecientes = difs.slice(-2).reduce((a, b) => a + b, 0) / 2;
  const ultimasAnteriores = difs.slice(0, -2).reduce((a, b) => a + b, 0) / Math.max(1, difs.length - 2);

  let tendencia: 'positiva' | 'negativa' | 'estable' = 'estable';
  if (ultimasRecientes > ultimasAnteriores * 1.1) tendencia = 'positiva';
  else if (ultimasRecientes < ultimasAnteriores * 0.9) tendencia = 'negativa';

  // Velocidad del cambio
  const cambioPromedio = Math.abs(ultimasRecientes - ultimasAnteriores);
  let velocidad: 'lenta' | 'moderada' | 'rapida' = 'lenta';
  if (cambioPromedio > Math.abs(promedio) * 0.5) velocidad = 'rapida';
  else if (cambioPromedio > Math.abs(promedio) * 0.2) velocidad = 'moderada';

  return { tendencia, velocidad, diferencia_promedio: promedio };
}

/**
 * Generar resumen de conciliación
 */
export function generarResumenConciliacion(caja: CajaProyecto): ResumenConciliacion {
  const diferencia = caja.saldo_sistema_actual - caja.saldo_real_actual;
  const porcentajeDiferencia = caja.saldo_sistema_actual > 0 
    ? (Math.abs(diferencia) / caja.saldo_sistema_actual) * 100 
    : 0;

  const movimientosSinConciliar = caja.movimientos.filter(m => m.estado === 'sin_conciliar').length;

  const alertas: string[] = [];

  if (Math.abs(diferencia) > caja.saldo_sistema_actual * 0.05) {
    alertas.push(`🚨 Diferencia CRÍTICA: Q${diferencia.toFixed(2)} (${porcentajeDiferencia.toFixed(1)}%)`);
  }

  if (diferencia > 0) {
    alertas.push(`⚠️ Faltante en caja: Q${diferencia.toFixed(2)} (registro > físico)`);
  } else if (diferencia < 0) {
    alertas.push(`✅ Sobrante en caja: Q${Math.abs(diferencia).toFixed(2)} (registro < físico)`);
  }

  if (movimientosSinConciliar > 5) {
    alertas.push(`⚠️ ${movimientosSinConciliar} movimientos sin conciliar`);
  }

  // Analizar tendencia
  const { tendencia, velocidad } = detectarTendenciasDiferencias(caja);
  if (tendencia === 'positiva' && velocidad === 'rapida') {
    alertas.push('🚨 Las diferencias AUMENTAN rápidamente - revisar urgente');
  }

  return {
    saldo_sistema: caja.saldo_sistema_actual,
    saldo_real: caja.saldo_real_actual,
    diferencia,
    porcentaje_diferencia: porcentajeDiferencia,
    movimientos_sin_conciliar: movimientosSinConciliar,
    alertas_diferencia: alertas,
  };
}

/**
 * Proyectar insuficiencia de caja
 */
export function proyectarInsuficiencia(
  caja: CajaProyecto,
  gastos_proximos_dias: number[]
): { dias_insuficiencia: number; monto_faltante: number } {
  let saldo = caja.saldo_real_actual;
  let diasInsuficiencia = -1;

  for (let i = 0; i < gastos_proximos_dias.length; i++) {
    saldo -= gastos_proximos_dias[i];
    if (saldo < 0 && diasInsuficiencia === -1) {
      diasInsuficiencia = i + 1;
      break;
    }
  }

  return {
    dias_insuficiencia: diasInsuficiencia,
    monto_faltante: diasInsuficiencia >= 0 ? Math.abs(saldo) : 0,
  };
}
