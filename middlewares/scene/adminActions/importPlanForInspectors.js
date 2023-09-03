const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const https = require("https");
const fs = require("fs");
const excelToJson = require("convert-excel-to-json");
const { importPlanInspectorsFileId } = require("../../../constants");
const { Mahalla } = require("../../../models/Mahalla");
const isCancel = require("../../smallFunctions/isCancel");

const importPlanForInspectors = new Scenes.WizardScene(
  "import_plan_for_inspectors",
  async (ctx) => {
    try {
      if (isCancel(ctx.message.text)) return ctx.scene.leave();
      if (!ctx.message.document) {
        return ctx.reply(
          "Siz excel fayl yubormadingiz",
          keyboards.lotin.cancelBtn.resize()
        );
      }
      const { href } = await ctx.telegram.getFileLink(
        ctx.message.document.file_id
      );
      // if(!ctx.message.document.mime_type ==""){

      // }
      const filename = Date.now() + ".xls";
      const excelFile = fs.createWriteStream(filename);
      https.get(href, (res) => {
        res.pipe(excelFile);
        excelFile.on("finish", async (cb) => {
          excelFile.close(cb);
          const xls = excelToJson({ sourceFile: filename }).Sheet1;
          fs.unlink(filename, (err) => {
            if (err) throw err;
          });
          await Mahalla.updateMany(
            { __v: 0 },
            {
              $set: {
                reja: 0,
                activ: false,
                biriktirilganNazoratchi: {
                  activ: false,
                },
              },
            }
          );
          xls.forEach(async (row, i) => {
            if (i !== 0) {
              console.log(row);
              await Mahalla.updateOne(
                { id: row.A },
                {
                  $set: {
                    reja: row.C,
                    biriktirilganNazoratchi: {
                      inspector_name: row.E,
                      inspactor_id: row.D,
                    },
                  },
                }
              );
            }
          });
          ctx.reply(`Mahallalar rejasi muvaffaqqiyatli yangilandi`);
          return ctx.scene.leave();
        });
      });
    } catch (error) {
      console.log(error);
    }
  }
);

importPlanForInspectors.enter((ctx) => {
  ctx.replyWithDocument(importPlanInspectorsFileId, {
    caption: `Ushbu shablonga kerakli qiymatlarni joylashtirib menga qayta yuboring`,
    reply_markup: keyboards.lotin.cancelBtn.resize().reply_markup,
  });
});

importPlanForInspectors.leave((ctx) => {
  ctx.reply(
    messages[ctx.session.til ? ctx.session.til : "lotin"].heyAdmin,
    keyboards[
      ctx.session.til ? ctx.session.til : "lotin"
    ].adminKeyboard.resize()
  );
});

module.exports = importPlanForInspectors;
