const { Composer } = require("telegraf");
const { bot } = require("../core/bot");
const { keyboards } = require("../lib/keyboards");
const { messages } = require("../lib/messages");

const composer = new Composer();
composer.action("language", (ctx) => {
  ctx.reply(
    messages[ctx.session.til ? ctx.session.til : "lotin"].chooseLanguage,
    keyboards.chooseLanguge
  );
});
composer.action("lotin_tili_tanlash", (ctx) => {
  ctx.session.til = "lotin";
  ctx.reply(
    messages[ctx.session.til ? ctx.session.til : "lotin"].choosedLang,
    keyboards.mainKeyboard.resize()
  );
});
composer.action("kiril_tili_tanlash", (ctx) => {
  ctx.session.til = "kiril";
  ctx.reply(
    messages[ctx.session.til ? ctx.session.til : "lotin"].choosedLang,
    keyboards.mainKeyboard.resize()
  );
});

bot.use(composer);
