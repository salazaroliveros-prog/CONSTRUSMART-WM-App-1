/**
 * ExportService
 * Servicio para exportación de presupuestos en diferentes formatos
 */

import type { PresupuestoCompleto } from './PresupuestoService';
import { formatoMoneda, formatoPorcentaje } from './CalculoService';

/**
 * Genera CSV básico del presupuesto
 */
export function generarCSV(presupuesto: PresupuestoCompleto): string {
  let csv = 'PRESUPUESTO\n';
  csv += `Proyecto,${presupuesto.proyecto}\n`;
  csv += `Cliente,${presupuesto.cliente || 'N/A'}\n`;
  csv += `Ubicación,${presupuesto.ubicacion || 'N/A'}\n`;
  csv += `Tipología,${presupuesto.tipologia || 'N/A'}\n`;
  csv += `\n`;

  // Encabezado de líneas
  csv += 'Código,Descripción,Cantidad,Unidad,Costo Unitario,Subtotal\n';

  // Líneas
  presupuesto.lineas.forEach((linea) => {
    const costoUnit = linea.costoMaterial + linea.costoManoObra + linea.costoHerramienta;
    const subtotal = costoUnit * linea.cantidad;
    csv += `"${linea.codigo}","${linea.descripcion}",${linea.cantidad},"${linea.unidad}",${costoUnit},${subtotal}\n`;

    // Subrenglones si existen
    if (linea.subrenglones) {
      linea.subrenglones.forEach((sub) => {
        csv += `,"  - ${sub.descripcion}",${sub.cantidad},"${sub.unidad}",${sub.costoUnitario},${sub.cantidad * sub.costoUnitario}\n`;
      });
    }
  });

  csv += `\n`;
  csv += `TOTALES\n`;
  csv += `Costo Directo,${presupuesto.resultado.costoDirecto}\n`;
  csv += `Indirectos (${formatoPorcentaje(presupuesto.factores.indirectos)}),${presupuesto.resultado.costosIndirectos}\n`;
  csv += `Administrativos (${formatoPorcentaje(presupuesto.factores.administrativos)}),${presupuesto.resultado.costosAdministrativos}\n`;
  csv += `Imprevistos (${formatoPorcentaje(presupuesto.factores.imprevistos)}),${presupuesto.resultado.costosImprevistos}\n`;
  csv += `Subtotal,${presupuesto.resultado.subtotal}\n`;
  csv += `Utilidad (${formatoPorcentaje(presupuesto.factores.utilidad)}),${presupuesto.resultado.utilidad}\n`;
  csv += `TOTAL,${presupuesto.resultado.total}\n`;
  csv += `\n`;
  csv += `Estimación de Días,${presupuesto.resultado.estimacionDiasTotal}\n`;
  csv += `Precio por Día,${formatoMoneda(presupuesto.resultado.precioPorDia)}\n`;
  csv += `Margen de Utilidad,${formatoPorcentaje(presupuesto.resultado.margenUtilidad)}\n`;

  return csv;
}

/**
 * Genera CSV detallado con desglose de materiales
 */
export function generarCSVDetallado(presupuesto: PresupuestoCompleto): string {
  let csv = 'PRESUPUESTO DETALLADO CON MATERIALES\n';
  csv += `Proyecto,${presupuesto.proyecto}\n`;
  csv += `Cliente,${presupuesto.cliente || 'N/A'}\n`;
  csv += `Ubicación,${presupuesto.ubicacion || 'N/A'}\n`;
  csv += `Tipología,${presupuesto.tipologia || 'N/A'}\n`;
  csv += `\n`;

  presupuesto.lineas.forEach((linea, idx) => {
    csv += `RENGLÓN ${idx + 1}\n`;
    csv += `Código,${linea.codigo}\n`;
    csv += `Descripción,${linea.descripcion}\n`;
    csv += `Cantidad,${linea.cantidad}\n`;
    csv += `Unidad,${linea.unidad}\n`;
    csv += `Rendimiento,${linea.rendimiento}\n`;
    csv += `Costo Material,${linea.costoMaterial}\n`;
    csv += `Costo Mano de Obra,${linea.costoManoObra}\n`;
    csv += `Costo Herramienta,${linea.costoHerramienta}\n`;

    if (linea.materiales && linea.materiales.length > 0) {
      csv += `Materiales Unitarios:\n`;
      linea.materiales.forEach((mat) => {
        csv += `,"${mat.nombre}",${mat.cantidad},${mat.unidad},${mat.costoUnitario},${mat.cantidad * mat.costoUnitario},"${mat.proveedor || ''}"\n`;
      });
    }

    if (linea.subrenglones && linea.subrenglones.length > 0) {
      csv += `Subrenglones:\n`;
      linea.subrenglones.forEach((sub) => {
        csv += `,"${sub.descripcion}",${sub.cantidad},${sub.unidad},${sub.costoUnitario}\n`;
      });
    }

    csv += `\n`;
  });

  // Resumen de totales
  csv += `RESUMEN FINANCIERO\n`;
  csv += `Concepto,Valor\n`;
  csv += `Costo Directo,${presupuesto.resultado.costoDirecto}\n`;
  csv += `Costo Indirectos,${presupuesto.resultado.costosIndirectos}\n`;
  csv += `Costo Administrativos,${presupuesto.resultado.costosAdministrativos}\n`;
  csv += `Costo Imprevistos,${presupuesto.resultado.costosImprevistos}\n`;
  csv += `Subtotal,${presupuesto.resultado.subtotal}\n`;
  csv += `Utilidad,${presupuesto.resultado.utilidad}\n`;
  csv += `TOTAL PRESUPUESTO,${presupuesto.resultado.total}\n`;

  return csv;
}

/**
 * Genera HTML para impresión/PDF
 */
export function generarHTML(presupuesto: PresupuestoCompleto): string {
  const fechaHoy = new Date().toLocaleDateString('es-CO');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presupuesto - ${presupuesto.proyecto}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #0066cc;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #0066cc;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .header-info {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      font-size: 13px;
      color: #666;
      margin-top: 15px;
    }
    .header-info div {
      border-left: 2px solid #e0e0e0;
      padding-left: 10px;
    }
    .header-info strong {
      display: block;
      color: #333;
      margin-bottom: 3px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 12px;
    }
    table thead {
      background: #f8f9fa;
      border-top: 2px solid #0066cc;
      border-bottom: 2px solid #0066cc;
    }
    table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #0066cc;
    }
    table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e0e0e0;
    }
    table tbody tr:hover {
      background: #f9f9f9;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .subrenglones {
      background: #f9f9f9;
      font-size: 11px;
      color: #666;
      font-style: italic;
    }
    .materiales {
      background: #fafafa;
      font-size: 11px;
      color: #777;
      padding-left: 20px;
    }
    .summary {
      margin-top: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .summary-left {
      font-size: 13px;
    }
    .summary-right {
      text-align: right;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .summary-row strong {
      font-weight: 500;
      color: #333;
    }
    .summary-row.total {
      border-top: 2px solid #0066cc;
      border-bottom: 2px solid #0066cc;
      margin-top: 10px;
      padding: 12px 0;
      background: #f0f6ff;
      font-size: 14px;
      font-weight: 700;
      color: #0066cc;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    @media print {
      body { padding: 0; background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PRESUPUESTO</h1>
      <div class="header-info">
        <div>
          <strong>Proyecto:</strong>
          ${presupuesto.proyecto}
        </div>
        <div>
          <strong>Cliente:</strong>
          ${presupuesto.cliente || 'N/A'}
        </div>
        <div>
          <strong>Fecha:</strong>
          ${fechaHoy}
        </div>
      </div>
      <div class="header-info">
        <div>
          <strong>Ubicación:</strong>
          ${presupuesto.ubicacion || 'N/A'}
        </div>
        <div>
          <strong>Tipología:</strong>
          ${presupuesto.tipologia || 'N/A'}
        </div>
        <div>
          <strong>Fase:</strong>
          ${presupuesto.fase}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>Descripción</th>
          <th class="text-center">Cant.</th>
          <th class="text-center">Unidad</th>
          <th class="text-right">Costo Unit.</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${presupuesto.lineas
          .map((linea) => {
            const costoUnit = linea.costoMaterial + linea.costoManoObra + linea.costoHerramienta;
            const subtotal = costoUnit * linea.cantidad;
            return `
          <tr>
            <td>${linea.codigo}</td>
            <td>${linea.descripcion}</td>
            <td class="text-center">${linea.cantidad}</td>
            <td class="text-center">${linea.unidad}</td>
            <td class="text-right">${formatoMoneda(costoUnit)}</td>
            <td class="text-right"><strong>${formatoMoneda(subtotal)}</strong></td>
          </tr>
          ${
            linea.materiales
              ? linea.materiales
                  .map(
                    (mat) => `
            <tr class="materiales">
              <td colspan="2" style="padding-left: 30px;">📦 ${mat.nombre}</td>
              <td class="text-center">${mat.cantidad}</td>
              <td class="text-center">${mat.unidad}</td>
              <td class="text-right">${formatoMoneda(mat.costoUnitario)}</td>
              <td class="text-right">${formatoMoneda(mat.cantidad * mat.costoUnitario)}</td>
            </tr>
          `
                  )
                  .join('')
              : ''
          }
          ${
            linea.subrenglones
              ? linea.subrenglones
                  .map(
                    (sub) => `
            <tr class="subrenglones">
              <td colspan="2" style="padding-left: 30px;">└─ ${sub.descripcion}</td>
              <td class="text-center">${sub.cantidad}</td>
              <td class="text-center">${sub.unidad}</td>
              <td class="text-right">${formatoMoneda(sub.costoUnitario)}</td>
              <td class="text-right">${formatoMoneda(sub.cantidad * sub.costoUnitario)}</td>
            </tr>
          `
                  )
                  .join('')
              : ''
          }
        `;
          })
          .join('')}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-left">
        <div class="summary-row">
          <span>Estimación de Días:</span>
          <strong>${presupuesto.resultado.estimacionDiasTotal} días</strong>
        </div>
        <div class="summary-row">
          <span>Precio por Día:</span>
          <strong>${formatoMoneda(presupuesto.resultado.precioPorDia)}</strong>
        </div>
      </div>
      <div class="summary-right">
        <div class="summary-row">
          <span>Costo Directo:</span>
          <span>${formatoMoneda(presupuesto.resultado.costoDirecto)}</span>
        </div>
        <div class="summary-row">
          <span>Indirectos (${formatoPorcentaje(presupuesto.factores.indirectos)}):</span>
          <span>${formatoMoneda(presupuesto.resultado.costosIndirectos)}</span>
        </div>
        <div class="summary-row">
          <span>Administrativos (${formatoPorcentaje(presupuesto.factores.administrativos)}):</span>
          <span>${formatoMoneda(presupuesto.resultado.costosAdministrativos)}</span>
        </div>
        <div class="summary-row">
          <span>Imprevistos (${formatoPorcentaje(presupuesto.factores.imprevistos)}):</span>
          <span>${formatoMoneda(presupuesto.resultado.costosImprevistos)}</span>
        </div>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>${formatoMoneda(presupuesto.resultado.subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>Utilidad (${formatoPorcentaje(presupuesto.factores.utilidad)}):</span>
          <span>${formatoMoneda(presupuesto.resultado.utilidad)}</span>
        </div>
        <div class="summary-row total">
          <span>TOTAL PRESUPUESTO:</span>
          <span>${formatoMoneda(presupuesto.resultado.total)}</span>
        </div>
        <div class="summary-row">
          <span>Margen de Utilidad:</span>
          <span>${formatoPorcentaje(presupuesto.resultado.margenUtilidad)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Este presupuesto ha sido generado automáticamente por el sistema de control de obras.</p>
      <p>Válido hasta 30 días desde la fecha de emisión.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Descarga un archivo
 */
export function descargarArchivo(contenido: string, nombreArchivo: string, tipoMime: string = 'text/plain') {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta a CSV
 */
export function exportarCSV(presupuesto: PresupuestoCompleto, detallado: boolean = false) {
  const csv = detallado ? generarCSVDetallado(presupuesto) : generarCSV(presupuesto);
  const nombreArchivo = `Presupuesto_${presupuesto.proyecto}_${new Date().toISOString().split('T')[0]}.csv`;
  descargarArchivo(csv, nombreArchivo, 'text/csv;charset=utf-8');
}

/**
 * Exporta a PDF (abre en nueva ventana para imprimir)
 */
export function exportarPDF(presupuesto: PresupuestoCompleto) {
  const html = generarHTML(presupuesto);
  const ventana = window.open('', '_blank');
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => {
      ventana.print();
    }, 250);
  }
}

/**
 * Copia presupuesto al portapapeles
 */
export async function copiarAlPortapapeles(presupuesto: PresupuestoCompleto) {
  try {
    const csv = generarCSV(presupuesto);
    await navigator.clipboard.writeText(csv);
    return true;
  } catch (error) {
    console.error('Error copiando:', error);
    return false;
  }
}
