import * as ExcelJS from 'exceljs';

export function createWorkbook(): ExcelJS.Workbook {
  return new ExcelJS.Workbook();
}

export function addJsonSheet<T extends Record<string, unknown>>(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  data: T[],
) {
  const sheet = workbook.addWorksheet(sheetName);

  if (data.length === 0) {
    return sheet;
  }

  const columns = Object.keys(data[0]).map((key) => ({ header: key, key, width: 20 }));
  sheet.columns = columns;

  data.forEach((row) => {
    sheet.addRow(row as ExcelJS.RowValues);
  });

  return sheet;
}

export function addAOASheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  data: (string | number)[][],
) {
  const sheet = workbook.addWorksheet(sheetName);
  data.forEach((row) => {
    sheet.addRow(row as ExcelJS.RowValues);
  });
  return sheet;
}

export async function saveWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
