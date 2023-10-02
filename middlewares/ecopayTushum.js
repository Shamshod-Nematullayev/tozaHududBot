const { fetchEcopayTushum, fetchEcoTranzaksiyalar } = require("./fetchEcopay");
const { drawAndSendTushum } = require("./drawTushum");
const {
  getAllWeekdaysInMonth,
} = require("./smallFunctions/getWeekDaysInMonth");
const nodeHtmlToImage = require("node-html-to-image");
const { bot } = require("../core/bot");
const path = require("path");

// har besh daqiqada ecopay session saqlash uchun fetch yuboradigan funksiya
// setInterval(async () => {
//   console.log({ tushum: await fetchEcopayTushum() });
// }, 0600 * 60 * 1000);
// fetchEcopayLogin();

// Har yarim soatda tushumni telegramga tashlaydigan funksiya
setInterval(async () => {
  let vaqt = new Date();
  if (vaqt.getHours() > 19 && vaqt.getHours < 6) {
  } else {
    const data = await fetchEcopayTushum();
    drawAndSendTushum(data);
    fetchEcoTranzaksiyalar();
  }
}, 60 * 1000 * 60);

const COOKIE = `793AA9E94A5319B8DF8F262B7D5F58E6.thweb6`;
const XENC = `wpcoI7nL81kbBIfPZwFLTwQWvIFvJxDiJ5f8sxqIGmBIt6EwWJN3yt_POa278nZ59snKiFJiWu4hPKVGYR7nvCxD_Ipl9FegWK89vcTNAwKwbcOSpvZAUg5oVZInvjb3`;
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
  Cookie: "JSESSIONID=" + COOKIE,
};
// VILOYATDA TUSHUMLAR
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
(async () => {
  try {
    const res = await fetch("https://cleancity.uz/ds?xenc=" + XENC, {
      headers,
      body: "mes=9&god=2023&from_day=30&to_day=30&gov_level=1&sort=id&order=asc",
      method: "POST",
      mode: "cors",
      credentials: "include",
    });
    const data = await res.json();
    const newJSON = [];
    const date = new Date();
    const weekdays = getAllWeekdaysInMonth(date.getMonth(), date.getFullYear());
    let viloyatRejasi = 0;
    let viloyatKunlikTushum = 0;
    let viloyatUmumiyTushum = 0;
    data.rows.forEach((row) => {
      viloyatRejasi += row.all_nachis / weekdays;
      viloyatKunlikTushum += parseInt(row.all_sum);
      newJSON.push({
        id: row.id,
        kunlikReja: row.all_nachis / weekdays - 1, // -1 bir kun bayram borligi uchun
        birKunlikTushum: row.all_sum,
        foizda: Math.floor(
          (Number(row.all_sum) / (row.all_nachis / weekdays)) * 100
        ),
        name: row.name,
      });
    });
    const resUmumiy = await fetch("https://cleancity.uz/ds?xenc=" + XENC, {
      headers,
      body: "mes=9&god=2023&from_day=1&to_day=30&gov_level=1&sort=id&order=asc",
      method: "POST",
      mode: "cors",
      credentials: "include",
    });
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
      <td style="text-align: right;">${Math.floor(
        mfy.kunlikReja
      ).toLocaleString()}</td>
      <td style="text-align: right;">${parseInt(
        mfy.birKunlikTushum
      ).toLocaleString()}</td>
      <td class="${
        mfy.foizda > (viloyatRejasi / viloyatKunlikTushum) * 100 ? "" : "bad"
      }" style="text-align: center;" class="">${mfy.foizda} %</td>
      <td style="text-align: right;">${parseInt(
        mfy.oyBoshidanTushum
      ).toLocaleString()}</td>
  </tr>`;
    });
    tableItems += `<tr>
<td colspan="2">Вилоят бўйича жами</td>
<th>${parseInt(viloyatRejasi).toLocaleString()}</th>
<th>${viloyatKunlikTushum.toLocaleString()}</th>
<th style="text-align: center;">${Math.floor(
      (viloyatRejasi / viloyatKunlikTushum) * 100
    )}%</th>
<th>${viloyatUmumiyTushum.toLocaleString()}</th>
</tr>`;
    await nodeHtmlToImage({
      output: "viloyatKunlikReja.png",
      type: "png",
      encoding: "binary",
      selector: "div",
      html: `<style>
    * {
        font-family: sans-serif;
        margin: 0;
    }

    table {
        border-color: black;
    }

    th {
        background-color: rgb(128, 128, 255);
    }

    .bad {
        background-color: rgb(255, 199, 206);
        color: rgb(156, 0, 6);
    }

    div {
        width: 700px;
    }

    h3 {
        text-align: center;
        font-style: italic;
        padding: 10px;
    }
</style>
<div>

    <h3>${date.getDate()}.${
        date.getMonth() + 1
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
    console.log(newJSON);
    await bot.telegram.sendPhoto(5347896070, {
      source: path.join(__dirname, "../viloyatKunlikReja.png"),
    });
  } catch (err) {
    console.log(err);
  }
})();
