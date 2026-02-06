import { ExcelExportConfig } from "../types.js";

export type AbonentExcelRow = {
  id: string;
  licshet: string;
  fio: string;
  mahalla_name: string;
  ksaldo: number;
  sudAkt?: {
    id?: string;
    createdDate?: string;
  };
  warningLetter?: {
    id?: string;
    createdDate?: string;
  };
  shaxsi_tasdiqlandi?: {
    confirm?: boolean;
  };
};

export const abonentsExcelConfig: ExcelExportConfig<AbonentExcelRow> = {
  sheetName: "Abonents",
  columns: [
    { header: "ID", key: "id" },
    { header: "Hisob raqami", key: "licshet" },
    { header: "F.I.O.", key: "fio" },
    { header: "Mahalla", key: "mahalla_name" },
    { header: "Qarzdorlik", key: "ksaldo" },

    {
      header: "Sud Akt id",
      key: "sudAktId",
      map: (a) => a.sudAkt?.id,
    },
    {
      header: "Sud Akt sana",
      key: "sudAktDate",
      map: (a) => a.sudAkt?.createdDate,
    },
    {
      header: "Ogohlantirish id",
      key: "warningLetterId",
      map: (a) => a.warningLetter?.id,
    },
    {
      header: "Ogohlantirish sana",
      key: "warningLetterDate",
      map: (a) => a.warningLetter?.createdDate,
    },
    {
      header: "Shaxsi tasdiqlangan",
      key: "shaxsi_tasdiqlandi",
      map: (a) => (a.shaxsi_tasdiqlandi?.confirm ? "✅" : "❌"),
    },
  ],
};
