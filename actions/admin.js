const { Composer } = require("telegraf");
const { bot } = require("../core/bot");
const { keyboards } = require("../lib/keyboards");
const { messages } = require("../lib/messages");
const { Admin } = require("../models/Admin");

const composer = new Composer();
async function isAdmin(ctx) {
  const admins = await Admin.find();
  let confirm = false;
  admins.forEach((admin) => {
    if (admin.user_id == ctx.from.id) {
      confirm = true;
    }
  });
  return confirm;
}
composer.command("admin", async (ctx) => {
  const admins = await Admin.find();
  if (admins.length === 0) ctx.scene.enter("newAdmin");
});

composer.hears("👨‍💻 Ish maydoni", async (ctx) => {
  const confirm = isAdmin(ctx);
  if (!confirm) {
    ctx.reply(messages.lotin.youAreNotAdmin);
  } else {
    ctx.reply(messages.lotin.chooseMenu, keyboards.lotin.adminWorkSpace);
  }
});

composer.hears(["Тушумни ташлаш", "Tushumni tashlash"], (ctx) => {
  const confirm = isAdmin(ctx);
  if (!confirm) {
    ctx.reply(messages.lotin.youAreNotAdmin);
  } else {
    ctx.scene.enter("import_income_report");
  }
});

composer.action("add_notification_letter", (ctx) => {
  const confirm = isAdmin(ctx);
  if (!confirm) {
    ctx.reply(messages.lotin.youAreNotAdmin);
  } else {
    ctx.scene.enter("add_notification");
  }
});

composer.action("show_abonent_pic", (ctx) => {
  ctx.scene.enter("show_abonent_pic");
});

bot.use(composer);
