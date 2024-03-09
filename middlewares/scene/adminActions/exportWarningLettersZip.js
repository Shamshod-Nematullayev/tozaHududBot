const { Scenes } = require("telegraf");
const { inputAbonentLicshet } = require("../../../constants");
const https = require("https");
const fs = require("fs");
const compresser = require("compressing");
const { messages } = require("../../../lib/messages");
const excelToJson = require("convert-excel-to-json");
const { keyboards } = require("../../../lib/keyboards");
const isCancel = require("../../smallFunctions/isCancel");
const {
  getLastAlertLetter,
} = require("../../../api/cleancity/dxsh/getLastAlertLetter");

const exportWarningLettersZip = new Scenes.WizardScene(
  "exportWarningLettersZip",
  async (ctx) => {
    if (
      ctx.message.document &&
      (ctx.message.document.mime_type ==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        ctx.message.document.mime_type == "application/vnd.ms-excel")
    ) {
      const waiterMessage = await ctx.reply(messages.pleaseWait);
      const filename = `./input${Date.now()}.xlsx`;
      const excelFileStream = fs.createWriteStream(filename);
      const xlsx = await ctx.telegram.getFileLink(ctx.message.document.file_id);
      https.get(xlsx.href, (res) => {
        res.pipe(excelFileStream);
        excelFileStream.on("finish", async (cb) => {
          const xls = excelToJson({
            sourceFile: filename,
          });

          const sheet = xls[Object.keys(xls)[0]];
          const dirname = `./uploads/warningLetters${Date.now()}`;
          fs.mkdir(dirname, (err) => {
            if (err) throw err;
          });
          try {
            const pdfPromises = sheet.map(async (item) => {
              return new Promise(async (resolve, reject) => {
                const warningLetter = await getLastAlertLetter(item.A);
                if (!warningLetter.success) {
                  ctx.replyWithHTML(
                    `<code>${item.A}</code> ogohlantirish xati topilmadi..`
                  );
                  return resolve(warningLetter);
                }
                fs.copyFile(
                  warningLetter.filename,
                  dirname + "/" + item.A + ".pdf",
                  (err) => {
                    if (err) reject(err);
                    else resolve("done");
                  }
                );
              });
            });

            await Promise.all(pdfPromises);
            await compresser.zip.compressDir(dirname, dirname + ".zip");
            ctx.replyWithDocument({ source: dirname + ".zip" });
            ctx.scene.leave();
          } catch (error) {
            console.error("Error:", error);
          }

          fs.unlink(filename, (err) => {
            if (err) throw err;
          });
          ctx.telegram.deleteMessage(ctx.chat.id, waiterMessage.message_id);
          ctx.scene.leave();
        });
      });
    } else {
      return ctx.reply(
        "Siz excel fayl kiritmadingiz",
        keyboards.lotin.cancelBtn
      );
    }
  }
);

exportWarningLettersZip.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi");
    return ctx.scene.leave();
  } else next();
});

exportWarningLettersZip.enter((ctx) => {
  ctx.replyWithDocument(inputAbonentLicshet, {
    caption:
      "Oxirgi marta yuborilgan ogohlantirish xatlarini arxiv shaklida yuklab olishni hohlagan abonentlarning hisob raqamlarini quyidagi jadvalga joylashtirib menga qaytarib yuboring",
  });
});

module.exports = { exportWarningLettersZip };
