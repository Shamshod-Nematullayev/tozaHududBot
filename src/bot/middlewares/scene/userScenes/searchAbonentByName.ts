import { Scenes, Markup } from "telegraf";

import { createInlineKeyboard, keyboards } from "@lib/keyboards.js";

import { messages } from "@lib/messages.js";

import isCancel from "../../smallFunctions/isCancel.js";
import { lotinga } from "../../smallFunctions/lotinKiril.js";

import { Nazoratchi } from "@models/Nazoratchi.js";
import { Abonent } from "@models/Abonent.js";
import { Mahalla } from "@models/Mahalla.js";
import { WizardWithState } from "@bot/helpers/WizardWithState.js";
import { isCallbackQueryMessage, isTextMessage } from "../utils/validator.js";
import { OldAbonent } from "@models/OldAbonent.js";

interface MyWizardState {
  mahallaId?: string;
  searchType?: "oldList" | "newList";
}
type Ctx = WizardWithState<MyWizardState>;

export const searchAbonentbyName = new Scenes.WizardScene<Ctx>(
  "SEARCH_BY_NAME",
  async (ctx) => {
    await ctx.reply(
      "Qaysi ro'yxat bo'yicha izlash qilasiz?",
      createInlineKeyboard([
        [["Eski ro'yxat bo'yicha", "oldList"]],
        [["Yangi ro'yxat bo'yicha", "newList"]],
      ])
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    // check access
    if (!isCallbackQueryMessage(ctx)) throw "400 bad request";
    ctx.wizard.state.searchType = ctx.callbackQuery.data as
      | "oldList"
      | "newList";
    await ctx.deleteMessage();
    const inspector = await Nazoratchi.findOne({
      telegram_id: ctx.from?.id,
      activ: true,
    });
    if (!inspector) throw "NO_ACCESS";
    // get mahallas and create buttons
    const mahallalar = await Mahalla.find({
      companyId: inspector.companyId,
    }).lean();
    const sortedMahallalar = mahallalar.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const buttons = sortedMahallalar.map((mfy) => [
      Markup.button.callback(mfy.name, "mahalla_" + mfy.id),
    ]);
    // send message
    ctx.reply(messages.enterMahalla, Markup.inlineKeyboard(buttons));
    ctx.wizard.next();
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) throw "400 bad request";
    const mfy_id = ctx.callbackQuery.data.split("_")[1];
    ctx.wizard.state.mahallaId = mfy_id;
    await ctx.deleteMessage();
    ctx.reply(messages.enterFISH);
    ctx.wizard.next();
  },
  async (ctx) => {
    if (!isTextMessage(ctx)) throw "400 bad request";
    if (ctx.wizard.state.searchType === "oldList") {
      const abonents = await OldAbonent.find({
        mahallaId: ctx.wizard.state.mahallaId,
      });
      const abonent = abonents.filter((doc) => {
        return (
          lotinga(doc.fullName)
            .toLowerCase()
            .search(lotinga(ctx.message.text.toLowerCase())) >= 0
        );
      });
      if (abonent.length < 1)
        return ctx.reply(messages.notFoundData, keyboards.cancelBtn.resize());

      if (abonent.length > 50) {
        return ctx.reply(
          "Qidiruv natijalari juda ko'p, iltimos ko'proq belgi kiriting"
        );
      }
      let messageText = `Eski ro'yxat bo'yicha qidiruv natijalari:\n`;
      abonent.forEach((doc, i) => {
        messageText += `${i + 1}. <code>${doc.accountNumber}</code> <b>${
          doc.fullName
        }</b>\n`;
      });
      ctx.replyWithHTML(messageText, keyboards.cancelBtn.resize());
    }
    if (ctx.wizard.state.searchType === "newList") {
      const abonents = await Abonent.find({
        mahallas_id: ctx.wizard.state.mahallaId,
      });
      const abonent = abonents.filter((doc) => {
        return (
          lotinga(doc.fio)
            .toLowerCase()
            .search(lotinga(ctx.message.text.toLowerCase())) >= 0
        );
      });
      if (abonent.length < 1)
        return ctx.reply(messages.notFoundData, keyboards.cancelBtn.resize());

      if (abonent.length > 50) {
        return ctx.reply(
          "Qidiruv natijalari juda ko'p, iltimos ko'proq belgi kiriting"
        );
      }
      let messageText = `Yangi ro'yxat bo'yicha qidiruv natijalari:\n`;
      abonent.forEach((doc, i) => {
        messageText += `${i + 1}. <code>${doc.licshet}</code> <b>${
          doc.fio
        }</b>\n`;
      });
      ctx.replyWithHTML(messageText, keyboards.cancelBtn.resize());
    }
  }
);

searchAbonentbyName.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.mainKeyboard);
    return ctx.scene.leave();
  }
  return next();
});
