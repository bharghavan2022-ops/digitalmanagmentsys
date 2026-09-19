import ExcelJS from "exceljs";

/**
 * Buffers the whole workbook rather than streaming it: exceljs's streaming
 * writer targets a Node Writable, and bridging that into a Next.js Route
 * Handler's Web-standard Response body isn't worth the complexity at this
 * app's scale (a department-level volunteer roster, not millions of rows).
 */
export async function buildXlsxBuffer(
  sheetName: string,
  header: string[],
  rows: Array<Array<string | number>>,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(header);
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(row);
  }
  sheet.columns.forEach((column) => {
    column.width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
