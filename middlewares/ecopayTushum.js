const { fetchEcopayTushum, fetchEcoTranzaksiyalar } = require("./fetchEcopay");
const { drawAndSendTushum } = require("./drawTushum");
const {
  getAllWeekdaysInMonth,
} = require("./smallFunctions/getWeekDaysInMonth");
const nodeHtmlToImage = require("node-html-to-image");
const { bot } = require("../core/bot");
const path = require("path");
const { CleanCitySession } = require("../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const {
  drawDebitViloyat,
} = require("./scene/adminActions/cleancity/viloyat/toSendDebitorReport");
const fs = require("fs");
const {
  mfyIncomeReport,
} = require("./scene/adminActions/cleancity/dxsh/mfyIncomeReport");

const cc = "https://cleancity.uz";
let text = "";
const sendViloyatKunlikReja = async (resType, senderId) => {
  try {
    // hisobot olish xenc aniqlash
    const session = await CleanCitySession.findOne({ type: "stm_reports" });
    const res = await fetch(cc + "/startpage", {
      headers: {
        Cookie: session.cookie,
      },
    });

    const startpage = new JSDOM(await res.text()).window.document;
    console.log(
      startpage.querySelector(
        "#g_acccordion > div > div > ul > li:nth-child(13) > a"
      )
    );
    const tushumUrl = startpage.querySelector(
      "#g_acccordion > div > div > ul > li:nth-child(13) > a"
    ).href;

    const res2 = await fetch(`${cc}/startpage${tushumUrl}`, {
      headers: {
        Cookie: session.cookie,
      },
    });
    text = await res2.text();

    // Hisobotni keltirish
    const date = new Date();
    const headers = {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua":
        '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      Cookie: session.cookie,
    };

    const resReport = await fetch(
      `${cc}/${text.match(/url:\s*'([^']+)'/g)[1].split("'")[1]}`,
      {
        headers,
        body: `mes=${
          date.getMonth() + 1
        }&god=${date.getFullYear()}&from_day=${date.getDate()}&to_day=${date.getDate()}&gov_level=1&sort=id&order=asc`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      }
    );
    const data = await resReport.json();
    const newJSON = [];
    const weekdays = getAllWeekdaysInMonth(date.getMonth(), date.getFullYear());
    let viloyatRejasi = 0;
    let viloyatKunlikTushum = 0;
    let viloyatUmumiyTushum = 0;
    if (data.rows?.length < 1) {
      return bot.telegram.sendMessage(
        5347896070,
        `Xukmdorim viloyat kunlik reja tashlash bo'yicha Cookie va Xenc yo'li boy berildi`
      );
    }
    data.rows.forEach((row) => {
      viloyatRejasi += row.all_nachis / (weekdays - 2);
      viloyatKunlikTushum += parseInt(row.all_sum);
      newJSON.push({
        id: row.id,
        kunlikReja: row.all_nachis / (weekdays - 2), // -1 bir kun bayram borligi uchun
        birKunlikTushum: row.all_sum,
        foizda: Math.floor(
          (Number(row.all_sum) / (row.all_nachis / (weekdays - 2))) * 100
        ),
        name: row.name,
      });
    });

    const resUmumiy = await fetch(
      `${cc}/${text.match(/url:\s*'([^']+)'/g)[1].split("'")[1]}`,
      {
        headers,
        body: `mes=${
          date.getMonth() + 1
        }&god=${date.getFullYear()}&from_day=1&to_day=${date.getDate()}&gov_level=1&sort=id&order=asc`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      }
    );
    const dataOyBoshidan = await resUmumiy.json();
    dataOyBoshidan.rows.forEach((row) => {
      viloyatUmumiyTushum += parseInt(row.all_sum);
      newJSON.forEach((mfy, i) => {
        if (mfy.id === row.id) {
          newJSON[i].oyBoshidanTushum = row.all_sum;
        }
      });
    });
    newJSON.sort((a, b) => {
      return b.foizda - a.foizda;
    });
    let tableItems = ``;
    newJSON.forEach((mfy, i) => {
      tableItems += `<tr>
    <td style="text-align: center;">${i + 1}</td>
    <td>${mfy.name}</td>
    <td style="text-align: right;">${Math.floor(mfy.kunlikReja)
      .toLocaleString()
      .replace(/,/g, " ")}</td>
    <td style="text-align: right;">${parseInt(mfy.birKunlikTushum)
      .toLocaleString()
      .replace(/,/g, " ")}</td>
    <td class="${
      mfy.foizda > (viloyatKunlikTushum / viloyatRejasi) * 100 ||
      mfy.foizda > 100
        ? ""
        : "bad"
    }" style="text-align: center;" class="">${mfy.foizda} %</td>
    <td style="text-align: right;">${parseInt(mfy.oyBoshidanTushum)
      .toLocaleString()
      .replace(/,/g, " ")}</td>
</tr>`;
    });
    tableItems += `<tr>
<td colspan="2"><b>Вилоят бўйича жами</b></td>
<th>${parseInt(viloyatRejasi).toLocaleString().replace(/,/g, " ")}</th>
<th>${viloyatKunlikTushum.toLocaleString().replace(/,/g, " ")}</th>
<th style="text-align: center;">${Math.floor(
      (viloyatKunlikTushum / viloyatRejasi) * 100
    )}%</th>
<th>${viloyatUmumiyTushum.toLocaleString().replace(/,/g, " ")}</th>
</tr>`;
    await nodeHtmlToImage({
      output: "viloyatKunlikReja.png",
      type: "png",
      encoding: "binary",
      selector: "div",
      html: `<style>
* {
    font-family: Arial, Helvetica, sans-serif;
    font-size: large;
    font-weight: bold;
    margin: 0;
}

table {
    border-color: black;
    border-collapse: collapse;
}

th {
    background-color: rgb(255, 128, 128);
}
td{
  font-weight: bold;
  font-size: 17px;
  padding-bottom: 0;
}

.bad {
    background-color: rgb(255, 199, 206);
    color: rgb(156, 0, 6);
}
div{
  display: inline-block;
}

h3 {
    text-align: center;
    font-style: italic;
    padding: 10px;
    width: 670px;
}
</style>
<div>

  <h3>${date.getDate() > 9 ? date.getDate() : "0" + date.getDate()}.${
        date.getMonth() + 1 > 9 ? date.getMonth() + 1 : date.getMonth() + 1
      }.${date.getFullYear()} ${date.getHours()}:00 ҳолатига маиший чиқиндилар учун мажбурий тўловлар бўйича тезкор маълумот

  </h3>
  <table border="1" cellspacing="0" cellpadding="5">
      <tr>
          <th rowspan="2">№</th>
          <th rowspan="2">Туман ва шахарлар <br> номи</th>
          <th colspan="3">Бир кунлик</th>
          <th rowspan="2">Ой бошидан, <br> сўмда</th>
      </tr>
      <tr>
          <th style="width: 120px;">режа</th>
          <th style="width: 120px;">тушум</th>
          <th>бажарилиши <br> (%)</th>
      </tr>
${tableItems}
  </table>
</div>`,
    });
    if (resType == "test") {
      await bot.telegram
        .sendPhoto(senderId, {
          source: path.join(__dirname, "../viloyatKunlikReja.png"),
        })
        .finally(() => {
          fs.unlink(path.join(__dirname, "../viloyatKunlikReja.png"), (err) =>
            err ? console.log(err) : ""
          );
        });
      return;
    }
    await bot.telegram.sendPhoto(process.env.STM_GROUP_ID, {
      source: path.join(__dirname, "../viloyatKunlikReja.png"),
    });
    await bot.telegram.sendPhoto(process.env.TOZAHUDUD_GR_ID, {
      source: path.join(__dirname, "../viloyatKunlikReja.png"),
    });
    await bot.telegram
      .sendPhoto(process.env.ANVARJON_BZ_GR_ID, {
        source: path.join(__dirname, "../viloyatKunlikReja.png"),
      })
      .finally(() => {
        fs.unlink(path.join(__dirname, "../viloyatKunlikReja.png"), (err) =>
          err ? console.log(err) : ""
        );
      });
  } catch (error) {
    console.log(error);
    bot.telegram.sendMessage(5347896070, JSON.stringify(error));
  }
};

// VILOYATDA TUSHUMLAR
setInterval(async () => {
  const session = await CleanCitySession.findOne({ type: "stm_reports" });
  const headers = {
    accept: "application/json, text/javascript, */*; q=0.01",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "sec-ch-ua":
      '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
    Cookie: session.cookie,
  };
  const date = new Date();
  const soat = date.getHours();
  const minut = date.getMinutes();

  try {
    if (
      (soat == 9 && minut == 0) ||
      (soat == 10 && minut == 0) ||
      (soat == 11 && minut == 0) ||
      (soat == 12 && minut == 0) ||
      (soat == 13 && minut == 0) ||
      (soat == 14 && minut == 0) ||
      (soat == 15 && minut == 0) ||
      (soat == 16 && minut == 0) ||
      (soat == 17 && minut == 0) ||
      (soat == 18 && minut == 0) ||
      (soat == 19 && minut == 0) ||
      (soat == 21 && minut == 0) ||
      (soat == 22 && minut == 0) ||
      (soat == 23 && minut == 0)
    ) {
      drawDebitViloyat("toViloyat");
      if (soat < 22) {
        const data = await fetchEcopayTushum();
        mfyIncomeReport();
        drawAndSendTushum(data);
        fetchEcoTranzaksiyalar();
      }
      // sendViloyatKunlikReja();
    } else if (date.getMinutes() % 10 === 0) {
      if (text == undefined) {
        sendViloyatKunlikReja("test", 5347896070);
      }
      // if (!text.match(/url:\s*'([^']+)'/g))
      //   return bot.telegram.sendMessage(
      //     5347896070,
      //     `Xukmdorim viloyat kunlik reja tashlash bo'yicha Cookie va Xenc yo'li boy berildi`
      //   );
      const res = await fetch(
        `${cc}/${text.match(/url:\s*'([^']+)'/g)[1].split("'")[1]}`,
        {
          headers,
          body: `mes=${
            date.getMonth() + 1
          }&god=${date.getFullYear()}&from_day=${date.getDate()}&to_day=${date.getDate()}&gov_level=1&sort=id&order=asc`,
          method: "POST",
          mode: "cors",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!data.rows || data.rows.length < 1) {
        //bot.telegram.sendMessage(
        //  5347896070,
        //  `Xukmdorim viloyat kunlik reja tashlash bo'yicha Cookie va Xenc yo'li boy berildi`
        //);
      }
    }
  } catch (err) {
    console.log(err);
    // bot.telegram.sendMessage(5347896070, JSON.stringify(err));
  }
}, 60 * 1000);

bot.hears("lol", (ctx) => {
  try {
    sendViloyatKunlikReja("test", ctx.from.id);
  } catch (err) {
    console.log(err);
    ctx.reply(JSON.stringify(err));
  }
});
bot.hears("oliy", (ctx) => {
  try {
    // drawDebitViloyat("toViloyat");
    mfyIncomeReport();
    sendViloyatKunlikReja();
  } catch (err) {
    ctx.reply(JSON.stringify(err));
  }
});
bot.hears("oliy_ong", (ctx) => {
  try {
    mfyIncomeReport();
  } catch (err) {
    ctx.reply(JSON.stringify(err));
  }
});
