import { bot } from "../core/bot.js";

bot.use((ctx, next) => {
  if (ctx.session.til) {
    next();
  } else {
    ctx.session.til = "lotin";
    next();
  }
});
