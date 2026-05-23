// Utilidades para exportar a CSV y PDF (vía window.print con HTML estilizado)

export const downloadCSV = (filename: string, rows: (string | number)[][]) => {
  const csv = rows.map(r => r.map(v => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  }).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printPDF = (title: string, bodyHTML: string) => {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>${title}</title>
  <style>
    *{box-sizing:border-box;}
    body{font-family:'Inter','Segoe UI',Arial,sans-serif;margin:0;padding:0;color:#1f2937;}
    .page{padding:32px 40px;}
    .header{display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #1E3A8A;padding-bottom:16px;margin-bottom:24px;}
    .brand{display:flex;align-items:center;gap:14px;}
    .brand-logo{width:60px;height:60px;background:linear-gradient(135deg,#1E3A8A,#3B82F6);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:20px;letter-spacing:1px;}
    .brand h1{margin:0;font-size:18px;color:#1E3A8A;letter-spacing:0.5px;}
    .brand p{margin:2px 0 0;font-size:11px;color:#64748b;font-style:italic;}
    .meta{text-align:right;font-size:11px;color:#475569;}
    h2{color:#1E3A8A;font-size:16px;margin:20px 0 10px;border-left:4px solid #10B981;padding-left:10px;}
    table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px;}
    th{background:#1E3A8A;color:#fff;padding:8px 6px;text-align:left;font-weight:600;}
    td{padding:6px;border-bottom:1px solid #e2e8f0;}
    tr:nth-child(even) td{background:#f8fafc;}
    .total-row td{font-weight:700;background:#dbeafe !important;color:#1E3A8A;}
    .footer{margin-top:32px;padding-top:14px;border-top:2px solid #1E3A8A;display:flex;justify-content:space-between;font-size:10px;color:#64748b;}
    .num{text-align:right;font-variant-numeric:tabular-nums;}
    @media print { .no-print{display:none;} body{margin:0;} }
    .actions{position:fixed;top:10px;right:10px;}
    .actions button{background:#1E3A8A;color:#fff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;margin-left:6px;font-size:12px;}
  </style></head><body>
  <div class="actions no-print">
    <button onclick="window.print()">Imprimir / Guardar PDF</button>
    <button onclick="window.close()">Cerrar</button>
  </div>
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="brand-logo">WM<br/>M&amp;S</div>
        <div>
          <h1>CONSTRUCTORA WM/M&amp;S</h1>
          <p>Edificando el Futuro</p>
        </div>
      </div>
      <div class="meta">
        <div><strong>${title}</strong></div>
        <div>Fecha: ${new Date().toLocaleDateString('es-GT')}</div>
        <div>Guatemala, C.A.</div>
      </div>
    </div>
    ${bodyHTML}
    <div class="footer">
      <div>CONSTRUCTORA WM/M&amp;S · Edificando el Futuro</div>
      <div>Documento generado el ${new Date().toLocaleString('es-GT')}</div>
    </div>
  </div>
  </body></html>`);
  win.document.close();
};

export const fmtQ = (n: number) =>
  'Q ' + n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
