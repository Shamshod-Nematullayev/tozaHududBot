const { bot } = require("../core/bot");

bot.use((ctx, next) => {
  if (ctx.chat.id < 0) {
  } else {
    next();
  }
});
