const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Abonent } = require("../../../models/YangiAbonent");
const isCancel = require("../../smallFunctions/isCancel");
const qaysiMahalla = require("../../smallFunctions/qaysiMahalla");

const importIncomeScene = new Scenes.WizardScene(
  "import_income_report",
  (ctx) => {
    if (
      ctx.message.document &&
      (ctx.message.document.mime_type ==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        ctx.message.document.mime_type == "application/vnd.ms-excel")
    ) {
      ctx.wizard.state.file_id = ctx.message.document.file_id;
      ctx.reply(
        messages.lotin.chooseIncomeType,
        keyboards.lotin.chooseIncomeType
      );
      ctx.wizard.next();
    } else {
      ctx.reply(messages.lotin.notExcelFile);
    }
  },
  (ctx) => {
    console.log(ctx.update);
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
    keyboards[ctx.session.til ? ctx.session.til : "lotin"].mainKeyboard.resize()
  );
});

module.exports = importIncomeScene;
