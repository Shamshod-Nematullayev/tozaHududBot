import { bot } from "../core/bot.js";

import { Mahalla } from "@models/Mahalla.js";
bot.use(async (ctx, next) => {
  if (ctx.chat.id < 0 && !ctx.callbackQuery?.data) {
    if (ctx.message?.text == "chat_id") {
      ctx.reply(ctx.chat.id);
    }
    if (ctx.channelPost?.text == "chat_id") {
      ctx.reply(ctx.chat.id);
    }
    return;
  }
  next();
});
