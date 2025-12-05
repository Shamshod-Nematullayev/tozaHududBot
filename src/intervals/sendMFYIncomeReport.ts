import { Company } from "@models/Company.js";

import { createTozaMakonApi } from "../api/tozaMakon.js";

import { kirillga } from "@bot/middlewares/smallFunctions/lotinKiril.js";
import { renderHtmlByEjs } from "@helpers/renderHtmlByEjs.js";
import { sendHtmlAsPhoto } from "@helpers/sendHtmlAsPhoto.js";
import { deletePreviousReport } from "@bot/helpers/deletePreviousReport.js";
import { ReportType } from "@models/ReportsMessage.js";
import { getReportsPaymentpartnersIncomes } from "@services/billing/getReportsPaymentpartnersIncomes.js";

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export async function sendMFYIncomeReport(
  companyId = 1144,
  onlyEkopay = false,
  onlyToday = false,
  deleteLastReport = true
) {
  try {
    const now = new Date();
    const company = await Company.findOne({ id: companyId });
    if (!company) throw new Error("Company not found");
    const tozaMakonApi = createTozaMakonApi(companyId);
    let incomesFromEkopay: any;
    if (onlyEkopay) {
      incomesFromEkopay = await getReportsPaymentpartnersIncomes(tozaMakonApi, {
        reportType: "MAHALLA",
        companyId,
        regionId: company.regionId,
        districtId: company.districtId,
        fromDate: formatDate(
          new Date(
            now.getFullYear(),
            now.getMonth(),
            onlyToday ? now.getDate() : 1
          )
        ),
        toDate: formatDate(now),
      });
    }

    let allAccrual = 0;
    let allTransactionAmount = 0;
    const sana = `${now.getDate()} ${
      now.getMonth() + 1
    } ${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;

    console.log(
      formatDate(
        new Date(
          now.getFullYear(),
          now.getMonth(),
          onlyToday ? now.getDate() : 1
        )
      )
    );
    let mahallas: any[] = (
      await tozaMakonApi.get("/report-service/reports/v2/mfa-16", {
        params: {
          companyId: companyId,
          regionId: company.regionId,
          districtId: company.districtId,
          dateFrom: formatDate(
            new Date(
              now.getFullYear(),
              now.getMonth(),
              onlyToday ? now.getDate() : 1
            )
          ),
          dateTo: formatDate(now),
          period: `${now.getMonth() + 1}.${now.getFullYear()}`,
        },
      })
    ).data;
    mahallas = mahallas.map((mfy) => {
      let income = 0;
      if (onlyEkopay) {
        income = incomesFromEkopay
          .find((item: any) => item.id == mfy.id)
          .partnerTransactions.find(
            (elem: any) => elem.partnerName == "EcoPay"
          ).transactionAmount;
      } else {
        income = mfy.totalAmount;
      }
      allAccrual += mfy.totalAccrual;
      allTransactionAmount += income;
      return {
        id: mfy.id,
        xisoblandi: mfy.totalAccrual,
        name: kirillga(mfy.name.split("(")[0]),
        tushum: income,
      };
    });
    mahallas = mahallas.filter((item) => item.xisoblandi);
    mahallas.sort(
      (a, b) =>
        parseFloat(String(b.tushum / b.xisoblandi)) -
        parseFloat(String(a.tushum / a.xisoblandi))
    );

    const htmlString = await renderHtmlByEjs("mfyIncome.ejs", {
      data: mahallas,
      jamiTushum: allTransactionAmount,
      jamiXisoblandi: allAccrual,
      sana,
      company,
    });

    const msg = await sendHtmlAsPhoto(
      { htmlString, selector: "div" },
      company.GROUP_ID_NAZORATCHILAR,
      {
        parse_mode: "HTML",
        disable_notification: true,
      }
    );
    if (deleteLastReport)
      await deletePreviousReport(
        companyId,
        ReportType.sendMFYIncomeReport,
        msg
      );
  } catch (err) {
    console.error(err);
  }
}
