const { Scenes } = require("telegraf");
const { keyboards } = require("../../lib/keyboards");
const { messages } = require("../../lib/messages");
const abonentlarJSON = require("../../lib/abonents.json");
const isCancel = require("../smallFunctions/isCancel");
const lastUpdate = abonentlarJSON.oxirgi_yangilanish;

function findById(id) {
  let res;
  abonentlarJSON.Report.map((abonent) => {
    if (abonent.litsavoy == id) res = abonent;
  });
  return res;
}
const findAbonentScene = new Scenes.WizardScene("searchByID", (ctx) => {
  try {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();

    if (isNaN(ctx.message.text)) {
      ctx.reply(messages.enterOnlyNumber, keyboards.cancelBtn.resize());
    } else if (ctx.message.text.length !== 12) {
      ctx.reply(messages.enterFullNamber, keyboards.cancelBtn.resize());
    } else {
      const abonent = findById(ctx.message.text);
      abonent
        ? ctx.replyWithHTML(
            `${abonent.FISH}\nMFY: ${abonent.MFY}\nhudud: ${
              abonent.hudud
            }\nyashovchilar_soni: ${
              abonent.yashovchilar_soni
            } ta\nsaldo boshi: <b>${abonent.saldo_boshi}</b>\nxisoblandi: ${
              abonent.xisoblandi
            }\nakt: ${abonent.akt}\nshartnoma_sanasi: ${
              abonent.shartnoma_sanasi.oy
            }.${abonent.shartnoma_sanasi.yil}\nkadastr: ${
              abonent.kadastr
            }\ntelefon: ${abonent.telefon}\n oxirgi to'lov: <b>${
              abonent.oxirgi_tulov_summa + "</b> " + abonent.oxirgi_tulov_vaqti
            }\nETK_raqam: ${
              abonent.ETK_raqam
            }\n\n<i>Oxirgi yangilanish ${lastUpdate}</i>`,
            keyboards.cancelBtn.resize()
          )
        : ctx.reply(messages.notFoundData, keyboards.cancelBtn.resize());
    }
  } catch (error) {}
});
findAbonentScene.enter((ctx) => {
  ctx.reply(messages.enterLitsavoy, keyboards.cancelBtn.resize());
});
findAbonentScene.leave((ctx) => {
  ctx.reply(messages.startGreeting, keyboards.mainKeyboard.resize());
});

module.exports = findAbonentScene;
