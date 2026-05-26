// Utilidad para exportar presupuestos a PDF usando html2pdf.js y capturando gráficos de Recharts
import html2pdf from 'html2pdf.js';

/**
 * Exporta un presupuesto a PDF, incluyendo gráficos de Recharts.
 * @param elementId ID del elemento HTML a exportar (debe contener el presupuesto y los gráficos)
 * @param fileName Nombre del archivo PDF a guardar
 */
export async function exportarPresupuestoPDF(elementId: string, fileName = 'presupuesto.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Elemento no encontrado para exportar PDF');

  // Opciones recomendadas para html2pdf
   
  const opt: any = {
    margin:       0.5,
    filename:     fileName,
    image:        { type: 'jpeg' as const, quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  await html2pdf().set(opt).from(element).save();
}
