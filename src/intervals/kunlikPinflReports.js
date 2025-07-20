import nodeHtmlToImage from "../helpers/puppeteer-wrapper.js";
import { Abonent } from "@models/Abonent.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
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

export async function sendKunlikPinflReports(companyId = 1144) {
  try {
    const company = await Company.findOne({ id: companyId });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const abonents = await Abonent.find({
      "shaxsi_tasdiqlandi.confirm": true,
      "shaxsi_tasdiqlandi.updated_at": { $gt: today },
      companyId,
    });
    const soatlik = abonents.filter(
      (abonent) => new Date(abonent.shaxsi_tasdiqlandi.updated_at) > oneHourAgo
    );
    let inspectors = await Nazoratchi.find({ activ: true, companyId });
    inspectors.forEach((nazoratchi) => {
      nazoratchi.counterOfConfirm = 0;
      nazoratchi.counterOfConfirmHourly = 0;
    });
    abonents.forEach((abonent) => {
      const nazoratchi = inspectors.find(
        (nazoratchi) =>
          nazoratchi._id.toString() ==
          abonent.shaxsi_tasdiqlandi.inspector._id.toString()
      );
      if (nazoratchi) {
        nazoratchi.counterOfConfirm++;
      }
    });
    soatlik.forEach((abonent) => {
      const nazoratchi = inspectors.find(
        (nazoratchi) =>
          nazoratchi._id.toString() ==
          abonent.shaxsi_tasdiqlandi.inspector._id.toString()
      );
      if (nazoratchi) {
        nazoratchi.counterOfConfirmHourly++;
      }
    });
    inspectors = inspectors.map((inspector) => ({
      name: inspector.name,
      counterOfConfirm: inspector.counterOfConfirm,
      counterOfConfirmHourly: inspector.counterOfConfirmHourly,
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
        report_name: "ПИНФЛ киритиш",
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

        return bot.telegram.sendPhoto(
          company.GROUP_ID_NAZORATCHILAR,
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
