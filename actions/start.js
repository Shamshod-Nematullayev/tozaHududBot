const { bot } = require("../core/bot");
const { Composer } = require("telegraf");
const { messages } = require("../lib/messages");
const { keyboards } = require("../lib/keyboards");
const { Abonent } = require("../models/YangiAbonent");
const { Admin } = require("../models/Admin");
const composer = new Composer();

composer.start(async (ctx) => {
  if (ctx.startPayload) {
    if (ctx.startPayload.split("_")[0] == "guvohnoma") {
      return ctx.reply("Hali bir qarorga kelmadim");
    }
    const abenent = await Abonent.findById(ctx.startPayload)
      .then(async () => {
        const admin = await Admin.findOne({ user_id: ctx.from.id });
        if (admin) {
          ctx.session.abonent_id = ctx.startPayload;
          ctx.scene.enter("answer_to_inspector");
        } else {
          ctx.reply(
            messages[ctx.session.til].youAreNotAdmin,
            keyboards[ctx.session.til].mainKeyboard.resize()
          );
        }
      })
      .catch((err) => {
        console.log(err);
        ctx.reply(messages[ctx.session.til].notFoundData);
      });
  } else {
    const admin = await Admin.findOne({ user_id: ctx.from.id });
    if (admin) {
      // Admin dashboard
      // ctx.reply(messages.startGreeting, keyboards[ctx.session.til].mainKeyboard.resize());
    } else {
      ctx.reply(
        messages[ctx.session.til].startGreeting,
        keyboards[ctx.session.til].mainKeyboard.resize()
      );
    }
  }
});

bot.use(composer.middleware());
