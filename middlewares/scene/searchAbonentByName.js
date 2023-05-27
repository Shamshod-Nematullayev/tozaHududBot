const { Scenes } = require("telegraf");
const { keyboards } = require("../../lib/keyboards");
const { messages } = require("../../lib/messages");
const isCancel = require("../smallFunctions/isCancel");
const { kirillga } = require("../smallFunctions/lotinKiril");

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
      ctx.reply("Xatolik", keyboards.lotin.cancelBtn.resize());
      console.log(error);
    }
  },
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      ctx.scene.state.FISH = ctx.message.text;
      const abonentsJSON = require("../../lib/abonents.json");
      const abonents = abonentsJSON[Object.keys(abonentsJSON)[0]];
      const abonent = abonents.filter((doc) => {
        return (
          doc.FISH.toLowerCase().search(
            kirillga(ctx.message.text.toLowerCase())
          ) >= 0 && doc.MFY_ID == ctx.wizard.state.MFY_ID
        );
      });
      if (abonent.length > 0) {
        let messageText = ``;
        abonent.forEach((doc, i) => {
          messageText += `${i + 1}. <code>${doc.litsavoy}</code> <b>${
            doc.FISH
          }</b> ${doc.hudud}\n`;
        });
        ctx.replyWithHTML(
          messageText,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      } else {
        ctx.reply(
          messages[ctx.session.til].notFoundData,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      }
    } catch (error) {
      console.log(error);
      ctx.scene.leave();
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
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});

module.exports = { searchAbonentbyName };
