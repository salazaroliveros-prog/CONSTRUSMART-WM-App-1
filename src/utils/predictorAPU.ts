import type { Presupuesto } from '@/types/supabase';

export interface Suggestion {
  tipo: 'factor' | 'renglon' | 'cliente' | 'duracion' | 'rentabilidad';
  mensaje: string;
  valor?: unknown;
  confianza?: number; // 0-100
}

export interface PrediccionPresupuesto {
  presupuestoEstimado: number;
  rango: { min: number; max: number };
  factoresRecomendados: {
    factor_indirectos: number;
    factor_administrativos: number;
    factor_imprevistos: number;
    factor_utilidad: number;
  };
  duracionEstimada: number; // días
  rentabilidadEsperada: number; // %
  confianza: number; // 0-100
}

export function sugerirAPU(presupuestosAnteriores: Presupuesto[], tipologia: string): Suggestion[] {
  const relacionados = presupuestosAnteriores.filter(p => p.tipologia === tipologia && p.total > 0);
  if (relacionados.length === 0) return [];

  const avgIndirectos = relacionados.reduce((s, p) => s + p.factor_indirectos, 0) / relacionados.length;
  const avgAdmin = relacionados.reduce((s, p) => s + p.factor_administrativos, 0) / relacionados.length;
  const avgImprev = relacionados.reduce((s, p) => s + p.factor_imprevistos, 0) / relacionados.length;
  const avgUtilidad = relacionados.reduce((s, p) => s + p.factor_utilidad, 0) / relacionados.length;
  const avgTotal = relacionados.reduce((s, p) => s + p.total, 0) / relacionados.length;

  const sugerencias: Suggestion[] = [];

  if (relacionados.length >= 2) {
    sugerencias.push({
      tipo: 'factor',
      mensaje: `Basado en ${relacionados.length} proyectos similares (${tipologia}): Indirectos ${avgIndirectos.toFixed(0)}%, Admin ${avgAdmin.toFixed(0)}%, Imprevistos ${avgImprev.toFixed(0)}%, Utilidad ${avgUtilidad.toFixed(0)}%`,
      valor: { factor_indirectos: Math.round(avgIndirectos), factor_administrativos: Math.round(avgAdmin), factor_imprevistos: Math.round(avgImprev), factor_utilidad: Math.round(avgUtilidad) },
      confianza: Math.min(100, relacionados.length * 15),
    });
    sugerencias.push({
      tipo: 'factor',
      mensaje: `Presupuesto promedio para ${tipologia}: Q${avgTotal.toLocaleString()}`,
      confianza: Math.min(100, relacionados.length * 15),
    });
  }

  return sugerencias;
}

/**
 * M3: PREDICTOR APU - Predecir presupuesto basado en histórico
 */
export function predecirPresupuesto(
  presupuestosAnteriores: Presupuesto[],
  tipologia: string,
  presupuestoBase: number
): PrediccionPresupuesto {
  const relacionados = presupuestosAnteriores.filter(
    (p) => p.tipologia === tipologia && p.total > 0 && p.avance && p.avance > 0.3 // Proyectos con avance mínimo
  );

  if (relacionados.length === 0) {
    // Sin datos históricos, devolver predicción conservadora
    return {
      presupuestoEstimado: presupuestoBase,
      rango: { min: presupuestoBase * 0.9, max: presupuestoBase * 1.2 },
      factoresRecomendados: {
        factor_indirectos: 10,
        factor_administrativos: 8,
        factor_imprevistos: 5,
        factor_utilidad: 20,
      },
      duracionEstimada: 30,
      rentabilidadEsperada: 15,
      confianza: 30,
    };
  }

  // Análisis de varianza histórica
  const varianzas = relacionados.map((p) => {
    const presupuesto = p.total || 1;
    const gasto = p.gastos || 0;
    return (gasto / presupuesto) * 100; // % de gasto vs presupuesto
  });

  const varianzaPromedio = varianzas.reduce((a, b) => a + b, 0) / varianzas.length;
  const desviacion = Math.sqrt(varianzas.reduce((sum, v) => sum + Math.pow(v - varianzaPromedio, 2), 0) / varianzas.length);

  // Calcular presupuesto estimado con margen de seguridad
  const factorVarianza = 1 + desviacion / 100;
  const presupuestoEstimado = presupuestoBase * factorVarianza;

  return {
    presupuestoEstimado: Math.round(presupuestoEstimado),
    rango: {
      min: Math.round(presupuestoEstimado * 0.85),
      max: Math.round(presupuestoEstimado * 1.15),
    },
    factoresRecomendados: {
      factor_indirectos: Math.round(relacionados.reduce((s, p) => s + p.factor_indirectos, 0) / relacionados.length),
      factor_administrativos: Math.round(
        relacionados.reduce((s, p) => s + p.factor_administrativos, 0) / relacionados.length
      ),
      factor_imprevistos: Math.round(relacionados.reduce((s, p) => s + p.factor_imprevistos, 0) / relacionados.length),
      factor_utilidad: Math.round(relacionados.reduce((s, p) => s + p.factor_utilidad, 0) / relacionados.length),
    },
    duracionEstimada: Math.round(
      relacionados.reduce((sum, p) => sum + ((p.dias_duracion || 30) as number), 0) / relacionados.length
    ),
    rentabilidadEsperada: Math.round(
      relacionados
        .map((p) => ((p.total - (p.gastos || 0)) / p.total) * 100)
        .reduce((a, b) => a + b, 0) / relacionados.length
    ),
    confianza: Math.min(95, relacionados.length * 12),
  };
}

/**
 * Buscar presupuestos similares (por tipología y rango de monto)
 */
export function buscarPresupuestosSimilares(
  presupuestosAnteriores: Presupuesto[],
  tipologia: string,
  monto: number
): Presupuesto[] {
  const rango = monto * 0.2; // ±20%
  return presupuestosAnteriores.filter(
    (p) =>
      p.tipologia === tipologia &&
      p.total &&
      p.total >= monto - rango &&
      p.total <= monto + rango &&
      p.estado === 'Finalizado' // Solo proyectos completados como referencia
  );
}

/**
 * Calcular duración estimada basada en renglones y cantidades
 */
export function estimarDuracion(cantidadRenglones: number, cantidadTotal: number): number {
  // Heurística: promedio 5-10 días por 10 renglones + proporción de cantidad
  const diasPorRenglon = 0.5 + cantidadTotal / 1000;
  return Math.max(5, Math.round(cantidadRenglones * diasPorRenglon));
}

/**
 * Generar sugerencias combinadas para nuevo presupuesto
 */
export function generarSugerenciasCompletas(
  presupuestosAnteriores: Presupuesto[],
  tipologia: string,
  montoBase: number,
  cantidadRenglones: number,
  cantidadTotal: number
): Suggestion[] {
  const sugerencias: Suggestion[] = [];
  const prediccion = predecirPresupuesto(presupuestosAnteriores, tipologia, montoBase);
  const duracionEstimada = estimarDuracion(cantidadRenglones, cantidadTotal);
  const similares = buscarPresupuestosSimilares(presupuestosAnteriores, tipologia, montoBase);

  // Sugerencia de monto
  sugerencias.push({
    tipo: 'rentabilidad',
    mensaje: `📊 Presupuesto estimado: Q ${prediccion.presupuestoEstimado.toLocaleString()} (rango: Q ${prediccion.rango.min.toLocaleString()} - Q ${prediccion.rango.max.toLocaleString()})`,
    valor: prediccion.presupuestoEstimado,
    confianza: prediccion.confianza,
  });

  // Sugerencia de duración
  sugerencias.push({
    tipo: 'duracion',
    mensaje: `⏱️ Duración estimada: ${duracionEstimada} días basado en ${cantidadRenglones} renglones`,
    valor: duracionEstimada,
    confianza: 65,
  });

  // Sugerencia de rentabilidad
  sugerencias.push({
    tipo: 'rentabilidad',
    mensaje: `💰 Rentabilidad esperada: ${prediccion.rentabilidadEsperada}% (basado en ${similares.length} proyectos similares)`,
    valor: prediccion.rentabilidadEsperada,
    confianza: similares.length > 0 ? Math.min(95, similares.length * 15) : 40,
  });

  // Sugerencia de factores
  if (similares.length > 0) {
    sugerencias.push({
      tipo: 'factor',
      mensaje: `🎯 Factores recomendados: Indirectos ${prediccion.factoresRecomendados.factor_indirectos}%, Admin ${prediccion.factoresRecomendados.factor_administrativos}%, Imprevistos ${prediccion.factoresRecomendados.factor_imprevistos}%, Utilidad ${prediccion.factoresRecomendados.factor_utilidad}%`,
      valor: prediccion.factoresRecomendados,
      confianza: prediccion.confianza,
    });
  }

  // Sugerencia de alerta si confianza es baja
  if (similares.length < 2) {
    sugerencias.push({
      tipo: 'rentabilidad',
      mensaje: '⚠️ Pocos datos históricos - Verificar presupuesto manualmente',
      confianza: 0,
    });
  }

  return sugerencias;
}
