import { WizardWithState } from "@bot/helpers/WizardWithState";
import isCancel from "@bot/middlewares/smallFunctions/isCancel.js";
import { createInlineKeyboard, keyboards } from "@lib/keyboards.js";
import { Mahalla } from "@models/Mahalla.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { Markup, Scenes } from "telegraf";
import { isCallbackQueryMessage, isTextMessage } from "../utils/validator.js";
import { getAbonentsByMfyId } from "routers/controllers/utils/getAbonensByMfyId.js";
import ejs from "ejs";
import path from "path";
import { createPdfFromHtml } from "helpers/createPdfFromHtml.js";
import { createImgFromHtml } from "helpers/createImgFromHtml.js";
import { Company } from "@models/Company.js";
import { chunkArray } from "helpers/chunkArray.js";
import { InputMediaPhoto } from "telegraf/typings/core/types/typegram";

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
      throw "NO_ACCESS";
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
    if (!isCallbackQueryMessage(ctx)) throw "400 bad request";
    await ctx.deleteMessage();
    ctx.wizard.state.mahallaId = ctx.callbackQuery.data;
    await ctx.reply(
      "ELEKTR KODI holatini tanlang!",
      createInlineKeyboard([
        [["✅ Tasdiqlangan", "confirmed"]],
        [["❌ Tasdiqlanmagan", "notConfirmed"]],
        [["Barchasi", "all"]],
      ])
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) throw "400 bad request";
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
    if (!isCallbackQueryMessage(ctx)) throw "400 bad request";
    await ctx.deleteMessage();
    ctx.wizard.state.pnflStatus = ctx.callbackQuery.data as
      | "confirmed"
      | "notConfirmed"
      | "all";
    await ctx.reply(
      "Minimum qarzdorlik summasini kiriting",
      Markup.keyboard([
        ["100000", "200000"],
        ["300000", "400000"],
        ["Barchasi"],
      ]).resize()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isTextMessage(ctx)) throw "400 bad request";
    if (ctx.message.text !== "Barchasi")
      ctx.wizard.state.minSaldo = Number(ctx.message.text);
    await ctx.reply(
      "Maksimum qarzdorlik summasini kiriting",
      Markup.keyboard([
        ["100000", "200000"],
        ["300000", "400000"],
        ["Barchasi"],
      ]).resize()
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!isTextMessage(ctx)) throw "400 bad request";
    if (ctx.message.text !== "Barchasi")
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
    if (!isCallbackQueryMessage(ctx)) throw "400 bad request";
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

    const company = await Company.findOne({ id: ctx.wizard.state.companyId });

    const mahalla = await Mahalla.findOne({ id: ctx.wizard.state.mahallaId });
    if (ctx.wizard.state.format === "pdf") {
      const html = await ejs.renderFile(
        path.join(process.cwd(), "src", "views", "abonentsList.ejs"),
        { abonents, company, isWithTitle: true }
      );
      const pdf = await createPdfFromHtml(html, {
        bottom: "5mm",
        left: "5mm",
        right: "5mm",
        top: "5mm",
      });
      await ctx.replyWithDocument({
        source: Buffer.from(pdf),
        filename: mahalla?.name + ".pdf",
      });
    } else {
      let imgs: InputMediaPhoto[] = [];
      const chunks = chunkArray(abonents, 50);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const html = await ejs.renderFile(
          path.join(process.cwd(), "src", "views", "abonentsList.ejs"),
          {
            abonents: chunk,
            company: company,
            isWithTitle: i === 0 ? true : false,
          }
        );
        const img = (await createImgFromHtml({
          html: html,
          encoding: "binary",
          type: "png",
          selector: "div",
        })) as string;
        imgs.push({ media: { source: Buffer.from(img) }, type: "photo" });
      }
      await ctx.replyWithMediaGroup(imgs);
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
