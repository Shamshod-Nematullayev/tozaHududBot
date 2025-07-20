import { keyboards } from "@lib/keyboards.js";
import { messages } from "@lib/messages.js";
import { Admin } from "@models/Admin.js";
import { Composer } from "telegraf";
import { MyContext } from "types/botContext";

const composer = new Composer<MyContext>();

composer.command("user", (ctx) => {
  ctx.reply(`Sizning id raqamingiz: <code> ${ctx.from.id}</code>`, {
    parse_mode: "HTML",
  });
});

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

export default composer;
