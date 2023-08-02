const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { PhoneConnect } = require("../../../models/PhoneConnect");
const isCancel = require("../../smallFunctions/isCancel");

const connectPhoneNumber = new Scenes.WizardScene(
  "connect_phone_number",
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (isNaN(ctx.message.text))
        return ctx.reply(
          messages[ctx.session.til].enterOnlyNumber,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      if (ctx.message.text.length != 12)
        return ctx.reply(
          messages[ctx.session.til].enterFullNamber,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      const abonents = require("../../../lib/abonents.json");

      const abonent = abonents[Object.keys(abonents)[0]].filter((a) => {
        return a.litsavoy == ctx.message.text;
      })[0];
      if (abonent) {
        ctx.wizard.state.abonent = abonent;
        ctx.wizard.state.KOD = ctx.message.text;
        ctx.replyWithHTML(
          `<b>${abonent.FISH}</b> ${abonent.MFY} MFY\n` +
            `Telefon raqamini kiriting misol: 992852536`,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
        ctx.wizard.next();
      } else {
        ctx.reply(messages[ctx.session.til].abonentNotFound);
      }
    } catch (error) {
      ctx.reply(`Xatolik haqida menga xabar bering`);
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      if (isNaN(ctx.message.text)) {
        return ctx.reply(messages[ctx.session.til].enterOnlyNumber);
      }

      if (ctx.message.text.length != 9) {
        return ctx.reply(`Telefon raqam noto'g'ri formatda yuborildi`);
      }
      ctx.wizard.state.phone = ctx.message.text;
      await PhoneConnect.create({
        ...ctx.wizard.state,
        from: ctx.message.from,
      });
      ctx.reply(`Muvaffaqqiyatli qo'shildi`);
      return ctx.scene.leave();
    } catch (error) {
      ctx.reply(`Xatolik haqida menga xabar bering`);
      console.log(error);
    }
  }
);

connectPhoneNumber.enter((ctx) => {
  ctx.reply(
    `Abonent listavoy kodini kiriting`,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});
connectPhoneNumber.leave((ctx) => {
  ctx.reply(
    messages[ctx.session.til].startGreeting,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});

module.exports = { connectPhoneNumber };
