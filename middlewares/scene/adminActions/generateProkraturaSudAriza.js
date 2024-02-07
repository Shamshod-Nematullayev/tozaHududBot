const isCancel = require("../../smallFunctions/isCancel");
const { Scenes } = require("telegraf");
const {
  importSudBuyruqlariExample,
  INPUT_ALERT_LETTER_EXCEL,
} = require("../../../constants");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const ejs = require("ejs");
const HTMLtoDOCX = require("html-to-docx");
const fs = require("fs");
const https = require("https");
const excelToJson = require("convert-excel-to-json");
const path = require("path");

const generateProkuraturaSudAriza = new Scenes.WizardScene(
  "generateProkuraturaSudAriza",
  async (ctx) => {
    try {
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
        const filename = `./prokrorarizia${Date.now()}.xls`;
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
                PINFIL: sheet[i + 1].F,
              });
            }

            ejs.renderFile(
              path.join(__dirname, `../../../views/arizaProkuratura.ejs`),
              { rows },
              {},
              async (err, str) => {
                if (err) console.log(err);

                const filePath = "./prokuratura.html";
                fs.writeFile(filePath, str, (error) => {
                  if (error) {
                    console.log("Docx file creation failed");
                    return;
                  }
                  ctx.replyWithDocument({ source: filePath });
                  console.log("Docx file created successfully");
                });
                // ctx.scene.leave();
              }
            );
          });
        });
      } else {
        ctx.reply(
          messages.notExcelFile,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      }
    } catch (err) {
      ctx.reply("Xukmdorim !!  Arizalarni generate qilishda muammo");
      console.log(err);
    }
  }
);

generateProkuraturaSudAriza.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi");
    return ctx.scene.leave();
  } else next();
});

generateProkuraturaSudAriza.enter((ctx) => {
  ctx.replyWithDocument(INPUT_ALERT_LETTER_EXCEL, {
    caption: `Prokuratura tomonidan sudga yoziladigan arizalarini ma'lumotlarini na'munadagi jadvalga qo'yib menga yuboring!`,
    reply_markup: keyboards.lotin.cancelBtn,
  });
});

module.exports = { generateProkuraturaSudAriza };
