const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const isCancel = require("../../smallFunctions/isCancel");
const excelToJson = require("convert-excel-to-json");
const https = require("https");
const fs = require("fs");
const qaysiMahalla = require("../../smallFunctions/qaysiMahalla");
const nodeHtmlToImage = require("node-html-to-image");

const importIncomeScene = new Scenes.WizardScene(
  "import_income_report",
  async (ctx) => {
    try {
      if (isCancel(ctx.message.text)) return ctx.scene.leave();
      if (
        ctx.message.document &&
        (ctx.message.document.mime_type ==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          ctx.message.document.mime_type == "application/vnd.ms-excel")
      ) {
        ctx.reply(messages.lotin.pleaseWait);
        // Agar nazoratchilar kesimida xisobot bo'lsa
        if (
          ctx.message.document.mime_type ==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
          const xlsx = await ctx.telegram.getFileLink(
            ctx.message.document.file_id
          );
          const excelFile = fs.createWriteStream("./incomeReport.xls");
          https.get(xlsx.href, (res) => {
            res.pipe(excelFile);
            excelFile.on("finish", (cb) => {
              excelFile.close(cb);
              const xls = excelToJson({
                sourceFile: "./incomeReport.xls",
              });
              const nazoratchilar = require("../../../lib/nazoratchilar.json");
              const sheet = xls[Object.keys(xls)[0]];
              const newJSON = {};
              newJSON.sana = sheet[0].A;
              newJSON.dan = sheet[2].A;
              newJSON.gacha = sheet[3].A;
              newJSON.nazoratchilar = sheet.slice(7, sheet.length - 1);
              nazoratchilar.forEach((ins) => {
                if (ins.activ) {
                  let found = false;
                  let index;
                  for (let i = 0; i < newJSON.nazoratchilar.length; i++) {
                    if (ins.id == newJSON.nazoratchilar[i].A) {
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
                      tushumSoni: newJSON.nazoratchilar[index].K,
                      summasi: newJSON.nazoratchilar[index].L,
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
                ctx.telegram
                  .sendPhoto(
                    process.env.NAZORATCHILAR_GURUPPASI,
                    { source: "./image.png" },
                    { caption: `${newJSON.sana} holatiga tushum.` }
                  )

                  .then(() => {
                    fs.unlink("./image.png", (err) => {
                      if (err) throw err;
                    });
                    fs.unlink("./incomeReport.xls", (err) => {
                      if (err) throw err;
                    });
                    ctx.scene.leave();
                  });
              });
            });
          });
        } else if (
          ctx.message.document.mime_type == "application/vnd.ms-excel"
        ) {
          const xlsx = await ctx.telegram.getFileLink(
            ctx.message.document.file_id
          );
          const excelFile = fs.createWriteStream("./incomeReportMFY.xls");
          https.get(xlsx.href, (res) => {
            res.pipe(excelFile);
            excelFile.on("finish", async (cb) => {
              const xls = excelToJson({
                sourceFile: "./incomeReportMFY.xls",
              });
              const sheet = xls[Object.keys(xls)[0]];
              const newJSON = {};
              newJSON.sana = sheet[2].A;
              newJSON.davr = sheet[3].A;
              newJSON.mahallalar = [];
              for (let i = 0; i < sheet.length - 9; i++) {
                if (parseInt(sheet[i + 7].F) != 0)
                  newJSON.mahallalar.push({
                    id: sheet[i + 7].A,
                    xisoblandi: parseInt(sheet[i + 7].F),
                    tushum: parseInt(sheet[i + 7].G),
                  });
              }
              let jamiXisoblandi = 0;
              let jamiTushum = 0;
              newJSON.mahallalar.sort(
                (a, b) =>
                  parseFloat(b.tushum / b.xisoblandi) -
                  parseFloat(a.tushum / a.xisoblandi)
              );
              let tableItems = ``;
              newJSON.mahallalar.forEach((mfy, index) => {
                jamiXisoblandi += mfy.xisoblandi;
                jamiTushum += mfy.tushum;
                if (!qaysiMahalla(mfy.id)) {
                  console.log(mfy);
                }
                tableItems += `<tr>
            <td>${index + 1}</td>
            <td align="left" class="left">${qaysiMahalla(mfy.id)}</td>
            <td>${mfy.xisoblandi}</td>
            <td>${mfy.tushum}</td>
            <td align="center">${
              Math.round(
                (mfy.tushum / mfy.xisoblandi + Number.EPSILON) * 1000
              ) / 10
            }%</td>
            <td>${mfy.tushum - mfy.xisoblandi}</td>
            </tr>`;
              });
              // Jami summasi kerak bo'lmagan payt shu qism komentga olinadi.
              //     tableItems += `<tr>
              // <td></td>
              // <td></td>
              // <td>${jamiXisoblandi}</td>
              // <td>${jamiTushum}</td>
              // <td align="center">${
              //   Math.round((jamiTushum / jamiXisoblandi + Number.EPSILON) * 1000) /
              //   10
              // }%</td>
              // <td>${jamiTushum - jamiXisoblandi}</td>
              // </tr>`;

              nodeHtmlToImage({
                output: "./income.png",
                html: `<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8" />
            <title>Document</title>
            <style>
            body{
              font-family: sans-serif;
              font-size: 20px;
            }
            table {
                  overflow: hidden;
                  border-collapse: collapse;
                  padding: 10px;
                }
                h2 {
                  text-align: center;
                }
                h3{
                  margin: 5px;
                  line-height: 15px
                }
                div {
                  display: inline-block;
                  position: relative
                }
                th,
                td {
                  border: 1px solid black;
                  padding: 2px 5px;
                  margin: 0;
                  border-collapse: collapse;
                }
                td{
                  text-align: right;
                }
                p {
                  text-decoration: underline;
                }
                th {
                  background-color: rgb(151, 218, 253);
                }
                td:last-child {
                  text-align: right;
                }
                .left{
                  text-align: left;
                }
                #oliy_ong{
                  position: absolute;
                  top:0;
                  left:0;
                }
                </style>
                </head>
                <body>
                <div>
                <i style="color: blue" id="oliy_ong">Oliy Ong</i>
                <h2>Тушумлар таҳлили</h2>
                <h3>${newJSON.sana}</h3>
                <!-- <h3>${newJSON.davr}</h3>-->
                <h3>Каттақўрғон туман / "ANVARJON BIZNES INVEST" MCHJ</h3>
                <table cellscasing="0">
                <tr>
                <th>№</th>
                <th>Махалла</th>
                <th>Хисобланди</th>
                <th>Жами тушумлар</th>
                <th>Фоизда</th>
                <th>Фарқи</th>
                </tr>
                ${tableItems}
                </table>
                <footer><b>Бажарувчи: Шамшод Неъматуллаев</b></footer>
                </div>
                </body>
                </html>
                `,
                type: "png",
                encoding: "binary",
                selector: "div",
              }).then(() => {
                ctx.telegram
                  .sendPhoto(
                    process.env.NAZORATCHILAR_GURUPPASI,
                    // ctx.from.id,
                    { source: "./income.png" },
                    {
                      caption: `${
                        newJSON.sana
                      } holatiga tushum.\n <a href="https://t.me/${
                        ctx.from.username
                      }">${ctx.from.first_name} ${
                        ctx.from.last_name ? ctx.from.last_name : ""
                      }</a> tizimga kiritdi\n powered by <i><a href="https://t.me/oliy_ong">Oliy Ong</a></i>`,
                      parse_mode: "HTML",
                    }
                  )
                  .then(() => {
                    fs.unlink("./income.png", (err) => {
                      if (err) throw err;
                    });
                    fs.unlink("./incomeReportMFY.xls", (err) => {
                      if (err) throw err;
                    });
                    ctx.scene.leave();
                  });
              });
            });
          });
        }
      } else {
        ctx.reply(
          messages.lotin.notExcelFile,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      }
    } catch (error) {
      console.log(error);
    }
  }
);

importIncomeScene.enter((ctx) => {
  ctx.reply(
    messages[ctx.session.til].enterIncomeReport,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});

importIncomeScene.leave((ctx) => {
  ctx.reply(
    messages[ctx.session.til ? ctx.session.til : "lotin"].heyAdmin,
    keyboards[
      ctx.session.til ? ctx.session.til : "lotin"
    ].adminKeyboard.resize()
  );
});

module.exports = importIncomeScene;
