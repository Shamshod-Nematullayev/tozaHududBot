const isCancel = require("../../smallFunctions/isCancel");
const { Scenes } = require("telegraf");
const {
  importSudBuyruqlariExample,
  INPUT_ALERT_LETTER_EXCEL,
} = require("../../../constants");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const ejs = require("ejs");
const fs = require("fs");
const https = require("https");
const excelToJson = require("convert-excel-to-json");
const path = require("path");

const generateProkuraturaSudAriza = new Scenes.WizardScene(
  "generateProkuraturaSudAriza",
  async (ctx) => {
    console.log(ctx.message);
    const [kun, oy] = ctx.message.text.split("-");
    ctx.wizard.state.kun = kun;
    ctx.wizard.state.oy = oy;
    ctx.replyWithDocument(INPUT_ALERT_LETTER_EXCEL, {
      caption: `Prokuratura tomonidan sudga yoziladigan arizalarini ma'lumotlarini na'munadagi jadvalga qo'yib menga yuboring!`,
      reply_markup: keyboards.cancelBtn,
    });
    ctx.wizard.next();
  },
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
          excelFile.on("finish", async () => {
            const xls = excelToJson({
              sourceFile: filename,
            });
            fs.unlink(filename, (err) => {
              if (err) throw err;
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
                PINFL: sheet[i + 1].F,
              });
            }

            ejs.renderFile(
              path.join(__dirname, `../../../views/arizaProkuratura.ejs`),
              { rows, kun: ctx.wizard.state.kun, oy: ctx.wizard.state.oy },
              {},
              async (err, str) => {
                if (err) console.log(err);

                const filePath = "./prokuratura.html";
                fs.writeFile(filePath, str, async (error) => {
                  if (error) {
                    console.error("Docx file creation failed");
                    return;
                  }
                  ctx.telegram.deleteMessage(
                    ctx.chat.id,
                    waiterMessage.message_id
                  );
                  await ctx.replyWithDocument({ source: filePath });
                  fs.unlink(filePath, (err) => {});
                  console.log("Docx file created successfully");
                });
                ctx.scene.leave();
              }
            );
          });
        });
      } else {
        ctx.reply(messages.notExcelFile, keyboards.cancelBtn.resize());
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
  ctx.reply("Ariza uchun sana kiriting misol: 28-феврал");
});

module.exports = { generateProkuraturaSudAriza };
