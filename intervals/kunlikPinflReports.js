const nodeHtmlToImage = require("node-html-to-image");
const { Abonent, Nazoratchi, bot } = require("../requires");
const ejs = require("ejs");

// small function
function bugungiSana() {
  const date = new Date();
  return `${date.getDate()}.${
    date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
  }.${date.getFullYear()}`;
}

//   main function

async function sendKunlikPinflReports() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const abonents = await Abonent.find({
      "shaxsi_tasdiqlandi.confirm": true,
      "shaxsi_tasdiqlandi.updated_at": { $gt: today },
    });
    let inspectors = await Nazoratchi.find({ activ: true });
    inspectors.forEach((nazoratchi) => {
      nazoratchi.counterOfConfirm = 0;
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
    inspectors = inspectors.map((inspector) => ({
      name: inspector.name,
      counterOfConfirm: inspector.counterOfConfirm,
    }));
    inspectors.sort(
      (inspector1, inspector2) =>
        inspector2.counterOfConfirm - inspector1.counterOfConfirm
    );

    let allConfirmed = 0;
    inspectors.forEach((inspector) => {
      allConfirmed += inspector.counterOfConfirm;
    });

    ejs.renderFile(
      "./views/kunlikMalumotKiritishHisoboti.ejs",
      {
        allConfirmed,
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
      sendKunlikPinflReports();
    }
  }
}, 1000 * 60);

module.exports = { sendKunlikPinflReports };
