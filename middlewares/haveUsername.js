const { bot } = require("../core/bot");
const { messages } = require("../lib/messages");

bot.use((ctx, next) => {
  if (ctx.message && ctx.message.from) {
    const username = ctx.message.from.username;
    username ? next() : ctx.reply(messages.haveNotUsername);
  } else {
    next();
  }
});
