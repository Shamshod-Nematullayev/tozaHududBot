import { bot } from "../core/bot.js";
import { Composer } from "telegraf";
import { messages } from "@lib/messages.js";
import { keyboards } from "@lib/keyboards.js";
import { Admin } from "@models/Admin.js";
import { Guvohnoma } from "@models/Guvohnoma.js";
import { User } from "@models/User.js";
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
        ctx.reply(messages.heyAdmin, keyboards.adminKeyboard.resize());
      } else {
        const user = await User.findOne({ "user.id": ctx.chat.id });
        ctx.reply(messages.startGreeting, keyboards.mainKeyboard.resize());
      }
    }
  } catch (err) {
    ctx.reply("Xatolik");
  }
});

bot.use(composer.middleware());
