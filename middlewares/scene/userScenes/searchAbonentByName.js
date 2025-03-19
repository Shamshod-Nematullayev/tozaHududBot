const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Abonent } = require("../../../models/Abonent");
const isCancel = require("../../smallFunctions/isCancel");
const { kirillga, lotinga } = require("../../smallFunctions/lotinKiril");

const searchAbonentbyName = new Scenes.WizardScene(
  "SEARCH_BY_NAME",
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      const mfy_id = ctx.update.callback_query.data.split("_")[1];
      ctx.scene.state.MFY_ID = mfy_id;
      await ctx.deleteMessage();
      ctx.reply(messages.enterFISH);
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Xatolik", keyboards.cancelBtn.resize());
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if ((ctx.message && isCancel(ctx.message.text)) || !ctx.message)
        return ctx.scene.leave();
      ctx.scene.state.FISH = ctx.message.text;
      const abonents = await Abonent.find({
        mahallas_id: ctx.wizard.state.MFY_ID,
      });
      const abonent = abonents.filter((doc) => {
        return (
          lotinga(doc.fio)
            .toLowerCase()
            .search(lotinga(ctx.message.text.toLowerCase())) >= 0 &&
          doc.mahallas_id == ctx.wizard.state.MFY_ID
        );
      });
      if (abonent.length < 1)
        return ctx.reply(messages.notFoundData, keyboards.cancelBtn.resize());
      if (abonent.length > 50) {
        return ctx.reply(
          "Qidiruv natijalari juda ko'p, iltimos ko'proq belgi kiriting"
        );
      }
      let messageText = ``;
      abonent.forEach((doc, i) => {
        messageText += `${i + 1}. <code>${doc.licshet}</code> <b>${
          doc.fio
        }</b> ${doc.streets_name}\n`;
      });
      ctx.replyWithHTML(messageText, keyboards.cancelBtn.resize());
    } catch (error) {
      console.log(error);
      ctx.scene.leave();
    }
  }
);
searchAbonentbyName.enter((ctx) => {
  ctx.reply(messages.enterMahalla, keyboards.mahallalar.oneTime());
});
searchAbonentbyName.leave((ctx) => {
  ctx.reply(messages.startGreeting, keyboards.mainKeyboard.resize());
});

module.exports = { searchAbonentbyName };
