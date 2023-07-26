const nodeHtmlToImage = require("node-html-to-image");
const { bot } = require("../core/bot");
const fs = require("fs");

module.exports.drawAndSendTushum = (data, ctx) => {
  console.log(data);
  const nazoratchilar = require("../lib/nazoratchilar.json");
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
  newJSON.nazoratchilar = data.rows;
  nazoratchilar.forEach((ins) => {
    if (ins.activ) {
      let found = false;
      let index;
      for (let i = 0; i < newJSON.nazoratchilar.length; i++) {
        if (ins.id == newJSON.nazoratchilar[i].id) {
          found = true;
          index = i;
          break;
        }
      }
      if (!found) {
        newJSON.nazoratchilar.push({
          id: ins.id,
          name: ins.name,
          tushumSoni: 0,
          summasi: 0,
        });
      } else {
        newJSON.nazoratchilar[index] = {
          id: ins.id,
          name: ins.name,
          tushumSoni: newJSON.nazoratchilar[index].accepted_transactions_count,
          summasi: newJSON.nazoratchilar[index].accepted_transactions_sum,
        };
      }
    }
  });
  newJSON.nazoratchilar.sort(
    (a, b) => parseFloat(b.summasi) - parseFloat(a.summasi)
  );
  let tableItems = ``;
  let countIncome = 0;
  let countPrice = 0;
  newJSON.nazoratchilar.forEach((ins, index) => {
    countIncome += ins.tushumSoni;
    countPrice += ins.summasi;
    tableItems += `<tr>
                              <td>${index + 1}</td>
                              <td>${ins.name}</td>
                              <td>${ins.tushumSoni}</td>
                              <td>${ins.summasi}</td>
                            </tr>`;
  });
  tableItems += `<tr><td></td><td>Жами</td><td>${countIncome}</td><td>${countPrice}</td></tr>`;
  nodeHtmlToImage({
    output: "./image.png",
    html: `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
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
            background-color: rgb(244, 212, 246);
          }
          td:last-child {
            text-align: right;
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
            <th rowspan="2">№</th>
            <th rowspan="2">Худуд</th>
            <th colspan="2">Келиб тушган транзаксиялар</th>
          </tr>
          <tr>
            <th>Сони</th>
            <th>Сумма</th>
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
        { source: "./image.png" },
        { caption: `${newJSON.sana} holatiga tushum.` }
      )

      .then(() => {
        fs.unlink("./image.png", (err) => {
          if (err) throw err;
        });
      });
  });
};
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
  console.log(newJSON.tranzaksiyalar);
};
