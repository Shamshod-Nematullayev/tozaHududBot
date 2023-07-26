const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const isCancel = require("../../smallFunctions/isCancel");
const excelToJson = require("convert-excel-to-json");
const https = require("https");
const fs = require("fs");
const qaysiMahalla = require("../../smallFunctions/qaysiMahalla");
const nodeHtmlToImage = require("node-html-to-image");

const importPlanForInspectors = new Scenes.WizardScene(
  "import_plan_for_inspectors",
  (ctx) => {}
);

importPlanForInspectors.enter((ctx) => {
  ctx.reply(
    `Ushbu shablonga kerakli qiymatlarni joylashtirib menga qayta yuboring`,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
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
