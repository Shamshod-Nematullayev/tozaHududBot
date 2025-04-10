const isCancel = require("../../smallFunctions/isCancel");
const { Scenes } = require("telegraf");
const { importSudBuyruqlariExample } = require("../../../constants");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const ejs = require("ejs");
const HTMLtoDOCX = require("html-to-docx");
const fs = require("fs");
const https = require("https");
const excelToJson = require("convert-excel-to-json");
const path = require("path");

const generateSBuyruq = new Scenes.WizardScene(
  "generate_sud_buyruq",
  async (ctx) => {
    try {
      if (isCancel(ctx.message?.text)) return ctx.scene.leave();
      if (
        ctx.message.document &&
        (ctx.message.document.mime_type ==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          ctx.message.document.mime_type == "application/vnd.ms-excel")
      ) {
        const waiterMessage = await ctx.reply(messages.pleaseWait);
        // excel fileni yuklab olish
        const xlsx = await ctx.telegram.getFileLink(
          ctx.message.document.file_id
        );
        const filename = `./sudbuyruq${Date.now()}.xls`;
        const excelFile = fs.createWriteStream(filename);
        https.get(xlsx.href, (res) => {
          res.pipe(excelFile);
          excelFile.on("finish", async (cb) => {
            const xls = excelToJson({
              sourceFile: filename,
            });
            //   excel filedagi ma'lumotlarni json formati o'zgartirish
            const sheet = xls[Object.keys(xls)[0]];
            const rows = [];
            for (let i = 0; i < sheet.length - 1; i++) {
              rows.push({
                KOD: sheet[i + 1].A,
                FISH: sheet[i + 1].B,
                MFY: sheet[i + 1].C,
                STREET: sheet[i + 1].D,
                QARZ: sheet[i + 1].E,
                PASSPORT: sheet[i + 1].F,
                PINFIL: sheet[i + 1].G,
              });
            }
            ejs.renderFile(
              path.join(__dirname, `../../../views/sudbuyruq.ejs`),
              { rows },
              {},
              async (err, str) => {
                if (err) console.log(err);
                const fileBuffer = await HTMLtoDOCX(str, null, {
                  table: { row: { cantSplit: true } },
                  footer: true,
                  pageNumber: true,
                  pageSize: {
                    height: "1123px",
                    width: "794px",
                  },
                  // margins: {
                  //   top: '0.7cm',
                  //   left: '0.9cm',
                  //   bottom: '0.3cm',
                  //   right: '0.4cm',
                  //   header: '0cm',
                  //   bottom: '0cm'
                  // }
                });
                const filePath = "./example.docx";
                fs.writeFile(filePath, fileBuffer, async (error) => {
                  if (error) {
                    console.log("Docx file creation failed");
                    return;
                  }
                  await ctx.replyWithDocument({ source: filePath });
                  fs.unlink(filePath, (err) => {});
                });
                // ctx.scene.leave();
              }
            );
          });
        });
      } else {
        ctx.reply(messages.notExcelFile, keyboards.cancelBtn.resize());
      }
    } catch (err) {
      ctx.reply(
        "Xukmdorim !!  sud buyruqlarini generatsiya qilish birinchi sceneda xatolik kuzatildi"
      );
      console.log(err);
    }
  }
);

generateSBuyruq.enter((ctx) => {
  // ctx.replyWithDocument(importSudBuyruqlariExample, {
  //   caption: `Sud buyruqlari generatsiya qilinadigan abonentlar ma'lumotini ushbu shablonga ko'ra menga yuboring!`,
  //   reply_markup: keyboards.cancelBtn,
  // });
  ctx.reply("Kirit");
});

module.exports = { generateSBuyruq };
