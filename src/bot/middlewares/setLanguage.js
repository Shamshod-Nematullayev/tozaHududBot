import { Composer } from "telegraf";

const composer = new Composer();
composer.use((ctx, next) => {
  if (!ctx.session) ctx.session = {};
  return next();
});

export default composer;
