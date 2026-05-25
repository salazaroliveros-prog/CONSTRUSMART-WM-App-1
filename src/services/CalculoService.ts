/**
 * CalculoService.ts - Motor de Cálculos APU Avanzado v2
 * 
 * Responsabilidades:
 * - Cálculos de costos unitarios (material + mano de obra + herramienta)
 * - Cálculos de subtotales por línea
 * - Cálculos totales con factores (indirectos, admin, imprevistos, utilidad)
 * - Análisis de sensibilidad (escenarios pesimista/realista/optimista)
 * - Proyecciones y validaciones
 * - Comparación histórica
 * - Exportación de datos
 */

export interface FactoresCalculo {
  indirectos: number;      // %
  administrativos: number; // %
  imprevistos: number;     // %
  utilidad: number;        // %
}

export interface LineaCalculada {
  id: string;
  codigo?: string;
  descripcion?: string;
  unidad?: string;
  rendimiento?: number;
  costoMaterial?: number;
  costoManoObra?: number;
  costoHerramienta?: number;
  costoUnitario: number;
  cantidad: number;
  subtotal: number;
  estimacionDias: number;
}

export interface ResultadoCalculo {
  costoDirecto: number;
  costosIndirectos: number;
  costosAdministrativos: number;
  costosImprevistos: number;
  subtotal: number;
  utilidad: number;
  total: number;
  estimacionDiasTotal: number;
  precioPorDia: number;
  margenUtilidad: number;
  margenRelativo: number;
}

export interface AnalisisSensibilidad {
  escenario: 'pesimista' | 'realista' | 'optimista';
  total: number;
  variacionPorcentaje: number;
  variacionMoneda: number;
  descripcion: string;
}

export interface ComparativaHistorica {
  proyecto: string;
  costoHistorico: number;
  presupuestoActual: number;
  variacion: number;
  variacionPorcentaje: number;
  tendencia: 'aumento' | 'disminucion' | 'estable';
}

/**
 * Calcula el costo unitario de un renglón
 * costoUnitario = Material + ManoObra + Herramienta
 */
export function calcularCostoUnitario(
  costoMaterial: number,
  costoManoObra: number,
  costoHerramienta: number
): number {
  const costo = (costoMaterial || 0) + (costoManoObra || 0) + (costoHerramienta || 0);
  return Math.max(0, costo);
}

/**
 * Calcula el subtotal de una línea
 * subtotal = costoUnitario × cantidad
 */
export function calcularSubtotalLinea(costoUnitario: number, cantidad: number): number {
  return Math.max(0, (costoUnitario || 0) * (cantidad || 0));
}

/**
 * Calcula la estimación en días para una línea
 * días = cantidad / rendimiento
 */
export function calcularEstimacionDias(cantidad: number, rendimiento: number): number {
  if (!rendimiento || rendimiento <= 0) return 0;
  const dias = (cantidad || 0) / rendimiento;
  return Math.ceil(dias);
}

/**
 * Calcula el costo total de materiales unitarios
 */
export function calcularCostoMateriales(
  materiales: Array<{ cantidad: number; costoUnitario: number }>
): number {
  return materiales.reduce((total, m) => total + ((m.cantidad || 0) * (m.costoUnitario || 0)), 0);
}

/**
 * Calcula todos los totales del presupuesto
 */
export function calcularTotalesPresupuesto(
  lineas: LineaCalculada[],
  factores: FactoresCalculo
): ResultadoCalculo {
  // 1. Costo Directo = Sum(subtotales)
  const costoDirecto = lineas.reduce((total, linea) => total + (linea.subtotal || 0), 0);

  // 2. Aplicar factores
  const costosIndirectos = (costoDirecto * (factores.indirectos || 0)) / 100;
  const costosAdministrativos = (costoDirecto * (factores.administrativos || 0)) / 100;
  const costosImprevistos = (costoDirecto * (factores.imprevistos || 0)) / 100;

  // 3. Subtotal
  const subtotal = costoDirecto + costosIndirectos + costosAdministrativos + costosImprevistos;

  // 4. Utilidad
  const utilidad = (subtotal * (factores.utilidad || 0)) / 100;

  // 5. Total
  const total = subtotal + utilidad;

  // 6. Estimación en días
  const estimacionDiasTotal = lineas.reduce((total, linea) => total + (linea.estimacionDias || 0), 0);

  // 7. Precio por día
  const precioPorDia = estimacionDiasTotal > 0 ? total / estimacionDiasTotal : 0;

  // 8. Margen de utilidad
  const margenUtilidad = total > 0 ? ((utilidad / total) * 100) : 0;

  return {
    costoDirecto: Math.round(costoDirecto * 100) / 100,
    costosIndirectos: Math.round(costosIndirectos * 100) / 100,
    costosAdministrativos: Math.round(costosAdministrativos * 100) / 100,
    costosImprevistos: Math.round(costosImprevistos * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    utilidad: Math.round(utilidad * 100) / 100,
    total: Math.round(total * 100) / 100,
    estimacionDiasTotal,
    precioPorDia: Math.round(precioPorDia * 100) / 100,
    margenUtilidad: Math.round(margenUtilidad * 100) / 100,
  };
}

/**
 * Análisis de sensibilidad: ¿Qué pasa si cambio un factor?
 */
export function analizarSensibilidad(
  lineas: LineaCalculada[],
  factores: FactoresCalculo,
  factorAModificar: keyof FactoresCalculo,
  valorNuevo: number
): ResultadoCalculo {
  const factoresModificados = {
    ...factores,
    [factorAModificar]: valorNuevo,
  };
  return calcularTotalesPresupuesto(lineas, factoresModificados);
}

/**
 * Compara dos presupuestos
 */
export function compararPresupuestos(
  resultado1: ResultadoCalculo,
  resultado2: ResultadoCalculo
): {
  diferenciaTotal: number;
  porcentajeDiferencia: number;
  esPresupuesto2MasCaro: boolean;
} {
  const diferencia = resultado2.total - resultado1.total;
  const porcentaje = (diferencia / resultado1.total) * 100;

  return {
    diferenciaTotal: Math.round(diferencia * 100) / 100,
    porcentajeDiferencia: Math.round(porcentaje * 100) / 100,
    esPresupuesto2MasCaro: diferencia > 0,
  };
}

/**
 * Detecta anomalías en el presupuesto
 */
export function detectarAnomalias(resultado: ResultadoCalculo): string[] {
  const alertas: string[] = [];

  if (resultado.margenUtilidad < 10) {
    alertas.push('⚠️ Margen de utilidad muy bajo (< 10%)');
  }

  if (resultado.margenUtilidad > 50) {
    alertas.push('⚠️ Margen de utilidad muy alto (> 50%)');
  }

  if (resultado.precioPorDia > 1000000) {
    alertas.push('⚠️ Precio por día muy alto');
  }

  if (resultado.costoDirecto === 0) {
    alertas.push('⚠️ Costo directo es cero');
  }

  return alertas;
}

/**
 * Formatea número como moneda
 */
export function formatoMoneda(valor: number, moneda: string = '$'): string {
  return `${moneda} ${valor.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Formatea porcentaje
 */
export function formatoPorcentaje(valor: number, decimales: number = 2): string {
  return `${valor.toFixed(decimales)}%`;
}

/**
 * Análisis de sensibilidad completo: 3 escenarios automáticos
 * - Pesimista: +25% indirectos, -5% utilidad
 * - Realista: factores normales
 * - Optimista: -15% indirectos, +10% utilidad
 */
export function analizarSensibilidadCompleta(
  lineas: LineaCalculada[],
  factores: FactoresCalculo
): {
  realista: ResultadoCalculo;
  pesimista: AnalisisSensibilidad;
  optimista: AnalisisSensibilidad;
} {
  const realista = calcularTotalesPresupuesto(lineas, factores);

  // Escenario Pesimista
  const factoresPesimista: FactoresCalculo = {
    indirectos: factores.indirectos * 1.25,
    administrativos: factores.administrativos * 1.1,
    imprevistos: factores.imprevistos * 1.25,
    utilidad: Math.max(5, factores.utilidad * 0.95),
  };
  const resultadoPesimista = calcularTotalesPresupuesto(lineas, factoresPesimista);
  const variacionPesimista = resultadoPesimista.total - realista.total;
  const variacionPorcentajePesimista = (variacionPesimista / realista.total) * 100;

  // Escenario Optimista
  const factoresOptimista: FactoresCalculo = {
    indirectos: Math.max(0, factores.indirectos * 0.85),
    administrativos: Math.max(0, factores.administrativos * 0.9),
    imprevistos: Math.max(0, factores.imprevistos * 0.85),
    utilidad: factores.utilidad * 1.1,
  };
  const resultadoOptimista = calcularTotalesPresupuesto(lineas, factoresOptimista);
  const variacionOptimista = resultadoOptimista.total - realista.total;
  const variacionPorcentajeOptimista = (variacionOptimista / realista.total) * 100;

  return {
    realista,
    pesimista: {
      escenario: 'pesimista',
      total: resultadoPesimista.total,
      variacionPorcentaje: Math.round(variacionPorcentajePesimista * 100) / 100,
      variacionMoneda: Math.round(variacionPesimista * 100) / 100,
      descripcion: `Si costos aumentan 25%: ${formatoMoneda(resultadoPesimista.total)}`,
    },
    optimista: {
      escenario: 'optimista',
      total: resultadoOptimista.total,
      variacionPorcentaje: Math.round(variacionPorcentajeOptimista * 100) / 100,
      variacionMoneda: Math.round(variacionOptimista * 100) / 100,
      descripcion: `Si optimizas costos 15%: ${formatoMoneda(resultadoOptimista.total)}`,
    },
  };
}

/**
 * Calcula proyección de escalabilidad
 * ¿Cuánto costaría si duplico, triplico el proyecto?
 */
export function calcularProyeccionEscalabilidad(
  resultado: ResultadoCalculo,
  factoresEscala: number[] = [1, 1.5, 2, 2.5, 3]
): Array<{ escala: number; totalProyectado: number; monto: number }> {
  return factoresEscala.map((escala) => ({
    escala,
    totalProyectado: Math.round(resultado.total * escala * 100) / 100,
    monto: Math.round(resultado.total * (escala - 1) * 100) / 100,
  }));
}

/**
 * Calcula el punto de equilibrio
 * ¿A partir de qué unidades se empieza a ganar?
 */
export function calcularPuntoEquilibrio(
  costoFijo: number,
  costoVariableUnitario: number,
  precioVenta: number
): {
  unidadesEquilibrio: number;
  costoTotal: number;
  ingreso: number;
} {
  if (precioVenta <= costoVariableUnitario) {
    return {
      unidadesEquilibrio: Infinity,
      costoTotal: 0,
      ingreso: 0,
    };
  }

  const margenContribución = precioVenta - costoVariableUnitario;
  const unidades = Math.ceil(costoFijo / margenContribución);

  return {
    unidadesEquilibrio: unidades,
    costoTotal: costoFijo + unidades * costoVariableUnitario,
    ingreso: unidades * precioVenta,
  };
}

/**
 * Valida coherencia del presupuesto
 */
export function validarCoherencia(
  resultado: ResultadoCalculo
): {
  valido: boolean;
  errores: string[];
  advertencias: string[];
} {
  const errores: string[] = [];
  const advertencias: string[] = [];

  if (resultado.total <= 0) {
    errores.push('Total debe ser mayor a 0');
  }

  if (resultado.costoDirecto === 0) {
    errores.push('Costo directo no puede ser 0');
  }

  if (resultado.margenUtilidad > 100) {
    advertencias.push('Margen de utilidad extremadamente alto');
  }

  if (resultado.precioPorDia <= 0 && resultado.estimacionDiasTotal > 0) {
    errores.push('Precio por día debe ser positivo');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Exporta resumen en formato amigable para reportes
 */
export function exportarResumen(resultado: ResultadoCalculo): Record<string, string> {
  return {
    'Costo Directo': formatoMoneda(resultado.costoDirecto),
    'Costos Indirectos': formatoMoneda(resultado.costosIndirectos),
    'Costos Administrativos': formatoMoneda(resultado.costosAdministrativos),
    'Costos Imprevistos': formatoMoneda(resultado.costosImprevistos),
    'Subtotal': formatoMoneda(resultado.subtotal),
    'Utilidad': formatoMoneda(resultado.utilidad),
    'Margen de Utilidad': formatoPorcentaje(resultado.margenUtilidad),
    'TOTAL': formatoMoneda(resultado.total),
    'Estimación en Días': resultado.estimacionDiasTotal.toString(),
    'Precio por Día': formatoMoneda(resultado.precioPorDia),
  };
}

/**
 * Clase CalculoService - API moderna
 * Permite encadenar operaciones: new CalculoService(lineas).calcular().conFactores(...)
 */
export class CalculoService {
  private lineas: LineaCalculada[];
  private factores: FactoresCalculo;
  private resultado?: ResultadoCalculo;

  constructor(lineas: LineaCalculada[] = [], factoresInicial?: FactoresCalculo) {
    this.lineas = lineas;
    this.factores = factoresInicial || {
      indirectos: 10,
      administrativos: 8,
      imprevistos: 5,
      utilidad: 20,
    };
  }

  /**
   * Calcula el presupuesto actual
   */
  calcular(): this {
    this.resultado = calcularTotalesPresupuesto(this.lineas, this.factores);
    return this;
  }

  /**
   * Cambia los factores
   */
  conFactores(factores: Partial<FactoresCalculo>): this {
    this.factores = { ...this.factores, ...factores };
    this.resultado = undefined;
    return this;
  }

  /**
   * Agrega una línea
   */
  agregarLinea(linea: LineaCalculada): this {
    this.lineas.push(linea);
    this.resultado = undefined;
    return this;
  }

  /**
   * Agrega múltiples líneas
   */
  agregarLineas(lineas: LineaCalculada[]): this {
    this.lineas.push(...lineas);
    this.resultado = undefined;
    return this;
  }

  /**
   * Obtiene el resultado actual
   */
  obtenerResultado(): ResultadoCalculo {
    if (!this.resultado) {
      this.calcular();
    }
    return this.resultado!;
  }

  /**
   * Obtiene análisis de sensibilidad
   */
  obtenerSensibilidad() {
    return analizarSensibilidadCompleta(this.lineas, this.factores);
  }

  /**
   * Obtiene proyección de escalabilidad
   */
  obtenerProyeccion(factores?: number[]) {
    const resultado = this.obtenerResultado();
    return calcularProyeccionEscalabilidad(resultado, factores);
  }

  /**
   * Obtiene validación
   */
  obtenerValidacion() {
    const resultado = this.obtenerResultado();
    return validarCoherencia(resultado);
  }

  /**
   * Obtiene anomalías
   */
  obtenerAnomalias(): string[] {
    const resultado = this.obtenerResultado();
    return detectarAnomalias(resultado);
  }

  /**
   * Exporta resumen
   */
  exportar() {
    const resultado = this.obtenerResultado();
    return exportarResumen(resultado);
  }

  /**
   * Obtiene todas las líneas
   */
  obtenerLineas(): LineaCalculada[] {
    return [...this.lineas];
  }

  /**
   * Obtiene estadísticas
   */
  obtenerEstadisticas() {
    const resultado = this.obtenerResultado();
    return {
      lineas: this.lineas.length,
      costoPromedioPorLinea: resultado.costoDirecto / (this.lineas.length || 1),
      costoMinimoLinea: Math.min(...this.lineas.map((l) => l.subtotal || 0)),
      costoMaximoLinea: Math.max(...this.lineas.map((l) => l.subtotal || 0)),
      diasPromedio: resultado.estimacionDiasTotal / (this.lineas.length || 1),
      costoPromedioPorDia: resultado.precioPorDia,
    };
  }
}

export default CalculoService;
