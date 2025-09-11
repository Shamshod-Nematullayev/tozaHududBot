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
    const inspectors = await Nazoratchi.find({ activ: true, companyId });
    const mahallas = await Mahalla.find({ companyId });

    if (inspectors.length === 0 || mahallas.length === 0)
      throw "Nazoratchilar yoki mahallalar topilmadi";

    // 1) Nazoratchilarni id bo‘yicha map qilish
    const inspectorMap = new Map<string, any>();
    inspectors.forEach((i) => {
      i.biriktirilgan = [];
      inspectorMap.set(i.id.toString(), i);
    });

    // 2) Har bir mahallani bir marta aylanib chiqish
    mahallas.forEach((m) => {
      const inspId = m.biriktirilganNazoratchi?.inspactor_id?.toString();
      if (inspId && inspectorMap.has(inspId)) {
        inspectorMap.get(inspId).biriktirilgan.push(m.id);
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
    // const mahalla
    // mahallaTushum.forEach((m) => {
    //   inspectorMap.has
    // });
    return inspectors;
  } catch (error) {
    console.error(error);
  }
}
