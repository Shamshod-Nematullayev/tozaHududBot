import { Composer } from "telegraf";
import { keyboards } from "@lib/keyboards.js";
import { messages } from "@lib/messages.js";
import { MyContext, MyWizardSession } from "types/botContext";

const composer = new Composer<MyContext>();

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
    (ctx.session as MyWizardSession).til = "lotin";
    ctx.reply(messages.choosedLang, keyboards.mainKeyboard.resize());
  } catch (error) {
    console.error(error);
  }
});

composer.action("kiril_tili_tanlash", async (ctx) => {
  try {
    await ctx.deleteMessage();
    (ctx.session as MyWizardSession).til = "kiril";
    ctx.reply(messages.choosedLang, keyboards.mainKeyboard.resize());
  } catch (error) {
    console.error(error);
  }
});

export default composer;
