import { bot } from "../core/bot";

import { User } from "@models/User";

bot.use(async (ctx, next) => {
  const users = await User.find();
  let topildi = false;
  users.forEach((user) => {
    if (user.user.id == ctx.from.id) {
      topildi = true;
    }
  });
  if (topildi) return next();
  const newUser = new User({ user: { ...ctx.from }, created: Date.now() });
  await newUser.save().then(() => {
    next();
  });
});
