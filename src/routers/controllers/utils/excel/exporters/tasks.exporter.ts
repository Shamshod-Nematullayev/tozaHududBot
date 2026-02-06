import { ExcelExportConfig } from "../types.js";

// Row interface
interface TaskRow {
  order_number: number;
  accountNumber: string;
  fullName: string;
  id: number;
  mahallaId: number;
  mahallaName: string;
  type: string;
  nazoratchi_id: string;
  nazoratchiName: string;
  status: string;
  purpose: string;
}
// config object
export const tasksExcelConfig: ExcelExportConfig<TaskRow> = {
  sheetName: "Topshiriqlar",
  columns: [
    { header: "№", key: "order_number" },
    { header: "ID", key: "id" },
    { header: "Hisob raqami", key: "accountNumber" },
    { header: "F.I.O.", key: "fullName" },
    { header: "Mahalla ID", key: "mahallaId" },
    { header: "Mahalla", key: "mahallaName" },
    { header: "Turi", key: "type" },
    { header: "Nazoratchi ID", key: "nazoratchi_id" },
    { header: "Nazoratchi", key: "nazoratchiName" },
    { header: "Holati", key: "status" },
    { header: "Mavzusi", key: "purpose" },
  ],
};
