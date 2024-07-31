const { Composer } = require("telegraf");
const { hisobot_3 } = require("../api/cleancity/stm_reports/hisobot_3");
const { bot } = require("../core/bot");
const { keyboards } = require("../lib/keyboards");
const { User } = require("../models/User");

const composer = new Composer();
async function isAdmin(ctx) {
  if (!ctx) return false;

  const admin = await User.find({
    "user.id": ctx.chat.id,
    is_stm_xodimi: true,
  });
  return admin ? true : false;
}

composer.command("stm", async (ctx, next) => {
  const user = await User.findOne({ "user.id": ctx.chat.id });
  if (user.is_stm_xodimi) {
    return ctx.reply("Asosiy menyu", keyboards.lotin.stm_xodimi_main_keyboard);
  }
  next();
});
composer.action("viloyat_hisobot_3", (ctx) => {
  hisobot_3(ctx);
});
composer.action("set_monthly_plan", async (ctx) => {
  if (!(await isAdmin(ctx))) {
    return ctx.reply(messages.youAreNotAdmin);
  }

  ctx.scene.enter(`set_monthly_plan`);
});

bot.use(composer);
