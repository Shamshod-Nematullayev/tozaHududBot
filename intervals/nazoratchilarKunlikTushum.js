const { Nazoratchi, bot } = require("../requires");
const ejs = require("ejs");
const generateImage = require("../helpers/puppeteer-wrapper");
const { ekopayApi } = require("../api/ekopayApi");

async function nazoratchilarKunlikTushum() {
  try {
    const date = new Date();
    const dateStr = `${date.getDate()}.${
      date.getMonth() + 1
    }.${date.getFullYear()}`;
    const { data } = await ekopayApi.get(
      `/ecopay/transaction-report;descending=false;page=1;perPage=100?parent_id=32&date_from=${dateStr}&date_to=${dateStr}&companies_id=1144&sys_companies_id=503`,
      {
        headers: {
          login: "dxsh24107",
        },
      }
    );
    const inspectors = await Nazoratchi.find({ activ: true });
    const now = new Date();
    const dateString = `${now.getFullYear()}.${
      now.getMonth() + 1
    }.${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    const rows = [];
    let [jamiTushumSoni, jamiTushumSummasi] = [0, 0];

    inspectors.forEach((inspector) => {
      const tushum = data.rows.find((elem) => elem.id === inspector.id);
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

module.exports = { nazoratchilarKunlikTushum };
