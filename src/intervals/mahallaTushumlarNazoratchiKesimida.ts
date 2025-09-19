import { createTozaMakonApi } from "@api/tozaMakon.js";
import { deletePreviousReport } from "@bot/helpers/deletePreviousReport.js";
import { renderHtmlByEjs } from "@helpers/renderHtmlByEjs.js";
import { sendHtmlAsPhoto } from "@helpers/sendHtmlAsPhoto.js";
import { Company } from "@models/Company.js";
import { Mahalla } from "@models/Mahalla.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { ReportType } from "@models/ReportsMessage.js";
import { getReportsPaymentpartnersIncomes } from "@services/billing/getReportsPaymentpartnersIncomes.js";
import { formatDate } from "@services/utils/formatDate.js";

interface Params {
  companyId: number;
  from: Date;
  to: Date;
  shouldDeleteLastReport: boolean;
}

interface IRow {
  _id: number;
  name: string;
  mfy_ids: number[];
  ekopaySumma: number;
  count: number;
  allSumma: number;
}

export async function mahallaTushumlarNazoratchiKesimida({
  companyId,
  from,
  to,
  shouldDeleteLastReport,
}: Params) {
  try {
    const company = await Company.findOne({ id: companyId });
    if (!company) throw "Company not found";
    const tozaMakonApi = createTozaMakonApi(companyId);
    const mahallas: IRow[] = await Mahalla.aggregate([
      {
        $match: {
          companyId,
          biriktirilganNazoratchi: { $exists: true },
          "biriktirilganNazoratchi.inspactor_id": { $exists: true },
        },
      },
      {
        $group: {
          _id: "$biriktirilganNazoratchi.inspactor_id",
          name: { $last: "$biriktirilganNazoratchi.inspector_name" },
          mfy_ids: { $push: "$id" },
        },
      },
      {
        $addFields: {
          ekopaySumma: 0,
          count: 0,
          allSumma: 0,
        },
      },
    ]);

    if (mahallas.length === 0) throw "mahallalar topilmadi";

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
      const row = mahallas.find((r) => r.mfy_ids.includes(m.id));
      if (row) {
        const ekopay = m.partnerTransactions.find((p) => p.partnerId === 7);
        row.ekopaySumma += ekopay?.transactionAmount || 0;
        row.count += ekopay?.transactionCount || 0;
      }
    });

    mahallas.sort((a, b) => b.ekopaySumma - a.ekopaySumma);

    const htmlString = await renderHtmlByEjs("nazoratchilarKunlikTushum.ejs", {
      sana: formatDate(new Date()),
      rows: mahallas.map((r) => ({
        id: r._id,
        name: r.name,
        tushumSoni: r.count,
        summasi: r.ekopaySumma,
      })),
      jamiTushumSoni: mahallas.reduce((a, b) => a + b.count, 0),
      jamiTushumSummasi: mahallas.reduce((a, b) => a + b.ekopaySumma, 0),
    });

    const msg = await sendHtmlAsPhoto(
      { htmlString, selector: "div" },
      // company.GROUP_ID_NAZORATCHILAR,
      process.env.ME as string,
      {
        parse_mode: "HTML",
      }
    );

    if (shouldDeleteLastReport)
      await deletePreviousReport(
        companyId,
        ReportType.mahallaTushumlarNazoratchiKesimida,
        msg
      );
  } catch (error) {
    console.error(error);
  }
}
