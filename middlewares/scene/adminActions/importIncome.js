const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Abonent } = require("../../../models/YangiAbonent");
const isCancel = require("../../smallFunctions/isCancel");
const qaysiMahalla = require("../../smallFunctions/qaysiMahalla");
const excelToJson = require("convert-excel-to-json");
const https = require("https");
const fs = require("fs");

const importIncomeScene = new Scenes.WizardScene(
  "import_income_report",
  async (ctx) => {
    console.log(ctx.message.document);
    if (isCancel(ctx.message.text)) return ctx.scene.leave();
    if (
      ctx.message.document &&
      (ctx.message.document.mime_type ==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        ctx.message.document.mime_type == "application/vnd.ms-excel")
    ) {
      // Agar nazoratchilar kesimida xisobot bo'lsa
      if (
        ctx.message.document.mime_type ==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        const xlsx = await ctx.telegram.getFileLink(
          ctx.message.document.file_id
        );
        const excelFile = fs.createWriteStream("./incomeReport.xls");
        https.get(xlsx.href, (res) => {
          res.pipe(excelFile);
          excelFile.on("finish", (cb) => {
            excelFile.close(cb);
            const xls = excelToJson({
              sourceFile: "./incomeReport.xls",
            });
            const sheet = xls[Object.keys(xls)[0]];
            const newJSON = {};
            newJSON.sana = sheet[0].A;
            newJSON.dan = sheet[2].B;
            newJSON.gacha = sheet[3].A;
            newJSON.nazoratchilar = sheet.slice(7, sheet.length - 1);
          });
        });
      }
      ctx.wizard.state.file_id = ctx.message.document.file_id;
      ctx.reply(
        messages.lotin.chooseIncomeType,
        keyboards.lotin.chooseIncomeType
      );
      // ctx.wizard.next();
    } else {
      ctx.reply(messages.lotin.notExcelFile);
    }
  },
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      console.log(ctx.update);
    } catch (error) {
      console.log(error);
    }
  }
);

importIncomeScene.enter((ctx) => {
  ctx.reply(
    messages[ctx.session.til].enterExcelFile,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});

importIncomeScene.leave((ctx) => {
  ctx.reply(
    messages[ctx.session.til ? ctx.session.til : "lotin"].startGreeting,
    keyboards[
      ctx.session.til ? ctx.session.til : "lotin"
    ].adminKeyboard.resize()
  );
});

module.exports = importIncomeScene;
