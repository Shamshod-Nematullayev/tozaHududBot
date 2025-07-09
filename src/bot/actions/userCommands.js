// requires
import { Markup } from "telegraf";
import { Mahalla } from "@models/Mahalla";
import { NewAbonent } from "@models/NewAbonents";
import { Composer } from "telegraf";
import { Nazoratchi } from "@models/Nazoratchi";
import { Admin } from "@models/Admin";
import { Abonent } from "@models/Abonent";
import { Target } from "@models/TargetAbonent";
import { kirillga } from "../middlewares/smallFunctions/lotinKiril";
import { createTozaMakonApi } from "../../api/tozaMakon";
import { bot } from "@bot/core/bot";
import { messages } from "@lib/messages";
import { keyboards } from "@lib/keyboards";
bot.telegram.deleteMyCommands();

const composer = new Composer();
composer.command("user", (ctx) => {
  ctx.reply(`Sizning id raqamingiz: <code> ${ctx.from.id}</code>`, {
    parse_mode: "HTML",
  });
});

composer.action(/newAbonentsList_/, async (ctx) => {
  try {
    await ctx.deleteMessage();
    const abonents = await NewAbonent.find({
      mahalla_id: ctx.callbackQuery.data.split("_")[1],
    });
    let str = "";
    if (abonents.length == 0) {
      return ctx.reply("Abonentlar yo'q!");
    }
    abonents.forEach((abonent) => {
      str += `<b>${abonent.licshet}</b> = ${abonent.abonent_name}\n`;
    });
    ctx.replyWithHTML(str);
  } catch (err) {
    console.error(err);
    ctx.reply("Xatolik");
  }
});

composer.action("getTargets", async (ctx) => {
  try {
    await ctx.deleteMessage();
    const inspector = await Nazoratchi.findOne({
      telegram_id: ctx.from.id,
    });
    if (!inspector || !inspector.activ)
      return ctx.reply("Sizga ruxsat berilmagan!", keyboards.cancelBtn);

    const mahallalar = await Mahalla.find({
      "biriktirilganNazoratchi.inspactor_id": inspector.id,
    });
    if (!mahallalar.length)
      return ctx.reply("Sizga biriktirilgan mahallalar yo'q!");

    const keys = mahallalar.map((mfy) => [
      Markup.button.callback(mfy.name, `getTargets_${mfy.id}`),
    ]);
    ctx.reply("Mahallani tanlang!", Markup.inlineKeyboard(keys));
  } catch (error) {
    ctx.reply("Xatolik mainCommands.js");
    console.error(error);
  }
});

composer.action(/getTargets_/, async (ctx) => {
  try {
    await ctx.deleteMessage();
    const mahalla_id = ctx.callbackQuery.data.split("_")[1];
    const targets = await Target.find({ mahalla_id });
    if (!targets.length) return ctx.reply("Ro'yxat bo'sh");

    let text = ``;
    targets.forEach((target, index) => {
      text += `${index + 1}. <code>${target.accountNumber}</code> <b>${
        target.fullName
      }</b>\n`;
    });
    ctx.replyWithHTML(text);
  } catch (error) {
    ctx.reply("Xatolik mainCommands.js");
    console.error(error);
  }
});

// Entering to scene by inline buttons
const actions = [
  "GUVOHNOMA_KIRITISH",
  "multiply_livings",
  "update_abonent_date_by_pinfil",
  "connect_phone_number",
  "changeAbonentStreet",
  "createTarget",
];

actions.forEach((action) => {
  composer.action(action, async (ctx) => {
    try {
      const nazoratchi = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      if (!nazoratchi) {
        return await ctx.reply(
          "Ushbu amaliyotni bajarish uchun yetarli huquqqa ega emassiz"
        );
      }
      ctx.scene.enter(action);
      await ctx.deleteMessage();
    } catch (error) {}
  });
});

bot.use(composer);
