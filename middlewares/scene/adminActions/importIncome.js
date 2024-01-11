const { Scenes, Markup } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const isCancel = require("../../smallFunctions/isCancel");
const excelToJson = require("convert-excel-to-json");
const https = require("https");
const fs = require("fs");
const qaysiMahalla = require("../../smallFunctions/qaysiMahalla");
const nodeHtmlToImage = require("node-html-to-image");
const { Mahalla } = require("../../../models/Mahalla");
const {
  getWeekdaysInMonth,
} = require("../../smallFunctions/getWeekDaysInMonth");
const { drawDailyIncomeComplating } = require("../../drawTushum");

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
        const waiterMessage = await ctx.reply(messages.pleaseWait);
        if (ctx.message.document.mime_type == "application/vnd.ms-excel") {
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
              newJSON.mahallalar = [];

              newJSON.sana = sheet[2].A;
              newJSON.davr = sheet[3].A;
              for (let i = 0; i < sheet.length - 9; i++) {
                if (parseInt(sheet[i + 7].F) != 0) {
                  const mahalla = await Mahalla.findOne({ id: sheet[i + 7].A });

                  newJSON.mahallalar.push({
                    id: sheet[i + 7].A,
                    xisoblandi: mahalla.reja,
                    tushum: parseInt(sheet[i + 7].G),
                    nazoratchi: mahalla.biriktirilganNazoratchi,
                  });
                }
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
                }
                tableItems += `<tr>
            <td>${index + 1}</td>
            <td align="left" class="left">${qaysiMahalla(mfy.id)}</td>
            <td>${Math.floor(mfy.xisoblandi)
              .toLocaleString()
              .replace(/,/g, " ")}</td>
            <td>${Math.floor(mfy.tushum)
              .toLocaleString()
              .replace(/,/g, " ")}</td>
            <td align="center">${
              Math.round(
                (mfy.tushum / mfy.xisoblandi + Number.EPSILON) * 1000
              ) / 10
            }%</td>
            <td>${Math.floor(mfy.tushum - mfy.xisoblandi)
              .toLocaleString()
              .replace(/,/g, " ")}</td>
            </tr>`;
              });
              // Jami summasi kerak bo'lmagan payt shu qism komentga olinadi.
              tableItems += `<tr>
              <td></td>
              <td></td>
              <th>${Math.floor(jamiXisoblandi)
                .toLocaleString()
                .replace(/,/g, " ")}</th>
              <th>${Math.floor(jamiTushum)
                .toLocaleString()
                .replace(/,/g, " ")}</th>
              <th align="center">${
                Math.round(
                  (jamiTushum / jamiXisoblandi + Number.EPSILON) * 1000
                ) / 10
              }%</th>
              <th>${Math.floor(jamiTushum - jamiXisoblandi)
                .toLocaleString()
                .replace(/,/g, " ")}</th>
              </tr>`;

              await nodeHtmlToImage({
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
                  font-weight: bold;
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
                <th style="width: 250px">Махалла</th>
                <th style="width: 120px">Режа</th>
                <th style="width: 120px">Жами тушумлар</th>
                <th>Фоизда</th>
                <th style="width: 120px">Фарқи</th>
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
              });
              await ctx.deleteMessage(waiterMessage.message_id);
              await ctx.reply(
                `Agar kunlik reja bajarilishi hisobotini tashlashimni ham hohlasangiz. Bugungi tushum hisobotini menga yuboring, hukmdorim`,
                Markup.keyboard(["Yetarli"])
              );
              ctx.wizard.state.newJSON = newJSON;
              return ctx.wizard.next();
            });
          });
        }
      } else {
        ctx.reply(
          messages.notExcelFile,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      }
    } catch (error) {
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && ctx.message.text == "Chiqish") ctx.scene.leave();
      const newJSON = ctx.wizard.state.newJSON;
      if (ctx.message.text == "Yetarli") {
        await ctx.telegram.sendPhoto(
          // process.env.NAZORATCHILAR_GURUPPASI,
          ctx.from.id,
          { source: "./income.png" },
          {
            caption: `${
              newJSON.sana
            } holatiga tushum.\n <a href="https://t.me/${ctx.from.username}">${
              ctx.from.first_name
            } ${
              ctx.from.last_name ? ctx.from.last_name : ""
            }</a> tizimga kiritdi\n powered by <i><a href="https://t.me/oliy_ong">Oliy Ong</a></i>`,
            parse_mode: "HTML",
          }
        );
        // waste disposal
        fs.unlink("./income.png", (err) => {
          if (err) throw err;
        });
        fs.unlink("./incomeReportMFY.xls", (err) => {
          if (err) throw err;
        });

        ctx.scene.leave();
      } else if (
        ctx.message.document &&
        (ctx.message.document.mime_type ==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          ctx.message.document.mime_type == "application/vnd.ms-excel")
      ) {
        const xlsx = await ctx.telegram.getFileLink(
          ctx.message.document.file_id
        );
        const excelFile = fs.createWriteStream("./kunlik.xls");
        https.get(xlsx.href, (res) => {
          res.pipe(excelFile);
          excelFile.on("finish", async (cb) => {
            const xls = excelToJson({
              sourceFile: "./kunlik.xls",
            });
            const sheet = xls[Object.keys(xls)[0]];
            for (let i = 0; i < sheet.length; i++) {
              const row = sheet[i];

              if (i > 7) {
                for (let i = 0; i < newJSON.mahallalar.length; i++) {
                  const mahalla = newJSON.mahallalar[i];
                  if (mahalla.id == row.B) {
                    newJSON.mahallalar[i].bugungiTushum = Number(row.E);
                  }
                }
              }
            }
            const nazoratchilar = require("../../../lib/nazoratchilar.json");
            nazoratchilar.forEach((nazoratchi) => {
              nazoratchi.reja = 0;
              nazoratchi.tushum = 0;
              nazoratchi.bugungiTushum = 0;
              for (let i = 0; i < newJSON.mahallalar.length; i++) {
                const mahalla = newJSON.mahallalar[i];
                if (nazoratchi.id == mahalla.nazoratchi.inspactor_id) {
                  nazoratchi.reja += mahalla.xisoblandi;
                  nazoratchi.tushum += mahalla.tushum;
                  mahalla.bugungiTushum
                    ? (nazoratchi.bugungiTushum += mahalla.bugungiTushum)
                    : false;
                }
              }
              const date = new Date();
              nazoratchi.kunlikReja =
                (nazoratchi.reja -
                  nazoratchi.tushum +
                  nazoratchi.bugungiTushum) /
                getWeekdaysInMonth(
                  date.getDate(),
                  date.getMonth(),
                  date.getFullYear()
                );
              nazoratchi.bajarilishiFoizda =
                (nazoratchi.bugungiTushum / nazoratchi.kunlikReja) * 100;
            });
            const imgPath = await drawDailyIncomeComplating(nazoratchilar);
            await ctx.replyWithPhoto({ source: imgPath });
            await ctx.telegram.sendPhoto(
              // process.env.NAZORATCHILAR_GURUPPASI,
              ctx.from.id,
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
            );
            // waste disposal
            fs.unlink("./income.png", (err) => {
              if (err) throw err;
            });
            fs.unlink("./incomeReportMFY.xls", (err) => {
              if (err) throw err;
            });
            return ctx.scene.leave();
          });
        });
      }
    } catch (error) {
      ctx.reply("Xatolik");
      console.log(error);
    }
  }
);

importIncomeScene.enter((ctx) => {
  ctx.reply(messages.enterIncomeReport, keyboards.cancelBtn.resize());
});

importIncomeScene.leave((ctx) => {
  ctx.reply(
    messages.heyAdmin,
    keyboards[
      ctx.session.til ? ctx.session.til : "lotin"
    ].adminKeyboard.resize()
  );
});

module.exports = importIncomeScene;
