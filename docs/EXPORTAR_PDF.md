# Exportar presupuesto a PDF

Ahora puedes exportar el análisis y resultados del presupuesto a PDF desde el Panel de Análisis.

## ¿Cómo funciona?
- Haz clic en el botón **PDF** (ícono de descarga) en la esquina superior derecha del panel de análisis.
- Se descargará un archivo `presupuesto.pdf` con el contenido del panel, incluyendo totales, desglose y sensibilidad.

## Detalles técnicos
- Utiliza `html2pdf.js` para capturar el panel y generar el PDF.
- El botón llama a la función `exportarPresupuestoPDF` de `src/utils/exportPDF.ts`.
- El PDF incluye todo lo visible en el panel de análisis.

## Personalización
- Puedes modificar el nombre del archivo o el área exportada cambiando el parámetro en el botón.
- Para exportar todo el presupuesto (los 3 paneles), basta con envolver el layout principal en un `<div id="presupuesto-pdf">` y pasar ese ID a la función.

---

¿Quieres que el PDF incluya los 3 paneles o solo el análisis? ¡Solo dime y lo ajusto!
