import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import type { Presupuesto, Transaccion, Cliente } from '@/types/supabase';

export function exportPresupuestos(presupuestos: Presupuesto[], filename = 'presupuestos.xlsx') {
  const data = presupuestos.map(p => ({
    Proyecto: p.proyecto,
    Cliente: p.cliente,
    Ubicacion: p.ubicacion || '',
    Tipologia: p.tipologia || '',
    Fase: p.fase,
    Costo_Directo: p.costo_directo || 0,
    Total: p.total,
    Avance_Fisico: `${p.avanceFisico}%`,
    Avance_Financiero: `${p.avanceFinanciero}%`,
    Ingresos: p.ingresos,
    Gastos: p.gastos,
    Pendiente_Aportar: p.pendienteAportar,
    Utilidad: p.total > 0 ? (((p.ingresos || 0) - (p.gastos || 0)) / p.total * 100).toFixed(1) + '%' : '0%',
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Presupuestos');
  XLSX.writeFile(wb, filename);
  toast.success(`Exportado: ${filename}`);
}

export function exportTransacciones(transacciones: Transaccion[], presupuestos: Presupuesto[], filename = 'transacciones.xlsx') {
  const mapProyecto = Object.fromEntries(presupuestos.map(p => [p.id, p.proyecto]));
  const data = transacciones.map(t => ({
    Proyecto: mapProyecto[t.proyectoId] || t.proyectoId,
    Tipo: t.tipo,
    Fecha: t.fecha,
    Descripcion: t.descripcion || '',
    Categoria: t.categoria,
    Cantidad: t.cantidad,
    Unidad: t.unidad || '',
    Costo_Unitario: t.costoUnitario,
    Costo_Total: t.costoTotal,
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
  XLSX.writeFile(wb, filename);
  toast.success(`Exportado: ${filename}`);
}

export function exportCompleto(presupuestos: Presupuesto[], transacciones: Transaccion[], clientes: Cliente[], filename = 'exportacion_completa.xlsx') {
  const wb = XLSX.utils.book_new();

  const presData = presupuestos.map(p => ({
    Proyecto: p.proyecto,
    Cliente: p.cliente,
    Ubicacion: p.ubicacion || '',
    Tipologia: p.tipologia || '',
    Fase: p.fase,
    Costo_Directo: p.costo_directo || 0,
    Total: p.total,
    Avance_Fisico: `${p.avanceFisico}%`,
    Ingresos: p.ingresos,
    Gastos: p.gastos,
    Pendiente: p.pendienteAportar,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(presData), 'Presupuestos');

  const mapProyecto = Object.fromEntries(presupuestos.map(p => [p.id, p.proyecto]));
  const txData = transacciones.map(t => ({
    Proyecto: mapProyecto[t.proyectoId] || t.proyectoId,
    Tipo: t.tipo,
    Fecha: t.fecha,
    Descripcion: t.descripcion || '',
    Categoria: t.categoria,
    Cantidad: t.cantidad,
    Unidad: t.unidad || '',
    Costo_Unitario: t.costoUnitario,
    Monto: t.costoTotal,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txData), 'Transacciones');

  const cliData = clientes.map(c => ({
    Nombre: c.nombre,
    Telefono: c.telefono || '',
    Email: c.email || '',
    Direccion: c.direccion || '',
    Tipo_Proyecto: c.tipoProyecto || '',
    Estado: c.estado || '',
    Notas: c.notas || '',
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cliData), 'Clientes');

  XLSX.writeFile(wb, filename);
  toast.success(`Exportación completa: ${filename}`);
}
