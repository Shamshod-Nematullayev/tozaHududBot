import { createTozaMakonApi } from "@api/tozaMakon.js";
import { Company } from "@models/Company.js";
import { Mahalla } from "@models/Mahalla.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { getReportsPaymentpartnersIncomes } from "@services/billing/getReportsPaymentpartnersIncomes.js";
import { formatDate } from "@services/utils/formatDate.js";

interface Params {
  companyId: number;
  from: Date;
  to: Date;
  onlyEcopay: boolean;
  shouldDeleteLastReport: boolean;
}

interface IRow {
  mfy_id: number[];
  inspector_id: number;
  inspector_name: string;
  ekopaySumma: number;
  count: number;
  allSumma: number;
}

export async function mahallaTushumlarNazoratchiKesimida({
  companyId,
  from,
  to,
  onlyEcopay,
  shouldDeleteLastReport,
}: Params) {
  try {
    const company = await Company.findOne({ id: companyId });
    if (!company) throw "Company not found";
    const tozaMakonApi = createTozaMakonApi(companyId);
    const inspectors = await Nazoratchi.find({ activ: true, companyId }).lean();
    const rows: IRow[] = [];
    const mahallas = await Mahalla.find({ companyId });

    if (inspectors.length === 0 || mahallas.length === 0)
      throw "Nazoratchilar yoki mahallalar topilmadi";

    // 1) Nazoratchilarni id bo‘yicha map qilish
    inspectors.forEach((i) => {
      rows.push({
        inspector_id: i.id,
        inspector_name: i.name,
        ekopaySumma: 0,
        count: 0,
        mfy_id: [],
        allSumma: 0,
      });
    });

    // 2) Har bir mahallani bir marta aylanib chiqish
    mahallas.forEach((m) => {
      const inspId = m.biriktirilganNazoratchi?.inspactor_id?.toString();

      if (inspId) {
        const row = rows.find((r) => r.inspector_id.toString() === inspId);
        if (row) {
          row.mfy_id.push(m.id);
        }
      }
    });

    // 3) Mahallalar tushumini olish
    const mahallaTushum = await getReportsPaymentpartnersIncomes(tozaMakonApi, {
      reportType: "MAHALLA",
      companyId,
      fromDate: formatDate(from),
      toDate: formatDate(to),
      districtId: company.districtId,
      regionId: company.regionId,
    });

    // 4) Mahallalar tushumini bir marta aylanib chiqish
    mahallaTushum.forEach((m) => {
      const row = rows.find((r) => r.mfy_id.includes(m.id));
      if (row) {
        const ekopay = m.partnerTransactions.find((p) => p.partnerId === 7);
        row.ekopaySumma += ekopay?.transactionAmount || 0;
        row.count += ekopay?.transactionCount || 0;
      }
    });

    // 5) Nazoratchilar bilan bir marta aylanib chiqish
    console.log(rows);
  } catch (error) {
    console.error(error);
  }
}
