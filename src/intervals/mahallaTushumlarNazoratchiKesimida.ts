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

/**
 * Sends a report about inspectors' daily income to the specified company's
 * nazoratchilar group.
 * @param {number} companyId - The ID of the company to send the report to.
 * @param {Date} from - The start date of the report period.
 * @param {Date} to - The end date of the report period.
 * @param {boolean} shouldDeleteLastReport - Whether to delete the previous report.
 * @returns {Promise<void>}
 */
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
    // 1) Mahallalarda biriktirilgan nazoratchilar ro'yxatini shakllantirish
    const inspectorMahallaSummary: IRow[] = await Mahalla.aggregate([
      {
        $match: {
          companyId,
          biriktirilganNazoratchi: { $exists: true },
          "biriktirilganNazoratchi.inspactor_id": { $exists: true, $ne: null },
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

    if (inspectorMahallaSummary.length === 0) throw "mahallalar topilmadi";

    // 2) Mahallalar tushumini olish
    const mahallaTushum = await getReportsPaymentpartnersIncomes(tozaMakonApi, {
      reportType: "MAHALLA",
      companyId,
      fromDate: formatDate(from),
      toDate: formatDate(to),
      districtId: company.districtId,
      regionId: company.regionId,
    });

    // 3) Mahallalar tushumini tushumlar ro'yxatiga qo'shish
    mahallaTushum.forEach((m) => {
      const row = inspectorMahallaSummary.find((r) => r.mfy_ids.includes(m.id));
      if (row) {
        const ekopay = m.partnerTransactions.find((p) => p.partnerId === 7);
        row.ekopaySumma += ekopay?.transactionAmount || 0;
        row.count += ekopay?.transactionCount || 0;
      }
    });

    // 4) Tushumlarni summasi bo'yicha so'rtlash
    inspectorMahallaSummary.sort((a, b) => b.ekopaySumma - a.ekopaySumma);

    // 5) HTML hisobot shakllantirish
    const htmlString = await renderHtmlByEjs("nazoratchilarKunlikTushum.ejs", {
      sana: formatDate(new Date()),
      rows: inspectorMahallaSummary.map((r) => ({
        id: r._id,
        name: r.name,
        tushumSoni: r.count,
        summasi: r.ekopaySumma,
      })),
      jamiTushumSoni: inspectorMahallaSummary.reduce((a, b) => a + b.count, 0),
      jamiTushumSummasi: inspectorMahallaSummary.reduce(
        (a, b) => a + b.ekopaySumma,
        0
      ),
    });

    // 6) bot orqali nazoratchilar guruhiga yuborish
    const msg = await sendHtmlAsPhoto(
      { htmlString, selector: "div" },
      company.GROUP_ID_NAZORATCHILAR,
      // process.env.ME as string,
      {
        parse_mode: "HTML",
      }
    );

    // 7) Eski hisobotni o'chirish
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
