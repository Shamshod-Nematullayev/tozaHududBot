import { Composer } from "telegraf";

import { User } from "@models/User.js";

const composer = new Composer();

composer.use(async (ctx, next) => {
  const user = await User.findOne({ "user.id": ctx.from?.id });
  if (user) return next();
  await User.create({
    user: { ...ctx.from },
    created: Date.now(),
  });
  return next();
});

export default composer;
