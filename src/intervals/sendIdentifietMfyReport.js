import nodeHtmlToImage from "node-html-to-image";
import { createTozaMakonApi } from "../api/tozaMakon.js";

import { Company } from "@models/Company.js";
import { bot } from "@bot/core/bot.js";

import ejs from "ejs";
import path from "path";

function addZero(number) {
  if (number < 10) {
    return "0" + number;
  }
  return number;
}
function dateToFormatStr(date = new Date()) {
  const day = addZero(date.getDate());
  const month = addZero(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}
function bugungiSana() {
  const date = new Date();
  return `${date.getDate()}.${
    date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
  }.${date.getFullYear()}`;
}

export async function sendIdentifietMfyReport(companyId) {
  console.log("keldi");
  try {
    const company = await Company.findOne({ id: companyId });
    if (!company)
      throw new Error(
        "sendIdentifietMfyReport: Bunday id raqamga ega kompaniya topilmadi. id: " +
          companyId
      );

    const now = new Date();
    const tozaMakonApi = createTozaMakonApi(companyId);
    const rows = (
      await tozaMakonApi.get(
        "/report-service/reports/resident-identifications",
        {
          params: {
            companyId,
            dateFrom: dateToFormatStr(
              new Date(now.getFullYear(), now.getMonth(), 1)
            ),
            dateTo: dateToFormatStr(new Date()),
          },
        }
      )
    ).data;

    let jamiKiritilgan = 0,
      jamiReja = 0;
    const data = [];
    for (let row of rows) {
      jamiKiritilgan += row.totalIdentifiedCount;
      jamiReja += row.residentCount;
      data.push({
        ...row,
        name: row.name.split(" MFY")[0],
        counterOfConfirm: row.totalIdentifiedCount,
        shaxsi_tasdiqlandi_reja: row.residentCount,
        bajarilishi_foizda: `${Math.floor(
          (row.totalIdentifiedCount / row.residentCount) * 100
        )}%`,
        procent: row.totalIdentifiedCount / row.residentCount,
        farqi: row.totalIdentifiedCount - row.residentCount,
      });
    }
    data.sort((a, b) => b.procent - a.procent);

    ejs.renderFile(
      path.join(process.cwd(), "src", "views", "pnfilKiritishHisobot.ejs"),
      {
        heading: "Идентификацияланган абонентлар ҳисоботи",
        data,
        jamiKiritilgan,
        jamiReja,
        sana: bugungiSana(),
      },
      {},
      async (err, res) => {
        if (err) throw err;

        const binaryData = await nodeHtmlToImage({
          html: res,
          type: "png",
          encoding: "binary",
          selector: "div",
        });
        const buffer = Buffer.from(binaryData, "binary");

        try {
          await bot.telegram.sendPhoto(
            company.GROUP_ID_NAZORATCHILAR,
            // process.env.ME,
            { source: buffer },
            {
              caption: `Coded by <a href="https://t.me/oliy_ong_leader">Oliy Ong</a>`,
              parse_mode: "HTML",
            }
          );
        } catch (error) {
          console.error(company.GROUP_ID_NAZORATCHILAR, error.message);
        }
      }
    );
  } catch (error) {
    console.error(error.message);
  }
}
