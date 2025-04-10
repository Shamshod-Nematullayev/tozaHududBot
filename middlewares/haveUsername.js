const { bot } = require("../core/bot");
const { messages } = require("../lib/messages");

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
