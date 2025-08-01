import { Composer } from "telegraf";

const composer = new Composer();
composer.use((ctx, next) => {
  if (ctx.session.til) {
    next();
  } else {
    ctx.session.til = "lotin";
    next();
  }
});

export default composer;
