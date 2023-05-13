const { Scenes, Markup } = require("telegraf");
const { keyboards } = require("../../lib/keyboards");
const { messages } = require("../../lib/messages");
const { MultiplyRequest } = require("../../models/MultiplyRequest");
const { Picture } = require("../../models/Picture");
const isCancel = require("../smallFunctions/isCancel");

const multiplyLivingsScene = new Scenes.WizardScene(
  "multiply_livings",
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

      ctx.wizard.state.KOD = ctx.message.text;
      ctx.reply(
        messages[ctx.session.til].enterYashovchiSoni,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
      ctx.wizard.next();
    } catch (error) {
      console.log(error);
      ctx.reply("Xatolik");
    }
  },
  async (ctx) => {
    try {
      if (isCancel(ctx.message.text)) return ctx.scene.leave();
      if (isNaN(ctx.message.text)) {
        ctx.reply(
          messages[ctx.session.til].enterYashovchiSoni,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      } else {
        const abonents = require("../../lib/abonents.json");

        const abonent = abonents[Object.keys(abonents)[0]].filter((a) => {
          return a.litsavoy == ctx.wizard.state.KOD;
        })[0];
        if (abonent) {
          if (abonent.yashovchilar_soni < ctx.message.text) {
            ctx.scene.state.YASHOVCHILAR = parseInt(ctx.message.text);
            const request = new MultiplyRequest({
              ...ctx.wizard.state,
              date: Date.now(),
              from: ctx.from,
            });
            await request.save();
            ctx.reply(
              messages[ctx.session.til].accepted,
              Markup.keyboard(["Chiqish"])
            );
            ctx.telegram.sendMessage(
              process.env.CHANNEL,
              `#yashovchisoni by <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>\n<code>${ctx.wizard.state.KOD}</code>\n${ctx.message.text} kishi`,
              {
                parse_mode: "HTML",
                reply_markup: Markup.inlineKeyboard([
                  [Markup.button.callback("✅✅✅", "done_")],
                ]).reply_markup,
                disable_web_page_preview: true,
              }
            );
            ctx.wizard.next();
          } else {
            ctx.reply(messages[ctx.session.til].enterHigherNumber);
          }
        } else {
          ctx.reply(messages[ctx.session.til].abonentNotFound);
          ctx.scene.leave();
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
);
multiplyLivingsScene.enter((ctx) => {
  ctx.reply(
    messages[ctx.session.til].enterAbonentKod,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});
multiplyLivingsScene.leave((ctx) => {
  ctx.reply(
    messages[ctx.session.til].startGreeting,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});

module.exports = { multiplyLivingsScene };
