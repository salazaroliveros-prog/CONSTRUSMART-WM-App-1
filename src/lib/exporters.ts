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

/** Datos de la empresa para membrete */
const EMPRESA = {
  nombre: 'CONSTRUCTORA WM / M&S',
  eslogan: 'Edificando el Futuro',
  direccion: '6a. Avenida 3-45, Zona 10, Ciudad de Guatemala',
  telefono: '+502 2289-4500',
  email: 'info@constructowm.com',
  web: 'www.constructowm.com',
  nit: 'NIT: 987654-3',
};

/**
 * Exporta PDF de presupuesto con membrete completo y firma.
 * @param tipo 'admin' = reporte completo, 'cliente' = solo resumen
 */
export function exportPresupuestoPDF(params: {
  proyecto: string; cliente: string; ubicacion: string; tipologia: string;
  factorIndirectos: number; factorAdministrativos: number; factorImprevistos: number; factorUtilidad: number;
  lineas: LineaPresupuesto[];
  totales: {
    costoDirecto: number; totalMaterial: number; totalMO: number; totalEquipo: number;
    indirectos: number; administrativos: number; imprevistos: number;
    subtotal: number; utilidad: number; total: number; tiempo: number; totalPersonasDia: number;
  };
  tipo?: 'admin' | 'cliente';
}) {
  const { proyecto, cliente, ubicacion, tipologia, factorIndirectos, factorAdministrativos, factorImprevistos, factorUtilidad, lineas, totales, tipo = 'admin' } = params;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 190;
  const margin = 10;
  let y = margin;
  let paginaActual = 1;

  const header = () => {
    // Barra superior azul
    doc.setFillColor(30, 58, 138);
    doc.rect(margin, y, pageW, 28, 'F');
    
    // Logo placeholder (círculo blanco con inicial)
    doc.setFillColor(255, 255, 255);
    doc.circle(margin + 10, y + 14, 8, 'F');
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(10);
    doc.text('WM', margin + 7, y + 16);
    
    // Nombre empresa
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(EMPRESA.nombre, margin + 22, y + 9);
    doc.setFontSize(7);
    doc.text(EMPRESA.eslogan, margin + 22, y + 16);
    
    // Tipo de documento
    doc.setFontSize(9);
    doc.text(tipo === 'admin' ? 'PRESUPUESTO (Administración)' : 'COTIZACIÓN', margin + pageW - 4, y + 9, { align: 'r' });
    doc.setFontSize(7);
    doc.text(`No. ${new Date().getTime().toString(36).toUpperCase()}`, margin + pageW - 4, y + 16, { align: 'r' });
    doc.text(new Date().toLocaleDateString('es-GT'), margin + pageW - 4, y + 22, { align: 'r' });
    
    y += 32;
  };

  const footer = () => {
    // Línea divisoria
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.line(margin, 275, margin + pageW, 275);
    
    // Pie de página con datos de contacto
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${EMPRESA.nombre} · ${EMPRESA.direccion}`, margin, 280);
    doc.text(`Tel: ${EMPRESA.telefono} · Email: ${EMPRESA.email} · ${EMPRESA.web}`, margin, 284);
    doc.text(`${EMPRESA.nit}`, margin, 288);
    doc.text(`Pág. ${paginaActual}`, margin + pageW, 288, { align: 'r' });
    paginaActual++;
  };

  const checkPage = (h: number) => {
    if (y + h > 255) { footer(); doc.addPage(); y = margin; header(); }
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

  // === RENGLONES (ambos reportes) ===
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

  // Solo para ADMIN: explosión de materiales, MO, equipo
  if (tipo === 'admin') {
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
  }

  // === RESUMEN FINANCIERO (ambos reportes) ===
  checkPage(50);
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('Resumen Financiero', margin, y);
  y += 5;

  const resumenBody = tipo === 'cliente'
    ? [
        ['TOTAL DEL PROYECTO', fmtQ(totales.total)],
      ]
    : [
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
      ];

  autoTable(doc, {
    startY: y,
    tableWidth: pageW,
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 58, 138] },
    body: resumenBody,
    theme: 'grid',
    foot: [[{ content: `Tiempo Estimado: ${totales.tiempo.toFixed(1)} días${tipo === 'cliente' ? '' : ` · ${totales.totalPersonasDia.toFixed(0)} personas-día`}`, colSpan: 2, styles: { fontSize: 7, fontStyle: 'italic' } }]],
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  // === FIRMAS (solo admin) ===
  if (tipo === 'admin') {
    checkPage(30);
    doc.setDrawColor(200, 200, 200);
    // Firma elaboró
    doc.line(margin + 10, y + 15, margin + 70, y + 15);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Elaboró', margin + 10, y + 20);
    doc.text('Ing. Residente', margin + 10, y + 25);
    // Firma revisó
    doc.line(margin + 95, y + 15, margin + 155, y + 15);
    doc.text('Revisó', margin + 95, y + 20);
    doc.text('Gerente de Proyectos', margin + 95, y + 25);
    // Firma Vo.Bo.
    doc.line(margin + 180, y + 15, margin + 190, y + 15);
    doc.text('Vo.Bo.', margin + 180, y + 20);
    doc.text('Gerente General', margin + 180, y + 25);
    y += 30;
  }

  footer();
  
  const filename = `Presupuesto_${(proyecto || 'sin_titulo').replace(/\s+/g, '_')}_${tipo}.pdf`;
  doc.save(filename);
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