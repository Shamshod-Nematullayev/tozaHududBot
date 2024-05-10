const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { PhoneConnect } = require("../../../models/PhoneConnect");
const isCancel = require("../../smallFunctions/isCancel");

const connectPhoneNumber = new Scenes.WizardScene(
  "connect_phone_number",
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (!ctx.message || isNaN(ctx.message?.text))
        return ctx.reply(
          messages.enterOnlyNumber,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      if (ctx.message.text.length != 12)
        return ctx.reply(
          messages.enterFullNamber,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      const abonents = require("../../../lib/abonents.json");

      const abonent = abonents[Object.keys(abonents)[0]].filter((a) => {
        return a.litsavoy == ctx.message.text;
      })[0];
      if (abonent) {
        const request = await PhoneConnect.findOne({ KOD: ctx.message.text });
        if (request) {
          return ctx.reply(
            `🛑 Ushbu xisob raqamiga allaqachon telefon raqami biriktirilgan 🛑`
          );
          ctx.scene.leave();
        }
        ctx.wizard.state.abonent = abonent;
        ctx.wizard.state.KOD = ctx.message.text;
        ctx.replyWithHTML(
          `<b>${abonent.FISH}</b> ${abonent.MFY} MFY\n` +
            `Telefon raqamini kiriting misol: 992852536`,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
        ctx.wizard.next();
      } else {
        ctx.reply(messages.abonentNotFound);
      }
    } catch (error) {
      ctx.reply(`Xatolik haqida menga xabar bering`);
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (isNaN(ctx.message.text)) {
        return ctx.reply(
          messages.enterOnlyNumber,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      }

      if (ctx.message.text.length != 9) {
        return ctx.reply(`Telefon raqam noto'g'ri formatda yuborildi`);
      }
      ctx.wizard.state.phone = ctx.message.text;
      const request = await PhoneConnect.findOne({ phone: ctx.message.text });
      if (request) {
        return ctx.reply(
          `Ushbu telefon raqam ${request.KOD} hisob raqamiga allaqachon ulab bo'lingan, iltomos boshqa telefon raqami kiriting!`,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      }
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
    messages.startGreeting,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});

module.exports = { connectPhoneNumber };
