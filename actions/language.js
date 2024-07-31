const { Composer, bot, keyboards, messages } = require("../requires");

const composer = new Composer();

composer.action("language", (ctx) => {
  ctx.deleteMessage();
  return ctx.reply(
    messages.chooseLanguage,
    keyboards[ctx.session.til].chooseLanguge
  );
});

composer.action("lotin_tili_tanlash", (ctx) => {
  ctx.deleteMessage();
  ctx.session.til = "lotin";
  ctx.reply(
    messages.choosedLang,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});

composer.action("kiril_tili_tanlash", (ctx) => {
  ctx.deleteMessage();
  ctx.session.til = "kiril";
  ctx.reply(
    messages.choosedLang,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});

bot.use(composer);
