import Excel from "exceljs";

export type ExcelColumn<T> = {
  header: string;
  key: keyof T | string;
  width?: number;
  map?: (row: T) => any;
};

export type ExcelExportConfig<T> = {
  sheetName: string;
  columns: ExcelColumn<T>[];
};
