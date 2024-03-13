const { bot } = require("../core/bot");
const { messages } = require("../lib/messages");

bot.use(async (ctx, next) => {
  if (ctx.from.id == 5347896070) {
  }
  if (ctx.message && ctx.message.from && ctx.chat.id > 0) {
    const username = ctx.message.from.username;
    username ? next() : ctx.reply(messages.haveNotUsername);
  } else {
    next();
  }
});
