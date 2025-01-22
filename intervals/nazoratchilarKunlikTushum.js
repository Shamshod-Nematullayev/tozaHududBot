const {
  getTransactionsReportInspector,
} = require("../api/ekopay.uz/getTransactionsReportInspector");
const { Nazoratchi, bot } = require("../requires");
const ejs = require("ejs");
const generateImage = require("../helpers/puppeteer-wrapper");

async function nazoratchilarKunlikTushum() {
  try {
    const data = await getTransactionsReportInspector();
    const inspectors = await Nazoratchi.find({ activ: true });
    const now = new Date();
    const dateString = `${now.getFullYear()}.${
      now.getMonth() + 1
    }.${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    const rows = [];
    let [jamiTushumSoni, jamiTushumSummasi] = [0, 0];

    inspectors.forEach((inspector) => {
      const tushum = data.find((elem) => elem.id === inspector.id);
      if (!tushum)
        return rows.push({
          id: inspector.id,
          name: inspector.name,
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
    rows.sort((a, b) => parseFloat(b.summasi) - parseFloat(a.summasi));

    ejs.renderFile(
      "./views/nazoratchilarKunlikTushum.ejs",
      {
        sana: dateString,
        rows,
        jamiTushumSoni,
        jamiTushumSummasi,
      },
      async (err, str) => {
        if (err) throw err;
        const binaryData = await generateImage({
          html: str,
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
  } catch (err) {
    console.error(err);
  }
}

setInterval(() => {
  const now = new Date();
  if (now.getMinutes() === 0) {
    if (now.getHours() > 7 && now.getHours() < 20) {
      nazoratchilarKunlikTushum();
    }
  }
}, 1000 * 60);

module.exports = { nazoratchilarKunlikTushum };
