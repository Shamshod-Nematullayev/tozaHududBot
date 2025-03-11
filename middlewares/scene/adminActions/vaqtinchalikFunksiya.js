const excelToJson = require("convert-excel-to-json");
const { Scenes } = require("telegraf");
const { find_one_by_pinfil_from_mvd } = require("../../../api/mvd-pinfil");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Abonent } = require("../../../models/Abonent");
const fs = require("fs");
const https = require("https");

const vaqtinchalikFunc = new Scenes.WizardScene(
  "vaqtinchalikFunc",
  async (ctx) => {
    try {
      if (
        ctx.message.document &&
        (ctx.message.document.mime_type ==
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          ctx.message.document.mime_type == "application/vnd.ms-excel")
      ) {
        const waiterMessage = await ctx.reply(messages.pleaseWait);
        const filename = `./input${Date.now()}.xlsx`;
        const excelFileStream = fs.createWriteStream(filename);
        const xlsx = await ctx.telegram.getFileLink(
          ctx.message.document.file_id
        );
        https.get(xlsx.href, (res) => {
          res.pipe(excelFileStream);
          excelFileStream.on("finish", async (cb) => {
            const xls = excelToJson({
              sourceFile: filename,
            });

            const sheet = xls[Object.keys(xls)[0]];

            // const pdfPromises = sheet.map(async (item) => {
            let counter = 0;
            let errors = [];
            async function download() {
              if (counter == sheet.length) return;
              const item = sheet[counter];
              const abonent = await Abonent.findOne({ licshet: item.A });
              const customDates = await find_one_by_pinfil_from_mvd(
                abonent.pinfl
              );
              if (!customDates.success) {
                return ctx.reply(
                  customDates.message,
                  keyboards.cancelBtn.resize()
                );
              }
              if (
                customDates.first_name == "" ||
                customDates.success === false
              ) {
                return ctx.reply(
                  "Ushbu fuqoroga tegishli ma'lumotlar topilmadi. PINFL to'g'ri kiritilganmikan tekshirib qaytadan kiriting",
                  keyboards.cancelBtn.resize().reply_markup
                ); // agarda ma'lumotlar topilmasa
              }

              await abonent.updateOne({
                $set: {
                  middle_name: customDates.middle_name,
                  first_name: customDates.first_name,
                  last_name: customDates.last_name,
                },
              });
              await ctx.reply(abonent.licshet);
              counter++;
              await download();
            }
            await download();

            ctx.scene.leave();

            fs.unlink(filename, (err) => {
              if (err) throw err;
            });
            ctx.telegram.deleteMessage(ctx.chat.id, waiterMessage.message_id);
            ctx.scene.leave();
          });
        });
      } else {
        return ctx.reply("Siz excel fayl kiritmadingiz", keyboards.cancelBtn);
      }
    } catch (error) {
      console.error(error);
    }
  }
);

vaqtinchalikFunc.enter((ctx) => {
  ctx.reply("Excel faylni kiriting");
});

module.exports = { vaqtinchalikFunc };
