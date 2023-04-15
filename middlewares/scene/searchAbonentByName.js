const { Scenes } = require("telegraf");
const { keyboards } = require("../../lib/keyboards");
const { messages } = require("../../lib/messages");
const isCancel = require("../smallFunctions/isCancel");

const searchAbonentbyName = new Scenes.WizardScene(
  "SEARCH_BY_NAME",
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      const mfy_id = ctx.update.callback_query.data.split("_")[1];
      ctx.scene.state.MFY_ID = mfy_id;
      ctx.deleteMessage();
      ctx.reply(messages[ctx.session.til].enterFISH);
      ctx.wizard.next();
    } catch (error) {
      console.log(error);
    }
  },
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      ctx.scene.state.FISH = ctx.message.text;
    } catch (error) {
      console.log(error);
    }
  }
);
searchAbonentbyName.enter((ctx) => {
  ctx.reply(
    messages[ctx.session.til].enterMahalla,
    keyboards[ctx.session.til].mahallalar.oneTime()
  );
});
searchAbonentbyName.leave((ctx) => {
  ctx.reply(
    messages[ctx.session.til].startGreeting,
    keyboards[ctx.session.til].mainKeyboard
  );
});
