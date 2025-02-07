const nodeHtmlToImage = require("../helpers/puppeteer-wrapper");
const { Mahalla } = require("../models/Mahalla");
const { Abonent, bot } = require("../requires");
const ejs = require("ejs");

function bugungiSana() {
  const date = new Date();
  return `${date.getDate()}.${
    date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
  }.${date.getFullYear()}`;
}

async function sendPinflMfyReport() {
  try {
    const abonents = await Abonent.find({ "shaxsi_tasdiqlandi.confirm": true });
    const countOfAbonents = await Abonent.find().select(["mahallas_id"]);
    let mahallalar = await Mahalla.find({ reja: { $gt: 0 } });
    mahallalar.forEach(async (mfy) => {
      mfy.counterOfConfirm = 0;
      mfy.shaxsi_tasdiqlandi_reja = countOfAbonents.filter(
        (item) => item.mahallas_id == mfy.id
      ).length;
    });
    abonents.forEach((abonent) => {
      const mfy = mahallalar.find((mfy) => mfy.id === abonent.mahallas_id);
      if (mfy) {
        mfy.counterOfConfirm++;
      }
    });
    mahallalar = mahallalar.map((mfy) => ({
      name: mfy.name,
      counterOfConfirm: mfy.counterOfConfirm,
      shaxsi_tasdiqlandi_reja: mfy.shaxsi_tasdiqlandi_reja,
      bajarilishi_foizda: `${Math.floor(
        (mfy.counterOfConfirm / mfy.shaxsi_tasdiqlandi_reja) * 100
      )}%`,
      procent: mfy.counterOfConfirm / mfy.shaxsi_tasdiqlandi_reja,
      farqi: mfy.counterOfConfirm - mfy.shaxsi_tasdiqlandi_reja,
    }));
    let jamiReja = 0;
    let jamiKiritilgan = 0;
    mahallalar.forEach((mfy) => {
      jamiKiritilgan += mfy.counterOfConfirm;
      jamiReja += mfy.shaxsi_tasdiqlandi_reja;
    });
    mahallalar.sort((a, b) => b.procent - a.procent);

    ejs.renderFile(
      "./views/pnfilKiritishHisobot.ejs",
      {
        data: mahallalar,
        jamiKiritilgan,
        heading: "ПИНФЛ киритиш бўйича режа таҳлили",
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
}

module.exports = { sendPinflMfyReport };
