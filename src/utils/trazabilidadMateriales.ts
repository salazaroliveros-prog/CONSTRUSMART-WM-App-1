/**
 * M9: Trazabilidad de Materiales - Seguimiento físico y financiero
 */

export interface MaterialesRenglon {
  id: string;
  renglon_codigo: string;
  presupuesto_id: string;
  
  // Presupuestado
  cantidad_presupuestada: number;
  unidad: string;
  costo_unitario_presupuestado: number;
  costo_total_presupuestado: number;
  
  // Comprado
  cantidad_comprada: number;
  costo_unitario_real: number;
  costo_total_comprado: number;
  proveedor?: string;
  fecha_compra?: Date;
  
  // Consumido en obra
  cantidad_consumida: number;
  costo_unitario_consumo: number;
  costo_total_consumida: number;
  fecha_consumo?: Date;
  
  // Métricas
  desperdicio_porcentaje: number;
  variacion_costo_porcentaje: number;
  estado: 'planeado' | 'comprado' | 'en_obra' | 'completo';
}

export interface ResumenTrazabilidad {
  total_presupuestado: number;
  total_comprado: number;
  total_consumido: number;
  diferencia_costo: number;
  porcentaje_desperdicio: number;
  porcentaje_variacion_costo: number;
  materiales: MaterialesRenglon[];
  alertas: string[];
}

/**
 * Inicializar trazabilidad de material para un renglón
 */
export function inicializarMaterialRenglon(
  renglon_codigo: string,
  presupuesto_id: string,
  cantidad_presupuestada: number,
  unidad: string,
  costo_unitario: number
): MaterialesRenglon {
  return {
    id: crypto.randomUUID(),
    renglon_codigo,
    presupuesto_id,
    cantidad_presupuestada,
    unidad,
    costo_unitario_presupuestado: costo_unitario,
    costo_total_presupuestado: cantidad_presupuestada * costo_unitario,
    cantidad_comprada: 0,
    costo_unitario_real: 0,
    costo_total_comprado: 0,
    cantidad_consumida: 0,
    costo_unitario_consumo: 0,
    costo_total_consumida: 0,
    desperdicio_porcentaje: 0,
    variacion_costo_porcentaje: 0,
    estado: 'planeado',
  };
}

/**
 * Registrar compra de material
 */
export function registrarCompra(
  material: MaterialesRenglon,
  cantidad_comprada: number,
  costo_unitario_real: number,
  proveedor?: string
): MaterialesRenglon {
  const costo_total = cantidad_comprada * costo_unitario_real;
  const variacion = ((costo_unitario_real - material.costo_unitario_presupuestado) / material.costo_unitario_presupuestado) * 100;

  return {
    ...material,
    cantidad_comprada,
    costo_unitario_real,
    costo_total_comprado: costo_total,
    proveedor,
    fecha_compra: new Date(),
    variacion_costo_porcentaje: variacion,
    estado: 'comprado',
  };
}

/**
 * Registrar consumo en obra
 */
export function registrarConsumo(
  material: MaterialesRenglon,
  cantidad_consumida: number
): MaterialesRenglon {
  const costo_consumo = cantidad_consumida * material.costo_unitario_real;
  const desperdicio = material.cantidad_comprada - cantidad_consumida;
  const porcentajeDesperdicio = material.cantidad_comprada > 0 
    ? (desperdicio / material.cantidad_comprada) * 100 
    : 0;

  return {
    ...material,
    cantidad_consumida,
    costo_unitario_consumo: material.costo_unitario_real,
    costo_total_consumida: costo_consumo,
    fecha_consumo: new Date(),
    desperdicio_porcentaje: porcentajeDesperdicio,
    estado: cantidad_consumida >= material.cantidad_presupuestada ? 'completo' : 'en_obra',
  };
}

/**
 * Detectar anomalías en consumo
 */
export function detectarAnomalias(material: MaterialesRenglon): string[] {
  const anomalias: string[] = [];

  if (material.desperdicio_porcentaje > 10) {
    anomalias.push(`🚨 Desperdicio ALTO: ${material.desperdicio_porcentaje.toFixed(1)}% (>${10}%)`);
  }

  if (material.variacion_costo_porcentaje > 15) {
    anomalias.push(`⚠️ Costo MAYOR al presupuestado: +${material.variacion_costo_porcentaje.toFixed(1)}%`);
  }

  if (material.variacion_costo_porcentaje < -20) {
    anomalias.push(`✅ Costo MENOR al presupuestado: ${material.variacion_costo_porcentaje.toFixed(1)}%`);
  }

  if (material.cantidad_comprada < material.cantidad_presupuestada) {
    anomalias.push(`⚠️ Comprado menos que presupuestado (${material.cantidad_comprada} vs ${material.cantidad_presupuestada})`);
  }

  if (material.cantidad_comprada > material.cantidad_presupuestada * 1.2) {
    anomalias.push(`⚠️ Comprado significativamente más (+${((material.cantidad_comprada / material.cantidad_presupuestada - 1) * 100).toFixed(0)}%)`);
  }

  if (material.cantidad_consumida > material.cantidad_comprada) {
    anomalias.push(`🚨 ERROR: Consumo MAYOR que lo comprado`);
  }

  return anomalias;
}

/**
 * Generar resumen de trazabilidad
 */
export function generarResumenTrazabilidad(materiales: MaterialesRenglon[]): ResumenTrazabilidad {
  const totalPresupuestado = materiales.reduce((sum, m) => sum + m.costo_total_presupuestado, 0);
  const totalComprado = materiales.reduce((sum, m) => sum + m.costo_total_comprado, 0);
  const totalConsumido = materiales.reduce((sum, m) => sum + m.costo_total_consumida, 0);
  
  const diferenciaCosto = totalComprado - totalPresupuestado;
  const porcentajeVariacion = totalPresupuestado > 0 ? (diferenciaCosto / totalPresupuestado) * 100 : 0;
  
  const totalDesperdicio = materiales.reduce((sum, m) => sum + (m.cantidad_comprada - m.cantidad_consumida), 0);
  const totalCompradoUnidades = materiales.reduce((sum, m) => sum + m.cantidad_comprada, 0);
  const porcentajeDesperdicio = totalCompradoUnidades > 0 ? (totalDesperdicio / totalCompradoUnidades) * 100 : 0;

  const alertas: string[] = [];
  
  materiales.forEach(m => {
    detectarAnomalias(m).forEach(a => alertas.push(`${m.renglon_codigo}: ${a}`));
  });

  if (porcentajeDesperdicio > 10) {
    alertas.unshift(`🚨 DESPERDICIO TOTAL: ${porcentajeDesperdicio.toFixed(1)}% (>${10}%)`);
  }

  return {
    total_presupuestado: totalPresupuestado,
    total_comprado: totalComprado,
    total_consumido: totalConsumido,
    diferencia_costo: diferenciaCosto,
    porcentaje_variacion: porcentajeVariacion,
    porcentaje_desperdicio: porcentajeDesperdicio,
    materiales,
    alertas,
  };
}

/**
 * Proyectar consumo faltante
 */
export function proyectarConsumoFaltante(
  material: MaterialesRenglon,
  porcentajeAvanceObra: number
): { consumo_esperado: number; consumo_actual: number; diferencia: number } {
  const consumoEsperado = (material.cantidad_comprada * porcentajeAvanceObra) / 100;
  const consumoActual = material.cantidad_consumida;
  const diferencia = consumoEsperado - consumoActual;

  return { consumo_esperado, consumo_actual, diferencia };
}
