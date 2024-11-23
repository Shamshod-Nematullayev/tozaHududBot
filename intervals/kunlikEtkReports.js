const nodeHtmlToImage = require("node-html-to-image");
const { Abonent, Nazoratchi, bot } = require("../requires");
const ejs = require("ejs");
const { EtkKodRequest } = require("../models/EtkKodRequest");

// small function
function bugungiSana() {
  const date = new Date();
  return `${date.getDate()}.${
    date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
  }.${date.getFullYear()}`;
}

//   main function

async function sendKunlikEtkReports() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    // const abonents = await Abonent.find({
    //   "ekt_kod_tasdiqlandi.confirm": true,
    //   "ekt_kod_tasdiqlandi.updated_at": { $gt: today },
    // });
    const abonents = await EtkKodRequest.find({
      update_at: { $gt: today },
    });
    const soatlik = abonents.filter(
      (abonent) => new Date(abonent.update_at) > oneHourAgo
    );
    let inspectors = await Nazoratchi.find({ activ: true });
    inspectors.forEach((nazoratchi) => {
      nazoratchi.counterOfConfirm = 0;
      nazoratchi.counterOfConfirmHourly = 0;
    });
    abonents.forEach((abonent) => {
      const nazoratchi = inspectors.find(
        (nazoratchi) => nazoratchi.id == abonent.inspector_id
        // nazoratchi.id === abonent.ekt_kod_tasdiqlandi.inspector_id
      );
      if (nazoratchi) {
        nazoratchi.counterOfConfirm++;
      }
    });
    soatlik.forEach((abonent) => {
      const nazoratchi = inspectors.find(
        (nazoratchi) => nazoratchi.id == abonent.inspector_id
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
      "./views/kunlikMalumotKiritishHisoboti.ejs",
      {
        allConfirmed,
        allConfirmedHourly,
        inspectors,
        sana: bugungiSana(),
        report_name: "ETK Код киритиш",
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
        // console.log(inspectors);
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

setInterval(() => {
  const now = new Date();
  if (now.getMinutes() == 5) {
    if (now.getHours() > 7 && now.getHours() < 20) {
      sendKunlikEtkReports();
    }
  }
}, 1000 * 60);

module.exports = { sendKunlikEtkReports };
