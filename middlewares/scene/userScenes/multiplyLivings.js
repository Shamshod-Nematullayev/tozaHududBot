const { Scenes, Markup } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { MultiplyRequest } = require("../../../models/MultiplyRequest");
const isCancel = require("../../smallFunctions/isCancel");
const { Abonent } = require("../../../models/Abonent");

const multiplyLivingsScene = new Scenes.WizardScene(
  "multiply_livings",
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (isNaN(ctx.message.text))
        return ctx.reply(
          messages.enterOnlyNumber,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      if (ctx.message.text.length != 12)
        return ctx.reply(
          messages.enterFullNamber,
          keyboards[ctx.session.til].cancelBtn.resize()
        );

      const abonent = await Abonent.findOne({ licshet: ctx.message.text });

      if (!abonent) {
        return ctx.reply(messages.abonentNotFound);
      }

      ctx.wizard.state.abonent = abonent;
      ctx.wizard.state.KOD = ctx.message.text;
      ctx.replyWithHTML(
        `<b>${abonent.fio}</b> ${abonent.mahalla_name} MFY\n` +
          messages.enterYashovchiSoni,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
      ctx.wizard.next();
    } catch (error) {
      console.error(error);
      ctx.reply("Xatolik");
    }
  },
  async (ctx) => {
    try {
      if (isCancel(ctx.message.text)) return ctx.scene.leave();
      if (isNaN(ctx.message.text)) {
        ctx.reply(
          messages.enterYashovchiSoni,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      } else {
        ctx.scene.state.YASHOVCHILAR = parseInt(ctx.message.text);
        const request = new MultiplyRequest({
          ...ctx.wizard.state,
          date: Date.now(),
          from: ctx.from,
        });
        await request.save();
        ctx.reply(messages.accepted);
        ctx.telegram.sendMessage(
          process.env.CHANNEL,
          `#yashovchisoni by <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>\n<code>${ctx.wizard.state.licshet}</code>\n${ctx.message.text} kishi`,
          {
            parse_mode: "HTML",
            reply_markup: Markup.inlineKeyboard([
              [Markup.button.callback("✅✅✅", "done_" + request._id)],
            ]).reply_markup,
            disable_web_page_preview: true,
          }
        );
        ctx.scene.leave();
      }
    } catch (error) {
      console.log(error);
    }
  }
);
multiplyLivingsScene.enter((ctx) => {
  ctx.reply(
    messages.enterAbonentKod,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});
multiplyLivingsScene.leave((ctx) => {
  ctx.reply(
    messages.startGreeting,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});

module.exports = { multiplyLivingsScene };
