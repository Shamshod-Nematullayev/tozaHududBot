const nodeHtmlToImage = require("node-html-to-image");
const { getTransactionMFY } = require("../api/ekopay.uz/getTransactionsMFY");
const { Mahalla } = require("../models/Mahalla");
const ejs = require("ejs");
const { bot } = require("../requires");

async function sendMFYIncomeReport(ctx = false) {
  try {
    const incomesFromEkopay = await getTransactionMFY();
    const mahallalar = await Mahalla.find();
    const datas = [];
    const now = new Date();
    mahallalar.forEach((mahalla) => {
      const row = incomesFromEkopay.find((a) => a.id == mahalla.id);
      if (mahalla?.reja > 0) {
        datas.push({
          id: mahalla.id,
          xisoblandi: mahalla.reja,
          name: mahalla.name,
          tushum: row ? Number(row.all_transactions_sum) : 0,
          nazoratchi: mahalla.biriktirilganNazoratchi,
        });
      }
    });
    // Tayyor array bilan hisobotni chizish
    let jamiXisoblandi = 0;
    let jamiTushum = 0;
    datas.sort(
      (a, b) =>
        parseFloat(b.tushum / b.xisoblandi) -
        parseFloat(a.tushum / a.xisoblandi)
    );
    datas.forEach((mfy) => {
      jamiXisoblandi += mfy.xisoblandi;
      jamiTushum += mfy.tushum;
    });
    const sana = `${now.getDate()} ${
      now.getMonth() + 1
    } ${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;

    ejs.renderFile(
      "./views/mfyIncome.ejs",
      { data: datas, jamiTushum, jamiXisoblandi, sana },
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

        if (ctx) return ctx.replyWithPhoto({ source: buffer });
        else
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
    console.error(new Error(err));
  }
}

setInterval(() => {
  const now = new Date();
  const hour = now.getHours();
  const minut = now.getMinutes();
  if (minut === 0) {
    if (hour > 7 && hour < 20) {
      sendMFYIncomeReport();
    }
  }
}, 1000 * 60);
