const { bot } = require("../core/bot");
const { messages } = require("../lib/messages");

bot.use((ctx, next) => {
  if (ctx.session.til) {
    next();
  } else {
    ctx.session.til = "lotin";
    next();
  }
});
