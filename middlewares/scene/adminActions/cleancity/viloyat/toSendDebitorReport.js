const { CleanCitySession } = require("../../../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const fs = require("fs");
const ejs = require("ejs");
const nodeHtmlToImage = require("node-html-to-image");
const { bot } = require("../../../../../core/bot");
const path = require("path");

const cc = "https://cleancity.uz";
const toSendDebitor = async (ctx) => {
  const session = await CleanCitySession.findOne({ type: "stm_reports" });
  const res = await fetch(cc + "/startpage", {
    headers: {
      Cookie: session.cookie,
    },
  });
  const startpage = new JSDOM(await res.text()).window.document;
  if (
    startpage.querySelector(
      "#g_acccordion > div > div > ul > li:nth-child(1) > a"
    ) == undefined
  ) {
    // bot.telegram.sendMessage(
    //   5347896070,
    //   `Xukmdorim viloyat debitor reja tashlash bo'yicha Cookie va Xenc yo'li boy berildi`
    // );
    return [];
  }
  const dxsh1Url = startpage.querySelector(
    "#g_acccordion > div > div > ul > li:nth-child(1) > a"
  ).href;
  const res2 = await fetch(`${cc}/startpage${dxsh1Url}`, {
    headers: {
      Cookie: session.cookie,
    },
  });
  const text = await res2.text();
  const date = new Date();
  const data = await fetch(
    `${cc}/${text.match(/url:\s*'([^']+)'/g)[1].split("'")[1]}`,
    {
      headers: {
        Cookie: session.cookie,
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: `mes=${
        date.getMonth() + 1
      }&god=${date.getFullYear()}&gov_level=1&gov_level_two=1&mv_refresh_filter=0&page=1&rows=30&sort=a.id&order=asc`,
      method: "POST",
    }
  );
  const { rows } = await data.json();
  return rows;
};

const drawDebitViloyat = async (sendingType) => {
  let rows = await toSendDebitor();
  if (rows.length == 0) {
    return;
  }
  const date = new Date();
  let jamiDebitN = 0;
  let jamiDebitK = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    jamiDebitK += parseInt(row.debet_k);
    jamiDebitN += parseInt(row.debet_n);
  }
  rows = rows.sort((a, b) => b.debet_k - b.debet_n - (a.debet_k - a.debet_n));
  let html = "";
  ejs.renderFile(
    path.join(__dirname, "../../../../../", "views", "viloyatdebitor.ejs"),
    {
      data: rows,
      date,
      jamiDebitN,
      jamiDebitK,
    },
    {},
    (err, str) => {
      console.log(err);
      html = str;
    }
  );
  // jamiDebitN JamiDebitK date
  nodeHtmlToImage({
    output: "debitorviloyat.png",
    html,
    selector: "div",
    type: "png",
  }).finally(async () => {
    switch (sendingType) {
      case "toViloyat":
        await bot.telegram.sendPhoto(process.env.STM_GROUP_ID, {
          source: "debitorviloyat.png",
        });
        await bot.telegram.sendPhoto(process.env.TOZAHUDUD_GR_ID, {
          source: "debitorviloyat.png",
        });
        await bot.telegram.sendPhoto(process.env.ANVARJON_BZ_GR_ID, {
          source: "debitorviloyat.png",
        });
        fs.unlink("debitorviloyat.png", (err) => {});
        break;
      case "toMySelf":
        await bot.telegram.sendPhoto(5347896070, {
          source: "debitorviloyat.png",
        });

        fs.unlink("debitorviloyat.png", (err) => {});

        break;
    }
  });
};

module.exports = { toSendDebitor, drawDebitViloyat };
