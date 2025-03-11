const { Composer, bot, keyboards, messages } = require("../requires");

const composer = new Composer();

composer.action("language", async (ctx) => {
  try {
    await ctx.deleteMessage();
    return ctx.reply(messages.chooseLanguage, keyboards.chooseLanguge);
  } catch (error) {
    console.error(error);
  }
});

composer.action("lotin_tili_tanlash", async (ctx) => {
  try {
    await ctx.deleteMessage();
    ctx.session.til = "lotin";
    ctx.reply(messages.choosedLang, keyboards.mainKeyboard.resize());
  } catch (error) {
    console.error(error);
  }
});

composer.action("kiril_tili_tanlash", async (ctx) => {
  try {
    await ctx.deleteMessage();
    ctx.session.til = "kiril";
    ctx.reply(messages.choosedLang, keyboards.mainKeyboard.resize());
  } catch (error) {
    console.error(error);
  }
});

bot.use(composer);
