const nodeHtmlToImage = require("node-html-to-image");
const { bot } = require("../core/bot");
const fs = require("fs");

function soatga(sec_num) {
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - hours * 3600) / 60);
  var seconds = sec_num - hours * 3600 - minutes * 60;

  if (hours > 0) {
    return `${hours} соат аввал`;
  } else if (minutes > 0) {
    return `${minutes} минут аввал`;
  } else {
    return `${seconds} секунд аввал`;
  }
}
String.prototype.toHHMMSS = function () {
  var sec_num = parseInt(this, 10); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - hours * 3600) / 60);
  var seconds = sec_num - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return hours + ":" + minutes;
};
module.exports.drawSendLastSeen = (data) => {
  const newJSON = {};
  const date = new Date();
  const nazoratchilar = require("../lib/nazoratchilar.json");
  let sana = `${date.getFullYear(Date.now())}.${
    date.getMonth(Date.now()) + 1
  }.${date.getDate(Date.now())} ${date.getHours(Date.now())}:${date.getMinutes(
    Date.now()
  )}:${date.getSeconds(Date.now())}`;
  newJSON.sana = sana;
  newJSON.dan = `Дан: ${date.getFullYear(Date.now())}.${
    date.getMonth(Date.now()) + 1
  }.${date.getDate(Date.now())}`;
  newJSON.gacha = `Гача: ${date.getFullYear(Date.now())}.${
    date.getMonth(Date.now()) + 1
  }.${date.getDate(Date.now())}`;
  const tranzaksiyalar = data.rows;
  newJSON.tranzaksiyalar = [];

  nazoratchilar.forEach((ins) => {
    if (ins.activ) {
      let found = false;
      let index;
      let lastDate = 0;
      for (let i = 0; i < tranzaksiyalar.length; i++) {
        if (
          ins.id == tranzaksiyalar[i].inspector_id &&
          tranzaksiyalar[i].transaction_time > lastDate
        ) {
          lastDate = tranzaksiyalar[i].transaction_time;
          found = true;
          index = i;
        }
      }
      if (!found) {
        newJSON.tranzaksiyalar.push({
          id: ins.id,
          name: ins.name,
          lastSeen: "Ishga chiqmagan",
          forSort: 0,
        });
      } else {
        newJSON.tranzaksiyalar.push({
          id: ins.id,
          name: ins.name,
          lastSeen: `${
            new Date(tranzaksiyalar[index].transaction_time).getHours() < 10
              ? "0" +
                new Date(tranzaksiyalar[index].transaction_time).getHours()
              : new Date(tranzaksiyalar[index].transaction_time).getHours()
          }:${
            new Date(tranzaksiyalar[index].transaction_time).getMinutes() < 10
              ? "0" +
                new Date(tranzaksiyalar[index].transaction_time).getMinutes()
              : new Date(tranzaksiyalar[index].transaction_time).getMinutes()
          }`,
          forHuman: soatga(
            String(
              Math.floor(
                (Date.now() - tranzaksiyalar[index].transaction_time) / 1000
              )
            )
          ),
          farqi: String(
            Math.floor(
              (Date.now() - tranzaksiyalar[index].transaction_time) / 1000
            )
          ).toHHMMSS(),
          forSort: tranzaksiyalar[index].transaction_time,
        });
      }
    }
  });
  newJSON.tranzaksiyalar.sort(
    (a, b) => parseFloat(b.forSort) - parseFloat(a.forSort)
  );
  let tableItems = ``;
  newJSON.tranzaksiyalar.forEach((ins, index) => {
    tableItems +=
      ins.lastSeen == "Ishga chiqmagan"
        ? `<tr class="text-red">
    <td>${index + 1}</td>
    <td>${ins.name}</td>
    <td colspan="3" class="align-center" >${ins.lastSeen}</td>
  </tr>`
        : `<tr>
                              <td>${index + 1}</td>
                              <td>${ins.name}</td>
                              <td>${ins.lastSeen}</td>
                              <td>${ins.farqi}</td>
                              <td>${ins.forHuman}</td>
                            </tr>`;
  });
  nodeHtmlToImage({
    output: "./lastseen.png",
    html: `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <style>
        .text-red{
          color: red;
        }
        .align-center {
          text-align: center;
        }
          table {
            overflow: hidden;
            border-collapse: collapse;
            padding: 10px;
          }
          div {
            display: inline-block;
          }
          th,
          td {
            border: 1px solid black;
            padding: 5px 15px;
            margin: 0;
            border-collapse: collapse;
          }
          p{
            text-decoration: underline;
          }
          th {
            background-color: aqua;
          }
          td:last-child {
            text-align: right;
          }
        </style>
      </head>
      <body>
      <div>
      <p>${newJSON.sana}</p>
      <h2>Назорат хисоботи</h2>
      <h3>${newJSON.dan}</h3>
      <h3>${newJSON.gacha}</h3>
      <table cellscasing="0">

          <tr>
            <th rowspan="2">№</th>
            <th rowspan="2">Назоратчи</th>
            <th rowspan="2">Охирги тушум</th>
            <th colspan="2">Шундан кейин</th>
          </tr>
          <tr>
            <th>Ўтган вақт</th>
            <th>Изох</th>
          </tr>
          ${tableItems}
        </table>
        </div>
      </body>
    </html>`,
    type: "png",
    encoding: "binary",
    selector: "div",
  }).then(() => {
    bot.telegram
      .sendPhoto(
        process.env.NAZORATCHILAR_GURUPPASI,
        { source: "./lastseen.png" },
        {
          caption: `${newJSON.sana} holatiga hisobot.\n coded by <a href="https://t.me/oliy_ong_leader">Oliy Ong</a>`,
          parse_mode: "HTML",
        }
      )

      .then(() => {
        fs.unlink("./lastseen.png", (err) => {
          if (err) throw err;
        });
      });
  });
};

module.exports.drawDailyIncomeComplating = async (data) => {
  const newJSON = {};
  const date = new Date();
  let sana = `${date.getFullYear(Date.now())}.${
    date.getMonth(Date.now()) + 1
  }.${date.getDate(Date.now())} ${date.getHours(Date.now())}:${date.getMinutes(
    Date.now()
  )}:${date.getSeconds(Date.now())}`;

  newJSON.sana = sana;
  newJSON.dan = `Дан: ${date.getFullYear(Date.now())}.${
    date.getMonth(Date.now()) + 1
  }.${date.getDate(Date.now())}`;
  newJSON.gacha = `Гача: ${date.getFullYear(Date.now())}.${
    date.getMonth(Date.now()) + 1
  }.${date.getDate(Date.now())}`;
  data.sort(
    (a, b) => parseFloat(b.bajarilishiFoizda) - parseFloat(a.bajarilishiFoizda)
  );
  let tableItems = ``;
  let count = 0;
  data.forEach((nazoratchi, i) => {
    if (nazoratchi.activ && nazoratchi.reja > 0) {
      count++;
      tableItems += `<tr class="${
        nazoratchi.bajarilishiFoizda >= 100 ? "green" : "red"
      }">
        <td class="center">${count}</td>
        <td>${nazoratchi.name}</td>
        <td class="align-right">${Math.floor(
          nazoratchi.kunlikReja
        ).toLocaleString()}</td>
        <td class="align-right">${nazoratchi.bugungiTushum.toLocaleString()}</td>
        <td >${Math.floor(nazoratchi.bajarilishiFoizda)}%</td>
      </tr>`;
    }
  });
  const imgName = "./" + Date.now() + ".png";
  await nodeHtmlToImage({
    output: imgName,
    html: `<html>
      <head>
        <meta charset="UTF-8" />
        <style>
          table {
            overflow: hidden;
            border-collapse: collapse;
            padding: 10px;
          }
          div {
            display: inline-block;
          }
          th,
          td {
            border: 1px solid black;
            padding: 5px 15px;
            margin: 0;
            border-collapse: collapse;
          }
          p{
            text-decoration: underline;
          }
          th {
            background-color: #91d1b0;
          }
          td:last-child {
            text-align: right;
          }
          .align-right{
            text-align: right;
          }
          .center{
            text-align: center;
          }
          .green{
            color: green;
          }
          .red{
            color: red;
          }
        </style>
      </head>
      <body>
      <div>
      <p>${newJSON.sana}</p>
      <h2>Транзаксиялар хисоботи</h2>
      <h3>${newJSON.dan}</h3>
      <h3>${newJSON.gacha}</h3>
      <table cellscasing="0">

          <tr>
            <th>№</th>
            <th>Назоратчи</th>
            <th>Кунлик режа</th>
            <th>Бажарилиши</th>
            <th>Фоизда</th>
          </tr>
          ${tableItems}
        </table>
        </div>
      </body>
    </html>`,
    type: "png",
    encoding: "binary",
    selector: "div",
  });
  return imgName;
};
