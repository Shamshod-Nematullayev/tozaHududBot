const { Scenes } = require("telegraf");
const { SudBuyruqInputExcel } = require("../../../../constants");
const { keyboards } = require("../../../../lib/keyboards");
const isCancel = require("../../../smallFunctions/isCancel");
const fs = require("fs");
const https = require("https");
const excelToJson = require("convert-excel-to-json");
const {
  createNewSudBuyruq,
} = require("../../../../controllers/generateSudBuyruqController");
const { messages } = require("../../../../lib/messages");

const sudBuyruqlariYaratish = new Scenes.WizardScene(
  "sudBuyruqlariYaratish",
  async (ctx) => {
    try {
      // bad request errors
      if (!ctx.message)
        return ctx.reply(
          "Kutilgan amal bajarilmadi",
          keyboards.lotin.cancelBtn.resize()
        );

      if (!ctx.message.document)
        return ctx.reply(
          `Siz fayl kiritmadingiz!!`,
          keyboards.lotin.cancelBtn.resize()
        );
      if (
        !(
          ctx.message.document.mime_type !==
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
          ctx.message.document.mime_type !== "application/vnd.ms-excel"
        )
      ) {
        const waiterMessage = await ctx.reply(messages.pleaseWait);
        const filename = `./input${Date.now()}.xlsx`;
        const excelFileStream = fs.createWriteStream(filename);
        const xlsx = await ctx.telegram.getFileLink(
          ctx.message.document.file_id
        );
        https.get(xlsx.href, (res) => {
          res.pipe(excelFileStream);
          excelFileStream.on("finish", async () => {
            const xls = excelToJson({
              sourceFile: filename,
            });
            const sheet = xls[Object.keys(xls)[0]];
            let counter = 1;
            let errors = [];
            async function create() {
              if (counter == sheet.length) return;
              if (counter == sheet.length) return;
              const item = sheet[counter];
              const created = await createNewSudBuyruq({
                licshet: item.B,
                javobgar_name: item.C,
                javobgar_tugilgan_sanasi: item.H,
                mfy_name: item.G,
                passport_seriya: item.J,
                pinfl: item.K,
                qarzdorlik: item.I,
                sana: item.E,
                sud_ijro_raqami: item.D,
                sudya_name: item.F,
              });

              if (!created.success) {
                ctx.replyWithHTML(`<code>${item.B}</code> muvaffaqqiyatsiz`);
                errors.push({ kod: item.B, message: created.message });
                return;
              }
              console.log(`${item.B} Bo'ldi..`);
              counter++;
              await create();
            }
            ctx.deleteMessage(waiterMessage.message_id);
            fs.unlinkSync(filename);
            create();
          });
        });
      }
    } catch (error) {
      ctx.reply("Enternal server error");
      console.error(new Error(error));
    }
  }
);

sudBuyruqlariYaratish.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi");
    return ctx.scene.leave();
  } else next();
});

sudBuyruqlariYaratish.enter((ctx) => {
  ctx.replyWithDocument(SudBuyruqInputExcel, {
    caption: `Kerakli ma'lumotlarni quyidagi excel jadvalga joylashtirib menga yuboring`,
  });
});

module.exports = { sudBuyruqlariYaratish };
