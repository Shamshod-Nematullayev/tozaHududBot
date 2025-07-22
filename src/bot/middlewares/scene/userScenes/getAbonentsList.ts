import { WizardWithState } from "@bot/helpers/WizardWithState";
import isCancel from "@bot/middlewares/smallFunctions/isCancel";
import { createInlineKeyboard, keyboards } from "@lib/keyboards";
import { Mahalla } from "@models/Mahalla.js";
import { Nazoratchi } from "@models/Nazoratchi";
import { Markup, Scenes } from "telegraf";
import { isCallbackQueryMessage, isTextMessage } from "../utils/validator";
import { getAbonentsByMfyId } from "routers/controllers/utils/getAbonensByMfyId";
import ejs from "ejs";
import path from "path";
import { createPdfFromHtml } from "helpers/createPdfFromHtml";
import { createImgFromHtml } from "helpers/createImgFromHtml";

interface MyWizardState {
  companyId?: number;
  mahallaId?: string;
  elektrKodStatus?: "confirmed" | "notConfirmed" | "all";
  pnflStatus?: "confirmed" | "notConfirmed" | "all";
  minSaldo?: number;
  maxSaldo?: number;
  format?: "pdf" | "picture";
  session?: any;
}
type Ctx = WizardWithState<MyWizardState>;

export const getAbonentsList = new Scenes.WizardScene<Ctx>(
  "getAbonentsList",
  async (ctx) => {
    const inspector = await Nazoratchi.findOne({ telegram_id: ctx.from?.id });
    if (!inspector) {
      ctx.scene.leave();
      throw new Error("NO_ACCESS");
    }
    ctx.wizard.state.companyId = inspector.companyId;
    const mahallalar = await Mahalla.find({
      companyId: inspector.companyId,
      "biriktirilganNazoratchi.inspactor_id": inspector.id,
    });
    if (!mahallalar.length) {
      ctx.scene.leave();
      return await ctx.reply("Sizga biriktirilgan mahallalar yo'q!");
    }
    const keys = mahallalar.map((mfy) => [
      Markup.button.callback(mfy.name, `${mfy.id}`),
    ]);
    await ctx.reply("Mahallani tanlang!", Markup.inlineKeyboard(keys));
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) return;
    await ctx.deleteMessage();
    ctx.wizard.state.mahallaId = ctx.callbackQuery.data;
    await ctx.reply(
      "Shaxsi tasdiqlandi holatini tanlang!",
      createInlineKeyboard([
        [["✅ Tasdiqlangan", "confirmed"]],
        [["❌ Tasdiqlanmagan", "notConfirmed"]],
        [["Barchasi", "all"]],
      ])
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) return;
    ctx.wizard.state.elektrKodStatus = ctx.callbackQuery.data as
      | "confirmed"
      | "notConfirmed"
      | "all";
    await ctx.deleteMessage();
    await ctx.reply(
      "PNFL holatini tanlang!",
      createInlineKeyboard([
        [["✅ Tasdiqlangan", "confirmed"]],
        [["❌ Tasdiqlanmagan", "notConfirmed"]],
        [["Barchasi", "all"]],
      ])
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) return;
    await ctx.deleteMessage();
    ctx.wizard.state.pnflStatus = ctx.callbackQuery.data as
      | "confirmed"
      | "notConfirmed"
      | "all";
    await ctx.reply("Minimum qarzdorlik summasini kiriting");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isTextMessage(ctx)) return;
    await ctx.deleteMessage();
    ctx.wizard.state.minSaldo = Number(ctx.message.text);
    await ctx.reply("Maksimum qarzdorlik summasini kiriting");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isTextMessage(ctx)) return;
    await ctx.deleteMessage();
    ctx.wizard.state.maxSaldo = Number(ctx.message.text);
    await ctx.reply(
      "Formatni tanlang!",
      createInlineKeyboard([
        [
          ["PDF", "pdf"],
          ["Rasm", "picture"],
        ],
      ])
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) return;
    ctx.wizard.state.format = ctx.callbackQuery.data as "pdf" | "picture";
    await ctx.deleteMessage();
    const abonents = await getAbonentsByMfyId({
      params: { mfy_id: ctx.wizard.state.mahallaId as string },
      query: {
        etkStatus:
          ctx.wizard.state.elektrKodStatus == "confirmed"
            ? "true"
            : ctx.wizard.state.elektrKodStatus == "notConfirmed"
            ? "false"
            : undefined,
        identified:
          ctx.wizard.state.pnflStatus == "confirmed"
            ? "true"
            : ctx.wizard.state.pnflStatus == "notConfirmed"
            ? "false"
            : undefined,
        minSaldo: ctx.wizard.state.minSaldo,
        maxSaldo: ctx.wizard.state.maxSaldo,
      },
      user: {
        companyId: ctx.wizard.state.companyId as number,
      },
    });

    const html = await ejs.renderFile(
      path.join(process.cwd(), "src", "views", "<ABONENTS_LIST_EJS_PATH>"), // TODO
      { abonents }
    );
    if (ctx.wizard.state.format === "pdf") {
      const pdf = await createPdfFromHtml(html);
      await ctx.replyWithDocument({ source: Buffer.from(pdf) });
    } else {
      const img = (await createImgFromHtml({
        html: html,
        encoding: "binary",
        type: "png",
        selector: "div",
      })) as string;
      await ctx.replyWithPhoto({ source: Buffer.from(img, "binary") });
    }
    return ctx.scene.leave();
  }
);

getAbonentsList.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Asosiy menyu", keyboards.mainKeyboard);
    return ctx.scene.leave();
  }
  return next();
});
