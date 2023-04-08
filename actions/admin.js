const { Composer } = require("telegraf");
const { bot } = require("../core/bot");
const { Admin } = require("../models/Admin");

const composer = new Composer();

composer.command("admin", async (ctx) => {
  const admins = await Admin.find();
  if (admins.length === 0) ctx.scene.enter("newAdmin");
});

bot.use(composer);
