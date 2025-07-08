import nodeHtmlToImage from "../helpers/puppeteer-wrapper";
import { bot } from "bot/core/bot";
import { Abonent } from "@models/Abonent";
import { Nazoratchi } from "@models/Nazoratchi";
import { Company } from "@models/Company";
import ejs from "ejs";
import { NewAbonent } from "@models/NewAbonents";

function bugungiSana() {
  const date = new Date();
  return `${date.getDate()}.${
    date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
  }.${date.getFullYear()}`;
}
async function xatlovchilarIshiHisobot(companyId = 1144) {
  try {
    const company = await Company.findOne({ id: 1144 });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inspectors = await Nazoratchi.find({
      companyId,
      activ: true,
      isXatlovchi: true,
    }).lean();
    const abonents = await Abonent.find({
      companyId,
      $or: [
        { "ekt_kod_tasdiqlandi.updated_at": { $gt: today } },
        { "shaxsi_tasdiqlandi.updated_at": { $gt: today } },
        { "phone_tasdiqlandi.updated_at": { $gt: today } },
      ],
    }).select([
      "ekt_kod_tasdiqlandi",
      "shaxsi_tasdiqlandi",
      "phone_tasdiqlandi",
    ]);
    const newAbonents = await NewAbonent.find({
      companyId,
      createdAt: { $gt: today },
      // status: "approved",
      nazoratchi_id: {
        $in: inspectors.map((inspector) => String(inspector.id)),
      },
    }).select("nazoratchi_id");
    const inspectorMap = new Map();
    inspectors.forEach((inspector) => {
      inspector.etkKod = 0;
      inspector.pinfl = 0;
      inspector.phone = 0;
      inspector.newAbonent = 0;
      inspector.ball = 0;
      inspectorMap.set(String(inspector.id), inspector);
    });

    for (let abonent of abonents) {
      if (abonent.ekt_kod_tasdiqlandi?.confirm) {
        const inspector = inspectorMap.get(
          String(abonent.ekt_kod_tasdiqlandi.inspector_id)
        );
        if (inspector) inspector.etkKod += 1;
      }
      if (abonent.shaxsi_tasdiqlandi?.confirm) {
        const ins = inspectors.find(
          (i) => i._id == abonent.shaxsi_tasdiqlandi.inspector._id
        );

        if (ins) {
          const inspector = inspectorMap.get(String(ins.id));
          if (inspector) inspector.pinfl += 1;
        }
      }
      if (abonent.phone_tasdiqlandi?.confirm) {
        const inspector = inspectorMap.get(
          String(abonent.phone_tasdiqlandi.inspector_id)
        );
        if (inspector) inspector.phone += 1;
      }
    }

    // newAbonent bo‘yicha hisoblash
    for (let newAbonent of newAbonents) {
      const inspector = inspectorMap.get(String(newAbonent.nazoratchi_id));
      if (inspector) inspector.newAbonent += 1;
    }

    // Ballarni hisoblash
    inspectors.forEach((inspector) => {
      inspector.ball =
        inspector.etkKod +
        inspector.pinfl +
        inspector.phone +
        inspector.newAbonent;
    });

    inspectors.sort((a, b) => b.ball - a.ball);
    const res = await ejs.renderFile("./views/xatlovchilarIshiHisobot.ejs", {
      sana: bugungiSana(),
      inspectors,
    });
    const binaryData = await nodeHtmlToImage({
      html: res,
      type: "png",
      encoding: "binary",
      selector: "div",
    });
    const buffer = Buffer.from(binaryData, "binary");
    console.log(process.env.ME);
    bot.telegram.sendPhoto(
      company.GROUP_ID_XATLOVCHILAR,
      // process.env.ME,
      { source: buffer },
      {
        caption: `Coded by <a href="https://t.me/oliy_ong_leader">Oliy Ong</a>`,
        parse_mode: "HTML",
      }
    );
  } catch (error) {
    console.error(error);
  }
}

export default xatlovchilarIshiHisobot;
