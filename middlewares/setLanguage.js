const { bot } = require("../core/bot");

bot.use((ctx, next) => {
  if (ctx.session.til) {
    next();
  } else {
    ctx.session.til = "lotin";
    next();
  }
});
