import { bot } from "../core/bot";

import { Mahalla } from "@models/Mahalla";
bot.use(async (ctx, next) => {
  console.log(ctx.chat.id, ctx.message.message_id);
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
