/**
 * useCalculos Hook
 * Hook especializado para cálculos de presupuesto
 * Proporciona utilidades reactivas para cálculos
 */

import { useMemo, useCallback } from 'react';
import {
  calcularCostoUnitario,
  calcularSubtotalLinea,
  calcularEstimacionDias,
  calcularTotalesPresupuesto,
  analizarSensibilidad,
  compararPresupuestos,
  detectarAnomalias,
  type FactoresCalculo,
  type LineaCalculada,
  type ResultadoCalculo,
} from '@/services/CalculoService';

export interface LineaParaCalculo {
  id: string;
  costoMaterial: number;
  costoManoObra: number;
  costoHerramienta: number;
  cantidad: number;
  rendimiento: number;
}

/**
 * Hook para manejar cálculos de presupuesto
 */
export function useCalculos(lineas: LineaParaCalculo[], factores: FactoresCalculo) {
  // Convertir líneas al formato de cálculo
  const lineasCalculadas = useMemo(() => {
    return lineas.map((linea) => ({
      id: linea.id,
      costoUnitario: calcularCostoUnitario(
        linea.costoMaterial,
        linea.costoManoObra,
        linea.costoHerramienta
      ),
      cantidad: linea.cantidad,
      subtotal: calcularSubtotalLinea(
        calcularCostoUnitario(linea.costoMaterial, linea.costoManoObra, linea.costoHerramienta),
        linea.cantidad
      ),
      estimacionDias: calcularEstimacionDias(linea.cantidad, linea.rendimiento),
    }));
  }, [lineas]);

  // Calcular totales
  const totales = useMemo(
    () => calcularTotalesPresupuesto(lineasCalculadas, factores),
    [lineasCalculadas, factores]
  );

  // Detectar anomalías
  const alertas = useMemo(() => detectarAnomalias(totales), [totales]);

  // Métodos útiles
  const analizarCambioFactor = useCallback(
    (factor: keyof FactoresCalculo, valor: number) => {
      return analizarSensibilidad(lineasCalculadas, factores, factor, valor);
    },
    [lineasCalculadas, factores]
  );

  const compararConOtro = useCallback(
    (otroResultado: ResultadoCalculo) => {
      return compararPresupuestos(totales, otroResultado);
    },
    [totales]
  );

  return {
    lineasCalculadas,
    totales,
    alertas,
    analizarCambioFactor,
    compararConOtro,
  };
}

/**
 * Hook para cálculos de una sola línea
 */
export function useCalculoLinea(costos: {
  material: number;
  manoObra: number;
  herramienta: number;
  cantidad: number;
  rendimiento: number;
}) {
  const costoUnitario = useMemo(
    () => calcularCostoUnitario(costos.material, costos.manoObra, costos.herramienta),
    [costos.material, costos.manoObra, costos.herramienta]
  );

  const subtotal = useMemo(
    () => calcularSubtotalLinea(costoUnitario, costos.cantidad),
    [costoUnitario, costos.cantidad]
  );

  const estimacionDias = useMemo(
    () => calcularEstimacionDias(costos.cantidad, costos.rendimiento),
    [costos.cantidad, costos.rendimiento]
  );

  return { costoUnitario, subtotal, estimacionDias };
}

/**
 * Hook para análisis de sensibilidad
 */
export function useSensibilidad(resultado: ResultadoCalculo, lineas: LineaCalculada[]) {
  const analizar = useCallback(
    (factor: 'indirectos' | 'administrativos' | 'imprevistos' | 'utilidad', valor: number) => {
      const factores: FactoresCalculo = {
        indirectos: 0,
        administrativos: 0,
        imprevistos: 0,
        utilidad: 0,
      };

      // Simular cambio
      const nuevoResultado = analizarSensibilidad(lineas, factores, factor, valor);
      const diferencia = nuevoResultado.total - resultado.total;

      return {
        nuevoTotal: nuevoResultado.total,
        diferencia,
        porcentajeCambio: (diferencia / resultado.total) * 100,
      };
    },
    [resultado, lineas]
  );

  return { analizar };
}

/**
 * Hook para comparación de presupuestos
 */
export function useComparacion(presupuesto1: ResultadoCalculo) {
  const comparar = useCallback(
    (presupuesto2: ResultadoCalculo) => {
      return compararPresupuestos(presupuesto1, presupuesto2);
    },
    [presupuesto1]
  );

  return { comparar };
}
