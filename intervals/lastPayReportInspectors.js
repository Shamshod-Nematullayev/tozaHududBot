const nodeHtmlToImage = require("node-html-to-image");
const { ekopayApi } = require("../api/ekopayApi");
const { bot, Nazoratchi } = require("../requires");
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

async function lastPayReportInspectors() {
  try {
    const nazoratchilar = await Nazoratchi.find({ activ: true });
    const date = new Date();
    const dateStr = `${date.getDate()}.${
      date.getMonth() + 1
    }.${date.getFullYear()}`;
    const tranzaksiyalar = (
      await ekopayApi.get(
        `/ecopay/eopc-transactions;sortBy=id;descending=true;page=1;perPage=500?branchs_id=32&from_date=${dateStr}&to_date=${dateStr}&companies_id=336`,
        { headers: { login: "dxsh24107" } }
      )
    ).data.rows;
    let data = {};
    let sana = `${date.getFullYear()}.${
      date.getMonth() + 1
    }.${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    data.sana = sana;
    data.dan = `Дан: ${date.getFullYear()}.${
      date.getMonth() + 1
    }.${date.getDate()}`;
    data.gacha = `Гача: ${date.getFullYear()}.${
      date.getMonth() + 1
    }.${date.getDate()}`;
    data.tranzaksiyalar = [];
    nazoratchilar.forEach((ins) => {
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
        data.tranzaksiyalar.push({
          id: ins.id,
          name: ins.name,
          lastSeen: "Ishga chiqmagan",
          forSort: 0,
        });
      } else {
        data.tranzaksiyalar.push({
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
    });
    data.tranzaksiyalar.sort(
      (a, b) => parseFloat(b.forSort) - parseFloat(a.forSort)
    );
    let tableItems = ``;
    data.tranzaksiyalar.forEach((ins, index) => {
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
    const binaryData = await nodeHtmlToImage({
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
            <p>${data.sana}</p>
            <h2>Назорат хисоботи</h2>
            <h3>${data.dan}</h3>
            <h3>${data.gacha}</h3>
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
    });
    const buffer = Buffer.from(binaryData, "binary");
    bot.telegram.sendPhoto(
      process.env.ME,
      { source: buffer },
      {
        caption: `${data.sana} holatiga hisobot.\n coded by <a href="https://t.me/oliy_ong_leader">Oliy Ong</a>`,
        parse_mode: "HTML",
      }
    );

    console.log(rows);
  } catch (error) {
    console.error(error);
  }
}

module.exports = { lastPayReportInspectors };
