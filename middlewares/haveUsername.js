const { bot } = require("../core/bot");
const { messages } = require("../lib/messages");

bot.use((ctx, next) => {
  if (ctx.message && ctx.message.from && ctx.chat.id > 0) {
    const username = ctx.message.from.username;
    username ? next() : ctx.reply(messages["lotin"].haveNotUsername);
  } else {
    next();
  }
});
