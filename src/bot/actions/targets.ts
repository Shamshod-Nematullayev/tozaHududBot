import { errorHandler } from "@bot/utils/errorHandler.js";
import { getInspector } from "@bot/utils/getInspector.js";
import { keyboards } from "@lib/keyboards.js";
import { Mahalla } from "@models/Mahalla.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { Target } from "@models/TargetAbonent.js";
import { Composer, Markup } from "telegraf";

const composer = new Composer();

const PAGE_SIZE = 30;
composer.action("getTargets", async (ctx) => {
  // 1. check access and get consts
  const inspector = await getInspector(ctx.from.id);

  const mahallalar = await Mahalla.find({
    "biriktirilganNazoratchi.inspactor_id": inspector.id,
  });
  if (!mahallalar.length)
    return ctx.reply("Sizga biriktirilgan mahallalar yo'q!");

  const keys = mahallalar.map((mfy) => [
    Markup.button.callback(mfy.name, `getTargets_${mfy.id}`),
  ]);
  await ctx.deleteMessage();
  await ctx.reply("Mahallani tanlang!", Markup.inlineKeyboard(keys));
});

composer.action(/getTargets_(.+)/, async (ctx) => {
  const dataParts = ctx.match[1].split("-");
  const mahalla_id = dataParts[0];
  const page = parseInt(dataParts[1] || "1");

  const skip = (page - 1) * PAGE_SIZE;

  const targets = await Target.find({ mahalla_id })
    .select(["accountNumber", "fullName"])
    .skip(skip)
    .limit(PAGE_SIZE);

  if (!targets.length) return ctx.reply("Ma'lumot topilmadi.");

  let text = `<b>${page}-sahifa</b>\n\n`;
  targets.forEach((t, i) => {
    text += `${skip + i + 1}. <code>${t.accountNumber}</code> <b>${
      t.fullName
    }</b>\n`;
  });

  const nextButton =
    targets.length === PAGE_SIZE
      ? [
          Markup.button.callback(
            "➡️ Davom etish",
            `getTargets_${mahalla_id}-${page + 1}`
          ),
        ]
      : [];

  if (page > 1) {
    nextButton.unshift(
      Markup.button.callback(
        "⬅️ Orqaga",
        `getTargets_${mahalla_id}-${page - 1}`
      )
    );
  }
  await ctx.deleteMessage();
  await ctx.replyWithHTML(text, Markup.inlineKeyboard(nextButton));
});

export default composer;
