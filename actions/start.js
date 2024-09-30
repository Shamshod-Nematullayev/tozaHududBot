const { bot } = require("../core/bot");
const { Composer } = require("telegraf");
const { messages } = require("../lib/messages");
const { keyboards } = require("../lib/keyboards");
const { Admin } = require("../models/Admin");
const { Guvohnoma } = require("../models/Guvohnoma");
const { User } = require("../models/User");
const composer = new Composer();

composer.start(async (ctx) => {
  try {
    const admin = await Admin.findOne({ user_id: ctx.from.id });
    if (ctx.startPayload) {
      if (ctx.startPayload.split("_")[0] == "guvohnoma" && admin) {
        await Guvohnoma.findByIdAndUpdate(ctx.startPayload.split("_")[1], {
          $set: {
            holat: "BEKOR QILINDI",
          },
        }).then((guvohnoma) => {
          ctx.session.guvohnoma_id = guvohnoma._id;
          // ctx.telegram.
        });
        return ctx.scene.enter("cancel_guvohnoma");
      }
    } else {
      const admin = await Admin.findOne({ user_id: ctx.from.id });
      if (admin) {
        // Admin dashboard
        ctx.reply(
          messages.heyAdmin,
          keyboards[ctx.session.til].adminKeyboard.resize()
        );
      } else {
        const user = await User.findOne({ "user.id": ctx.chat.id });
        if (user.is_stm_xodimi) {
          return ctx.reply(
            "Asosiy menyu",
            keyboards.lotin.stm_xodimi_main_keyboard
          );
        }
        ctx.reply(
          messages.startGreeting,
          keyboards[ctx.session.til].mainKeyboard.resize()
        );
      }
    }
  } catch (err) {
    ctx.reply("Xatolik");
  }
});

bot.use(composer.middleware());
