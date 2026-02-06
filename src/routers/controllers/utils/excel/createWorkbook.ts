import Excel from "exceljs";
import { ExcelExportConfig } from "./types.js";
import { headerStyle, defaultColumnWidth } from "./styles.js";

export function createWorkbook<T>(data: T[], config: ExcelExportConfig<T>) {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet(config.sheetName);

  worksheet.columns = config.columns.map((col) => ({
    header: col.header,
    key: col.key as string,
    width: col.width || defaultColumnWidth,
  }));

  data.forEach((item) => {
    const row: any = {};

    config.columns.forEach((col) => {
      row[col.key] = col.map ? col.map(item) : (item as any)[col.key];
    });

    worksheet.addRow(row);
  });

  worksheet.getRow(1).eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });

  return workbook;
}
