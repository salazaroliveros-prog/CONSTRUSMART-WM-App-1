/**
 * M6: Change Orders - Sistema de órdenes de cambio y versionado
 */

import type { Presupuesto } from '@/types/supabase';

export interface CambioDetalle {
  renglon_id: string;
  renglon_codigo?: string;
  cantidad_anterior: number;
  cantidad_nueva: number;
  unitario_anterior: number;
  unitario_nuevo: number;
  motivo: string;
  impacto: number; // diferencia en Q
}

export interface ChangeOrder {
  id: string;
  presupuesto_id: string;
  version: number;
  cambios: CambioDetalle[];
  descripcion: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  solicitado_por: string;
  solicitado_fecha: Date;
  aprobado_por?: string;
  aprobado_fecha?: Date;
  comentarios?: string;
}

export interface ResumenVersiones {
  version_original: number;
  version_actual: number;
  cambios_acumulados: number;
  impacto_total: number;
  porcentaje_cambio: number;
  historico: ChangeOrder[];
}

/**
 * Crear nueva versión con cambios
 */
export function crearChangeOrder(
  presupuesto_id: string,
  presupuesto_actual: Presupuesto,
  lineasNuevas: Array<{ id: string; codigo?: string; cantidad: number; unitario: number }>,
  motivo: string,
  versiones_anteriores: ChangeOrder[]
): ChangeOrder {
  const cambios: CambioDetalle[] = [];
  const version = versiones_anteriores.length + 1;

  // Comparar líneas
  const lineasAnteriores = (presupuesto_actual.lineas || []) as Record<string, unknown>[];

  
  lineasNuevas.forEach((nueva) => {
    
    const anterior = lineasAnteriores.find((l) => l.id === nueva.id);
    
    if (anterior) {
      
      const costoAnt = (anterior.costoUnitario as number) || 0;
      const costaNvo = nueva.unitario;
       
      const cantAnt = (anterior.cantidad as number) || 0;
      const cantNva = nueva.cantidad;

      if (cantAnt !== cantNva || costoAnt !== costaNvo) {
        cambios.push({
          renglon_id: nueva.id,
          renglon_codigo: nueva.codigo,
          cantidad_anterior: cantAnt,
          cantidad_nueva: cantNva,
          unitario_anterior: costoAnt,
          unitario_nuevo: costaNvo,
          motivo,
          impacto: (costaNvo * cantNva) - (costoAnt * cantAnt),
        });
      }
    } else {
      // Línea nueva
      cambios.push({
        renglon_id: nueva.id,
        renglon_codigo: nueva.codigo,
        cantidad_anterior: 0,
        cantidad_nueva: nueva.cantidad,
        unitario_anterior: 0,
        unitario_nuevo: nueva.unitario,
        motivo: 'Línea agregada',
        impacto: nueva.unitario * nueva.cantidad,
      });
    }
  });

  return {
    id: crypto.randomUUID(),
    presupuesto_id,
    version,
    cambios,
    descripcion: motivo,
    estado: 'pendiente',
    solicitado_por: 'usuario_actual',
    solicitado_fecha: new Date(),
  };
}

/**
 * Aprobar change order
 */
export function aprobarChangeOrder(
  changeOrder: ChangeOrder,
  aprobado_por: string,
  comentarios?: string
): ChangeOrder {
  return {
    ...changeOrder,
    estado: 'aprobada',
    aprobado_por,
    aprobado_fecha: new Date(),
    comentarios,
  };
}

/**
 * Rechazar change order
 */
export function rechazarChangeOrder(
  changeOrder: ChangeOrder,
  rechazado_por: string,
  motivo: string
): ChangeOrder {
  return {
    ...changeOrder,
    estado: 'rechazada',
    aprobado_por: rechazado_por,
    aprobado_fecha: new Date(),
    comentarios: `Rechazado: ${motivo}`,
  };
}

/**
 * Calcular impacto total de cambio
 */
export function calcularImpacto(cambios: CambioDetalle[]): number {
  return cambios.reduce((sum, c) => sum + c.impacto, 0);
}

/**
 * Validar si cambio requiere aprobación especial (>10% del presupuesto original)
 */
export function requiereAprobacionEspecial(
  impactoTotal: number,
  montoPresupuestoOriginal: number
): boolean {
  const porcentaje = Math.abs((impactoTotal / montoPresupuestoOriginal) * 100);
  return porcentaje > 10;
}

/**
 * Generar resumen de versiones
 */
export function generarResumenVersiones(
  presupuesto_original: Presupuesto,
  changeOrders: ChangeOrder[]
): ResumenVersiones {
  const aprobadas = changeOrders.filter(c => c.estado === 'aprobada');
  const impactoTotal = aprobadas.reduce((sum, co) => sum + calcularImpacto(co.cambios), 0);
  const porcentaje = presupuesto_original.total 
    ? Math.abs((impactoTotal / presupuesto_original.total) * 100)
    : 0;

  return {
    version_original: 1,
    version_actual: changeOrders.length + 1,
    cambios_acumulados: aprobadas.length,
    impacto_total: impactoTotal,
    porcentaje_cambio: porcentaje,
    historico: changeOrders,
  };
}

/**
 * Generar reporte de cambios para visualización
 */
export function generarReporteChangeOrders(
  presupuesto: Presupuesto,
  changeOrders: ChangeOrder[]
): string {
  let reporte = `HISTORIAL DE CAMBIOS - ${presupuesto.proyecto}\n`;
  reporte += `=${'='.repeat(80)}\n\n`;

  changeOrders.forEach((co) => {
    reporte += `VERSIÓN ${co.version} - ${co.estado.toUpperCase()}\n`;
    reporte += `Fecha: ${co.solicitado_fecha.toLocaleDateString('es-GT')}\n`;
    reporte += `Solicitado por: ${co.solicitado_por}\n`;
    
    if (co.aprobado_por) {
      reporte += `Aprobado por: ${co.aprobado_por} (${co.aprobado_fecha?.toLocaleDateString('es-GT')})\n`;
    }
    
    reporte += `\nCambios:\n`;
    co.cambios.forEach(c => {
      reporte += `  • ${c.renglon_codigo || c.renglon_id}: ${c.motivo}\n`;
      reporte += `    Cantidad: ${c.cantidad_anterior} → ${c.cantidad_nueva}\n`;
      reporte += `    Unitario: Q${c.unitario_anterior.toFixed(2)} → Q${c.unitario_nuevo.toFixed(2)}\n`;
      reporte += `    Impacto: Q${c.impacto.toFixed(2)}\n`;
    });

    const impactoTotal = calcularImpacto(co.cambios);
    reporte += `\nImpacto Total: Q${impactoTotal.toFixed(2)}\n`;
    reporte += `${'-'.repeat(80)}\n\n`;
  });

  return reporte;
}
