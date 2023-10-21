const { isCancel } = require("axios");
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
        const waiterMessage = await ctx.reply(messages.lotin.pleaseWait);
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
              path.join(__dirname, `../../../lib/sudbuyruq.ejs`),
              { rows },
              {},
              async (err, str) => {
                if (err) console.log(err);
                const fileBuffer = await HTMLtoDOCX(str, null, {
                  table: { row: { cantSplit: true } },
                  footer: true,
                  pageNumber: true,
                });
                const filePath = "./example.docx";
                fs.writeFile(filePath, fileBuffer, (error) => {
                  if (error) {
                    console.log("Docx file creation failed");
                    return;
                  }
                  ctx.replyWithDocument({ source: filePath });
                  console.log("Docx file created successfully");
                });
                ctx.scene.leave();
              }
            );
          });
        });
      } else {
        ctx.reply(
          messages.lotin.notExcelFile,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
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
  ctx.replyWithDocument(importSudBuyruqlariExample, {
    caption: `Sud buyruqlari generatsiya qilinadigan abonentlar ma'lumotini ushbu shablonga ko'ra menga yuboring!`,
    reply_markup: keyboards.lotin.cancelBtn,
  });
});

module.exports = { generateSBuyruq };
