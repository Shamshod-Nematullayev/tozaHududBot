import nodeHtmlToImage from "../helpers/puppeteer-wrapper.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { Abonent } from "@models/Abonent.js";
import { Company } from "@models/Company.js";
import { bot } from "@bot/core/bot.js";

import ejs from "ejs";
import path from "path";

// small function
function bugungiSana() {
  const date = new Date();
  return `${date.getDate()}.${
    date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
  }.${date.getFullYear()}`;
}

//   main function

export async function sendKunlikPhoneReports(
  companyId = 1144,
  isXatlovchi = false
) {
  try {
    const company = await Company.findOne({ id: companyId });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const abonents = await Abonent.find({
      "phone_tasdiqlandi.confirm": true,
      "phone_tasdiqlandi.updated_at": { $gt: today },
    });
    const soatlik = abonents.filter(
      (abonent) => new Date(abonent.phone_tasdiqlandi.updated_at) > oneHourAgo
    );
    let filters = { activ: true, companyId };
    if (isXatlovchi) filters = { ...filters, isXatlovchi: true };
    let inspectors = await Nazoratchi.find(filters);

    abonents.forEach((abonent) => {
      const nazoratchi = inspectors.find(
        (nazoratchi) => nazoratchi.id == abonent.phone_tasdiqlandi.inspector_id
      );
      if (nazoratchi) {
        if (!nazoratchi.counterOfConfirm) {
          nazoratchi.counterOfConfirm = 1;
        } else {
          nazoratchi.counterOfConfirm++;
        }
      }
    });
    soatlik.forEach((abonent) => {
      const nazoratchi = inspectors.find(
        (nazoratchi) => nazoratchi.id == abonent.inspector_id
      );
      if (nazoratchi) {
        if (!nazoratchi.counterOfConfirmHourly) {
          nazoratchi.counterOfConfirmHourly = 1;
        } else {
          nazoratchi.counterOfConfirmHourly++;
        }
      }
    });
    inspectors = inspectors.map((inspector) => ({
      name: inspector.name,
      counterOfConfirm: inspector.counterOfConfirm || 0,
      counterOfConfirmHourly: inspector.counterOfConfirmHourly || 0,
    }));
    inspectors.sort(
      (inspector1, inspector2) =>
        inspector2.counterOfConfirm - inspector1.counterOfConfirm
    );

    let allConfirmed = 0;
    let allConfirmedHourly = 0;
    inspectors.forEach((inspector) => {
      allConfirmed += inspector.counterOfConfirm;
      allConfirmedHourly += inspector.counterOfConfirmHourly;
    });

    ejs.renderFile(
      path.join(
        process.cwd(),
        "src",
        "views",
        "kunlikMalumotKiritishHisoboti.ejs"
      ),
      {
        allConfirmed,
        allConfirmedHourly,
        inspectors,
        sana: bugungiSana(),
        report_name: "Телефон рақам киритиш",
      },
      async (err, res) => {
        if (err) throw err;

        const binaryData = await nodeHtmlToImage({
          html: res,
          type: "png",
          encoding: "binary",
          selector: "div",
        });
        const buffer = Buffer.from(binaryData, "binary");

        bot.telegram.sendPhoto(
          process.env.NODE_ENV == "production"
            ? company.GROUP_ID_NAZORATCHILAR
            : process.env.ME,
          { source: buffer },
          {
            caption: `Coded by <a href="https://t.me/oliy_ong_leader">Oliy Ong</a>`,
            parse_mode: "HTML",
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
  }
}
