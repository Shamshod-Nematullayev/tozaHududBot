const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const isCancel = require("../../smallFunctions/isCancel");
const excelToJson = require("convert-excel-to-json");
const https = require("https");
const fs = require("fs");
const ejs = require("ejs");
const htmlPDF = require("html-pdf");
const { kirillga } = require("../../smallFunctions/lotinKiril");
const { INPUT_ALERT_LETTER_EXCEL } = require("../../../constants");

const generateAlertLetter = new Scenes.WizardScene(
  "generate_alert_letter",
  async (ctx) => {
    try {
      if (isCancel(ctx.message.text)) return ctx.scene.leave();
      if (
        ctx.message.document &&
        (ctx.message.document.mime_type ==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          ctx.message.document.mime_type == "application/vnd.ms-excel")
      ) {
        const xlsx = await ctx.telegram.getFileLink(
          ctx.message.document.file_id
        );
        const excelFile = fs.createWriteStream("./alert_letter.xls");
        ctx.reply(messages.pleaseWait);
        https.get(xlsx.href, (res) => {
          res.pipe(excelFile);
          excelFile.on("finish", (cb) => {
            excelFile.close(cb);
            const xls = excelToJson({
              sourceFile: "./alert_letter.xls",
            });
            function bugungiSana() {
              const date = new Date();
              return `${date.getDate()}.${
                date.getMonth() + 1 < 10
                  ? "0" + (date.getMonth() + 1)
                  : date.getMonth() + 1
              }.${date.getFullYear()}`;
            }
            let xatlar = "";
            xls[Object.keys(xls)[0]].forEach((elem, index) => {
              if (index != 0) {
                const abonent = {
                  FISH: elem.B,
                  MFY: kirillga(elem.C),
                  STREET: elem.D,
                  KOD: String(elem.A),
                  SALDO: elem.E,
                  SANA: bugungiSana(),
                };
                ejs.renderFile("./views/ox.ejs", { abonent }, (err, res) => {
                  if (err) throw err;
                  xatlar += res;
                });
              }
            });

            htmlPDF
              .create(xatlar, {
                format: "A4",
                orientation: "landscape",
              })
              .toFile("./lib/xatlar.PDF", (error, result) => {
                if (error) throw error;
                ctx
                  .replyWithDocument({ source: "./lib/xatlar.PDF" })
                  .then(() => {
                    fs.unlink("./lib/xatlar.PDF", (err) =>
                      err ? console.log(err) : ""
                    );
                    fs.unlink("./alert_letter.xls", (err) =>
                      err ? console.log(err) : ""
                    );
                    ctx.scene.leave();
                  });
              });
          });
        });
      } else {
        ctx.reply(messages.notExcelFile, keyboards.cancelBtn.resize());
      }
    } catch (error) {
      console.log(error);
      ctx.reply("Xatolik");
    }
  }
);

// Scene enter and leave handlers
generateAlertLetter.enter((ctx) => {
  ctx.replyWithDocument(INPUT_ALERT_LETTER_EXCEL, {
    caption: `Ogohlantirish xati namuna \n` + messages.enterExcelFile,
    reply_markup: keyboards.cancelBtn.resize().reply_markup,
  });
});

generateAlertLetter.leave((ctx) => {
  ctx.reply(
    messages.heyAdmin,
    keyboards[
      ctx.session.til ? ctx.session.til : "lotin"
    ].adminKeyboard.resize()
  );
});

module.exports = generateAlertLetter;
