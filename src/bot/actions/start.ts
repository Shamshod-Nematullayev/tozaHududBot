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

    if (admin) {
      // Admin dashboard
      return await ctx.reply(
        messages.heyAdmin,
        keyboards.adminKeyboard.resize()
      );
    }
    ctx.reply(messages.startGreeting, keyboards.mainKeyboard.resize());
  } catch (err) {
    ctx.reply("Xatolik");
  }
});

bot.use(composer.middleware());
