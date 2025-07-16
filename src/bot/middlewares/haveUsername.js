import { bot } from "../core/bot.js";

import { messages } from "../lib/messages.js";

bot.use(async (ctx, next) => {
  try {
    if (ctx.message && ctx.message.from && ctx.chat.id > 0) {
      const username = ctx.message.from.username;
      username
        ? next()
        : await ctx.reply(messages.haveNotUsername).catch((err) => {
            console.log(err);
          });
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
  }
});
