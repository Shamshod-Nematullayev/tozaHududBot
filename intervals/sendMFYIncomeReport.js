const nodeHtmlToImage = require("../helpers/puppeteer-wrapper");
const ejs = require("ejs");
const { bot, Company } = require("../requires");
const { createTozaMakonApi } = require("../api/tozaMakon");
const { kirillga } = require("../middlewares/smallFunctions/lotinKiril");
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

async function sendMFYIncomeReport(companyId = 1144, ctx = false) {
  try {
    const now = new Date();
    const company = await Company.findOne({ id: companyId });
    const tozaMakonApi = createTozaMakonApi(companyId);
    const incomesFromEkopay = (
      await tozaMakonApi.get(
        "/billing-service/reports/payment-partners/incomes",
        {
          params: {
            reportType: "MAHALLA",
            companyId: companyId, // hozircha hard kod
            regionId: 5,
            districtId: 47,
            fromDate: formatDate(
              new Date(now.getFullYear(), now.getMonth(), 1)
            ),
            toDate: formatDate(now),
          },
        }
      )
    ).data;

    let allAccrual = 0;
    let allTransactionAmount = 0;
    const sana = `${now.getDate()} ${
      now.getMonth() + 1
    } ${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
    let mahallas = (
      await tozaMakonApi.get("/report-service/reports/mfa-16", {
        params: {
          companyId: companyId,
          regionId: 5,
          districtId: 47,
          dateFrom: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
          dateTo: formatDate(now),
          period: `${now.getMonth() + 1}.${now.getFullYear()}`,
        },
      })
    ).data;
    mahallas = mahallas.map((mfy) => {
      allAccrual += mfy.totalAccrual;
      allTransactionAmount += incomesFromEkopay
        .find((item) => item.id == mfy.id)
        .partnerTransactions.find(
          (elem) => elem.partnerName == "EcoPay"
        ).transactionAmount;
      return {
        id: mfy.id,
        xisoblandi: mfy.totalAccrual,
        name: kirillga(mfy.name.split("(")[0]),
        tushum: incomesFromEkopay
          .find((item) => item.id == mfy.id)
          .partnerTransactions.find((elem) => elem.partnerName == "EcoPay")
          .transactionAmount,
      };
    });
    mahallas = mahallas.filter((item) => item.xisoblandi);
    mahallas.sort(
      (a, b) =>
        parseFloat(b.tushum / b.xisoblandi) -
        parseFloat(a.tushum / a.xisoblandi)
    );
    ejs.renderFile(
      "./views/mfyIncome.ejs",
      {
        data: mahallas,
        jamiTushum: allTransactionAmount,
        jamiXisoblandi: allAccrual,
        sana,
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

        if (ctx) return ctx.replyWithPhoto({ source: buffer });
        else
          bot.telegram.sendPhoto(
            company.GROUP_ID_NAZORATCHILAR,
            // process.env.ME,
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
module.exports = { sendMFYIncomeReport };
