import { createTozaMakonApi } from "@api/tozaMakon.js";
import { kirillga } from "@bot/middlewares/smallFunctions/lotinKiril.js";
import { Abonent } from "@models/Abonent.js";
import { getAbonentsByMfyIdQuerySchema } from "@schemas/billing.schema.js";
import { searchAbonent } from "@services/billing/index.js";
import { IAbonent } from "types/billing";

interface IFilteredAbonent extends IAbonent {
  accountNumber: string; // tozaMakon API'dan
  ksaldo: number; // balans
  fullName: string; // kirillga o'zgartirilgan fio
  isElektrKodConfirmForExcel?: "✅" | "❌"; // eksport uchun
  isElektrKodConfirm?: boolean; // checkbox yoki boshqa logic uchun
  isIdentified?: "✅" | "❌"; // shaxsi tasdiqlanganmi
}

export async function getAbonentsByMfyId(req: {
  params: { mfy_id: string };
  query: {
    minSaldo?: number;
    maxSaldo?: number;
    identified?: "true" | "false";
    etkStatus?: "true" | "false";
  };
  user: { companyId: number };
}): Promise<IFilteredAbonent[]> {
  const tozaMakonApi = createTozaMakonApi(req.user.companyId);
  const { minSaldo, maxSaldo, identified, etkStatus } =
    getAbonentsByMfyIdQuerySchema.parse(req.query);

  let page = 0;
  let totalPages = 1;
  const rows = [];
  const filters: any = {};

  if (identified === "true") {
    filters["shaxsi_tasdiqlandi.confirm"] = true;
  }
  if (identified === "false") {
    filters["shaxsi_tasdiqlandi.confirm"] = { $ne: true };
  }
  if (etkStatus === "true") {
    filters["ekt_kod_tasdiqlandi.confirm"] = true;
  }
  if (etkStatus === "false") {
    filters["ekt_kod_tasdiqlandi.confirm"] = { $ne: true };
  }

  const abonents = await Abonent.find({
    mahallas_id: req.params.mfy_id,
    companyId: req.user.companyId,
    ...filters,
  }).lean();

  const data = await searchAbonent(tozaMakonApi, {
    page,
    size: 300,
    companyId: req.user.companyId,
    mahallaId: parseInt(req.params.mfy_id),
  });
  rows.push(...data.content);
  totalPages = data.totalPages;

  if (totalPages > 1) {
    for (let i = 1; i < totalPages; i++) {
      const data = await searchAbonent(tozaMakonApi, {
        page: i,
        size: 300,
        companyId: req.user.companyId,
        mahallaId: parseInt(req.params.mfy_id),
      });
      rows.push(...data.content);
    }
  }

  let filteredData = rows.filter((abonent) => {
    const abonentSaldo = abonent.ksaldo;
    const abonentMongo = abonents.find(
      (a) => a.licshet == abonent.accountNumber
    );

    if (!abonentMongo) return false;

    const isAboveMinSaldo = minSaldo ? abonentSaldo > minSaldo : true;
    const isBelowMaxSaldo = maxSaldo ? abonentSaldo < maxSaldo : true;

    if (abonentMongo.ekt_kod_tasdiqlandi) {
      (abonent as any).isElektrKodConfirmForExcel = abonentMongo
        .ekt_kod_tasdiqlandi.confirm
        ? "✅"
        : "❌";
    }
    if (abonentMongo.shaxsi_tasdiqlandi) {
      (abonent as any).isIdentified = abonentMongo.shaxsi_tasdiqlandi.confirm
        ? "✅"
        : "❌";
    }
    if (abonentMongo.ekt_kod_tasdiqlandi) {
      (abonent as any).isElektrKodConfirm =
        abonentMongo.ekt_kod_tasdiqlandi.confirm;
    }

    abonent.fullName = kirillga(abonent.fullName || abonentMongo?.fio);
    return isAboveMinSaldo && isBelowMaxSaldo;
  });

  filteredData.sort((a, b) => a.fullName.localeCompare(b.fullName));
  return filteredData;
}
