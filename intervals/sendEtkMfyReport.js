const { Mahalla } = require("../models/Mahalla");
const { Abonent } = require("../models/Abonent");
const ejs = require("ejs");
const nodeHtmlToImage = require("node-html-to-image");
const { bot } = require("../requires");

function bugungiSana() {
  const date = new Date();
  return `${date.getDate()}.${
    date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
  }.${date.getFullYear()}`;
}

const sendEtkMfyReport = async (companyId = 1144) => {
  try {
    const mahallas = await Mahalla.find({ reja: { $gt: 0 } });
    const rows = [];
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
    ejs.renderFile(
      "./views/pnfilKiritishHisobot.ejs",
      {
        data: rows,
        jamiKiritilgan,
        heading: "ЭТК код киритиш хисоботи",
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

        bot.telegram.sendPhoto(
          process.env.NAZORATCHILAR_GURUPPASI,
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
};
module.exports = { sendEtkMfyReport };
