import { Mahalla } from "@models/Mahalla.js";

import { Abonent } from "@models/Abonent.js";

import { Company } from "@models/Company.js";
import { renderHtmlByEjs } from "@helpers/renderHtmlByEjs.js";
import { sendHtmlAsPhoto } from "@helpers/sendHtmlAsPhoto.js";
import { deletePreviousReport } from "@bot/helpers/deletePreviousReport.js";
import { ReportType } from "@models/ReportsMessage.js";

function bugungiSana() {
  const date = new Date();
  return `${date.getDate()}.${
    date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
  }.${date.getFullYear()}`;
}

/**
 * Sends a report of ETK code entries for a specified company.
 *
 * This function fetches all mahallas with a plan greater than zero for the given company.
 * It then calculates the total number of abonents and the number of abonents that have
 * confirmed ETK codes for each mahalla. The data is used to generate an HTML report
 * that is sent as a photo to the company's group of inspectors.
 *
 * @param {number} [companyId=1144] - The ID of the company for which the report is generated.
 * @throws Will throw an error if the company is not found.
 */

export const sendEtkMfyReport = async (companyId = 1144) => {
  try {
    const company = await Company.findOne({ id: companyId });
    if (!company) throw new Error("Company not found");
    const mahallas = await Mahalla.find({ reja: { $gt: 0 }, companyId });
    const rows: any[] = [];
    for (const mfy of mahallas) {
      const abonentsCount = await Abonent.countDocuments({
        mahallas_id: mfy.id,
        companyId,
      });
      const etkConfirmedAbonentsCount = await Abonent.countDocuments({
        "ekt_kod_tasdiqlandi.confirm": true,
        mahallas_id: mfy.id,
        companyId,
      });
      rows.push({
        // ...mfy,
        name: mfy.name,
        id: mfy.id,
        shaxsi_tasdiqlandi_reja: abonentsCount, // jami abonentlar
        counterOfConfirm: etkConfirmedAbonentsCount,
        procent: (etkConfirmedAbonentsCount / abonentsCount) * 100,
        farqi: etkConfirmedAbonentsCount - abonentsCount,
      });
    }
    let jamiKiritilgan = 0;
    let jamiReja = 0;
    rows.sort((a, b) => b.procent - a.procent);
    rows.forEach((row) => {
      jamiKiritilgan += row.counterOfConfirm;
      jamiReja += row.shaxsi_tasdiqlandi_reja;
      row.bajarilishi_foizda = Math.floor(row.procent) + " %";
    });

    const htmlString = await renderHtmlByEjs("pnfilKiritishHisobot.ejs", {
      data: rows,
      jamiKiritilgan,
      heading: "ЭТК код киритиш хисоботи",
      jamiReja,
      sana: bugungiSana(),
    });

    const msg = await sendHtmlAsPhoto(
      { htmlString, selector: "div" },
      company.GROUP_ID_NAZORATCHILAR,
      {
        parse_mode: "HTML",
      }
    );

    await deletePreviousReport(companyId, ReportType.sendEtkMfyReport, msg);
  } catch (error) {
    console.error(error);
  }
};
