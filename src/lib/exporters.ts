import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type SubMaterial = { nombre: string; unidad: string; cantidad: number; costoUnitario: number; desperdicio?: number };
type SubManoObra = { descripcion: string; cantidadPersonas: number; jornal: number };
type SubEquipo = { descripcion: string; cantidad: number; costoHora: number };
type Subrenglones = { materiales: SubMaterial[]; manoObra: SubManoObra[]; equipos: SubEquipo[] };
type LineaPresupuesto = {
  id: string; codigo: string; descripcion: string; unidad: string; cantidad: number;
  rendimiento: number; costoMaterial: number; costoManoObra: number; costoHerramienta: number;
  subrenglones: Subrenglones;
};

export function exportPresupuestoPDF(params: {
  proyecto: string; cliente: string; ubicacion: string; tipologia: string;
  factorIndirectos: number; factorAdministrativos: number; factorImprevistos: number; factorUtilidad: number;
  lineas: LineaPresupuesto[];
  totales: {
    costoDirecto: number; totalMaterial: number; totalMO: number; totalEquipo: number;
    indirectos: number; administrativos: number; imprevistos: number;
    subtotal: number; utilidad: number; total: number; tiempo: number; totalPersonasDia: number;
  };
}) {
  const { proyecto, cliente, ubicacion, tipologia, factorIndirectos, factorAdministrativos, factorImprevistos, factorUtilidad, lineas, totales } = params;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 190;
  const margin = 10;
  let y = margin;

  const header = () => {
    doc.setFillColor(30, 58, 138);
    doc.rect(margin, y, pageW, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('CONSTRUCTORA WM / M&S', margin + 4, y + 8);
    doc.setFontSize(8);
    doc.text('Edificando el Futuro', margin + 4, y + 15);
    doc.setFontSize(9);
    doc.text('PRESUPUESTO', margin + pageW - 4, y + 8, { align: 'r' });
    doc.text(new Date().toLocaleDateString('es-GT'), margin + pageW - 4, y + 16, { align: 'r' });
    y += 28;
  };
  const footer = () => {
    doc.setDrawColor(30, 58, 138);
    doc.line(margin, 285, margin + pageW, 285);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('CONSTRUCTORA WM/M&S · Edificando el Futuro', margin, 290);
    doc.text(`Generado ${new Date().toLocaleString('es-GT')}`, margin + pageW, 290, { align: 'r' });
  };
  const checkPage = (h: number) => {
    if (y + h > 270) { footer(); doc.addPage(); y = margin; header(); }
  };

  header();

  // === INFO GENERAL ===
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('Información General del Proyecto', margin, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    tableWidth: pageW,
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 58, 138] },
    body: [
      ['Proyecto', proyecto],
      ['Cliente', cliente || 'N/A'],
      ['Ubicación', ubicacion || 'N/A'],
      ['Tipología', tipologia],
    ],
    theme: 'grid',
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 6;

  // === RENGLONES ===
  checkPage(20);
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('Renglones del Presupuesto', margin, y);
  y += 5;
  const renglonesBody = lineas.map(l => {
    const cu = l.costoMaterial + l.costoManoObra + l.costoHerramienta;
    return [l.codigo, l.descripcion, l.unidad, String(l.cantidad), fmtQ(cu), fmtQ(cu * l.cantidad)];
  });
  if (renglonesBody.length > 0) {
    autoTable(doc, {
      startY: y,
      tableWidth: pageW,
      styles: { fontSize: 7, cellPadding: 1.2 },
      headStyles: { fillColor: [30, 58, 138] },
      columns: [
        { header: 'Código', dataKey: '0' },
        { header: 'Descripción', dataKey: '1' },
        { header: 'Und', dataKey: '2' },
        { header: 'Cant', dataKey: '3' },
        { header: 'C.Unit.', dataKey: '4' },
        { header: 'Subtotal', dataKey: '5' },
      ],
      body: renglonesBody.map(r => r.map(v => ({ content: v, styles: { halign: v === r[3] || v === r[4] || v === r[5] ? 'right' : 'left' as const } }))),
      foot: [[{ content: 'COSTO DIRECTO TOTAL', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [219, 234, 254] } },
        { content: fmtQ(totales.costoDirecto), styles: { halign: 'right', fontStyle: 'bold', fillColor: [219, 234, 254] } }]],
      theme: 'grid',
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 6;
  }

  // === EXPLOSIÓN DE MATERIALES ===
  checkPage(20);
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('Explosión de Materiales', margin, y);
  y += 5;
  const matBody = lineas.flatMap(l =>
    l.subrenglones.materiales.map(m => {
      const desp = m.desperdicio ?? 0;
      const subt = m.cantidad * (1 + desp / 100) * m.costoUnitario;
      return [l.codigo, m.nombre, m.unidad, String(m.cantidad), `${desp}%`, fmtQ(m.costoUnitario), fmtQ(subt)];
    })
  );
  if (matBody.length > 0) {
    autoTable(doc, {
      startY: y,
      tableWidth: pageW,
      styles: { fontSize: 7, cellPadding: 1.2 },
      headStyles: { fillColor: [16, 185, 129] },
      columns: [
        { header: 'Cód.', dataKey: '0' },
        { header: 'Material', dataKey: '1' },
        { header: 'Und', dataKey: '2' },
        { header: 'Cant', dataKey: '3' },
        { header: 'Desp', dataKey: '4' },
        { header: 'Q/Und', dataKey: '5' },
        { header: 'Subtotal', dataKey: '6' },
      ],
      body: matBody.map(r => r.map((v, i) => ({ content: v, styles: { halign: i >= 3 ? 'right' : 'left' as const } }))),
      theme: 'grid',
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 6;
  }

  // === MANO DE OBRA ===
  checkPage(20);
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('Mano de Obra por Renglón', margin, y);
  y += 5;
  const moBody = lineas.flatMap(l =>
    l.subrenglones.manoObra.map(m => {
      const costoUnd = l.rendimiento > 0 ? m.cantidadPersonas * m.jornal / l.rendimiento : 0;
      return [l.codigo, m.descripcion, String(m.cantidadPersonas), fmtQ(m.jornal), fmtQ(costoUnd)];
    })
  );
  if (moBody.length > 0) {
    autoTable(doc, {
      startY: y,
      tableWidth: pageW,
      styles: { fontSize: 7, cellPadding: 1.2 },
      headStyles: { fillColor: [5, 150, 105] },
      columns: [
        { header: 'Cód.', dataKey: '0' },
        { header: 'Cuadrilla', dataKey: '1' },
        { header: 'Pers.', dataKey: '2' },
        { header: 'Jornal', dataKey: '3' },
        { header: 'C/Und', dataKey: '4' },
      ],
      body: moBody.map(r => r.map((v, i) => ({ content: v, styles: { halign: i >= 2 ? 'right' : 'left' as const } }))),
      theme: 'grid',
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 6;
  }

  // === EQUIPO ===
  checkPage(20);
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('Equipo y Herramienta', margin, y);
  y += 5;
  const eqBody = lineas.flatMap(l =>
    l.subrenglones.equipos.map(e => [l.codigo, e.descripcion, String(e.cantidad), fmtQ(e.costoHora), fmtQ(e.cantidad * e.costoHora)])
  );
  if (eqBody.length > 0) {
    autoTable(doc, {
      startY: y,
      tableWidth: pageW,
      styles: { fontSize: 7, cellPadding: 1.2 },
      headStyles: { fillColor: [217, 119, 6] },
      columns: [
        { header: 'Cód.', dataKey: '0' },
        { header: 'Equipo', dataKey: '1' },
        { header: 'Horas', dataKey: '2' },
        { header: 'Q/Hora', dataKey: '3' },
        { header: 'Subtotal', dataKey: '4' },
      ],
      body: eqBody.map(r => r.map((v, i) => ({ content: v, styles: { halign: i >= 2 ? 'right' : 'left' as const } }))),
      theme: 'grid',
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 6;
  }

  // === RESUMEN FINANCIERO ===
  checkPage(40);
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('Resumen Financiero', margin, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    tableWidth: pageW,
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 58, 138] },
    body: [
      ['Costo Directo', fmtQ(totales.costoDirecto)],
      ['   Materiales', fmtQ(totales.totalMaterial)],
      ['   Mano de Obra', fmtQ(totales.totalMO)],
      ['   Equipo', fmtQ(totales.totalEquipo)],
      ['Costos Indirectos (' + factorIndirectos + '%)', fmtQ(totales.indirectos)],
      ['Costos Administrativos (' + factorAdministrativos + '%)', fmtQ(totales.administrativos)],
      ['Imprevistos (' + factorImprevistos + '%)', fmtQ(totales.imprevistos)],
      ['Subtotal', fmtQ(totales.subtotal)],
      ['Utilidad (' + factorUtilidad + '%)', fmtQ(totales.utilidad)],
      ['TOTAL DEL PROYECTO', fmtQ(totales.total)],
    ],
    theme: 'grid',
    foot: [[{ content: `Tiempo Estimado: ${totales.tiempo.toFixed(1)} días · ${totales.totalPersonasDia.toFixed(0)} personas-día`, colSpan: 2, styles: { fontSize: 7, fontStyle: 'italic' } }]],
  });

  footer();
  doc.save(`Presupuesto_${proyecto || 'sin_titulo'}.pdf`);
}

export function fmtQ(val: number): string {
  return 'Q ' + (val ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + rows.map(e => e.map(val => {
        const text = String(val ?? '');
        if (text.includes(',') || text.includes('\n') || text.includes('"')) {
          return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      }).join(",")).join("\n");
      
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printPDF(title: string, htmlContent: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          h1 { color: #1e3a8a; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .num { text-align: right; }
          .total-row { font-weight: bold; background-color: #e2e8f0 !important; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${htmlContent}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        </script>
      </body>
    </html>
  `);
  win.document.close();
}
