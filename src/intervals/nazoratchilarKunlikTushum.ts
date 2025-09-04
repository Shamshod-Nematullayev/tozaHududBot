import { bot } from "@bot/core/bot.js";
import { Company } from "@models/Company.js";
import { Nazoratchi } from "@models/Nazoratchi.js";

import ejs from "ejs";
import generateImage from "../helpers/puppeteer-wrapper.js";
import { ekopayApi } from "../api/ekopayApi.js";
import path from "path";
import { getIncomeReportFromInspectors } from "@services/ekopay.js";
import { ReportsMessage, ReportType } from "@models/ReportsMessage.js";
import { renderHtmlByEjs } from "@helpers/renderHtmlByEjs.js";
import { sendHtmlAsPhoto } from "@helpers/sendHtmlAsPhoto.js";
import { deletePreviousReport } from "@bot/helpers/deletePreviousReport.js";
import { kirillga } from "@bot/middlewares/smallFunctions/lotinKiril.js";

function formatName(name: string) {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateTimeToString(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Sends a report about inspectors' daily income to the specified company's
 * nazoratchilar group.
 * @param {number} [companyId=1144] The company ID to send the report to.
 * @returns {Promise<void>}
 */
export async function nazoratchilarKunlikTushum(companyId = 1144) {
  try {
    const company = await Company.findOne({ id: companyId });
    if (!company) throw "Company not found";
    const report = await getIncomeReportFromInspectors(ekopayApi);
    let inspectors = await Nazoratchi.find({
      activ: true,
      companyId,
      dontShowOnReport: { $ne: true },
    });

    let [jamiTushumSoni, jamiTushumSummasi] = [0, 0];
    let rows: {
      id: string;
      name: string;
      tushumSoni: number;
      summasi: number;
    }[] = [];
    inspectors.forEach((inspector) => {
      const tushum = report.find((elem) => elem.id === inspector.id);
      if (!tushum)
        return rows.push({
          id: inspector.id,
          name: formatName(kirillga(inspector.name)),
          tushumSoni: 0,
          summasi: 0,
        });
      jamiTushumSoni += tushum.accepted_transactions_count;
      jamiTushumSummasi += tushum.accepted_transactions_sum;
      rows.push({
        id: inspector.id,
        name: inspector.name,
        tushumSoni: tushum.accepted_transactions_count,
        summasi: tushum.accepted_transactions_sum,
      });
    });
    rows.sort((a, b) => b.summasi - a.summasi);

    const htmlString = await renderHtmlByEjs("nazoratchilarKunlikTushum.ejs", {
      sana: formatDateTimeToString(new Date()),
      rows,
      jamiTushumSoni,
      jamiTushumSummasi,
    });

    const msg = await sendHtmlAsPhoto(
      { htmlString, selector: "div" },
      company.GROUP_ID_NAZORATCHILAR,
      {
        parse_mode: "HTML",
      }
    );

    await deletePreviousReport(
      companyId,
      ReportType.nazoratchilarKunlikTushum,
      msg
    );
  } catch (err) {
    console.error(err);
  }
}
