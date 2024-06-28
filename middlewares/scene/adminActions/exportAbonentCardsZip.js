const { Scenes } = require("telegraf");
const { inputAbonentLicshet } = require("../../../constants");
const https = require("https");
const fs = require("fs");
const { messages } = require("../../../lib/messages");
const excelToJson = require("convert-excel-to-json");
const htmlPDF = require("html-pdf");
const { getAbonentCardHtml } = require("../../../api/cleancity/dxsh/");
const { keyboards } = require("../../../lib/keyboards");
const isCancel = require("../../smallFunctions/isCancel");

const exportAbonentCards = new Scenes.WizardScene(
  "exportAbonentCards",
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
          const dirname = `./uploads/kartalar${Date.now()}`;
          try {
            // const pdfPromises = sheet.map(async (item) => {
            let counter = 0;
            let errors = [];
            async function download() {
              if (counter == sheet.length) return;
              const item = sheet[counter];
              const html = await getAbonentCardHtml(item.A);
              // let promis =  new Promise((resolve, reject) => {
              htmlPDF
                .create(html, { format: "A4", orientation: "portrait" })
                .toFile(dirname + "/" + item.A + ".pdf", async (err, res) => {
                  if (err) {
                    // reject(err);
                    errors.push(err);
                  } else {
                    ctx.reply(item.A + " boldi");
                    counter++;
                    await download();
                    // resolve(res);
                  }
                });
              // });
              // await Promise.
            }
            await download();
            // });

            // await Promise.all(pdfPromises);
            // await compresser.zip.compressDir(dirname, dirname + ".zip");
            // ctx.replyWithDocument({ source: dirname + ".zip" });
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

exportAbonentCards.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi");
    return ctx.scene.leave();
  } else next();
});

exportAbonentCards.enter((ctx) => {
  ctx.replyWithDocument(inputAbonentLicshet, {
    caption:
      "Abonent kartalari kerak bo'lgan abonentlarni na'munadagidek excel jadvalga qo'yib bering",
  });
});

module.exports = { exportAbonentCards };
