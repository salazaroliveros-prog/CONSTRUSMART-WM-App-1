import * as XLSX from 'xlsx';
import { exportCompleto } from './exportExcel';
import type { Presupuesto, Transaccion } from '@/types/supabase';
import { toast } from 'sonner';

export function reporteCierreFase(presupuesto: Presupuesto, transacciones: Transaccion[]) {
  const txns = transacciones.filter(t => t.proyectoId === presupuesto.id);
  const ingresos = txns.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0);
  const gastos = txns.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0);
  const margen = ingresos - gastos;
  const rentabilidad = presupuesto.total > 0 ? (margen / presupuesto.total) * 100 : 0;

  const wb = XLSX.utils.book_new();

  const resumen = [[`CIERRE DE PROYECTO: ${presupuesto.proyecto}`],
    [`Cliente: ${presupuesto.cliente}`, `Fecha: ${new Date().toLocaleDateString('es-GT')}`],
    [],
    ['Concepto', 'Valor (Q)'],
    ['Presupuesto Original', presupuesto.total],
    ['Total Ingresos', ingresos],
    ['Total Gastos', gastos],
    ['Margen', margen],
    ['Rentabilidad', `${rentabilidad.toFixed(1)}%`],
    ['Avance Físico', `${presupuesto.avanceFisico}%`],
    ['Avance Financiero', `${presupuesto.avanceFinanciero}%`],
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Cierre');

  const detalle: (string | number)[][] = [['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Monto']];
  txns.forEach(t => detalle.push([t.fecha, t.tipo, t.descripcion || '', t.categoria, t.costoTotal]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detalle), 'Transacciones');

  XLSX.writeFile(wb, `cierre_${presupuesto.proyecto.replace(/\s+/g, '_')}.xlsx`);
  toast.success(`Reporte de cierre generado: ${presupuesto.proyecto}`);
}

export function reporteSemanal(presupuestos: Presupuesto[], transacciones: Transaccion[]) {
  const ahora = new Date();
  const semana = transacciones.filter(t => {
    const d = new Date(t.fecha);
    return Math.abs(ahora.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  });

  const wb = XLSX.utils.book_new();

  const data = [['REPORTE SEMANAL', ahora.toLocaleDateString('es-GT')], [],
    ['Proyectos Activos', presupuestos.filter(p => p.fase === 'ejecución').length],
    ['Proyectos en Planeación', presupuestos.filter(p => p.fase === 'planeación').length],
    ['Proyectos Finalizados', presupuestos.filter(p => p.fase === 'finalizado').length],
    ['Transacciones esta semana', semana.length],
    ['Total Ingresos Semana', semana.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + t.costoTotal, 0)],
    ['Total Gastos Semana', semana.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.costoTotal, 0)],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Semanal');

  XLSX.writeFile(wb, `reporte_semanal_${ahora.toISOString().slice(0, 10)}.xlsx`);
  toast.success('Reporte semanal generado');
  return true;
}

export function reporteBatch(presupuestos: Presupuesto[], ids: string[], transacciones: Transaccion[]) {
  const seleccionados = presupuestos.filter(p => ids.includes(p.id));
  if (seleccionados.length === 0) {
    toast.error('Selecciona al menos un proyecto');
    return;
  }
  exportCompleto(seleccionados, transacciones, []);
  toast.success(`Exportación batch: ${seleccionados.length} proyectos`);
}
