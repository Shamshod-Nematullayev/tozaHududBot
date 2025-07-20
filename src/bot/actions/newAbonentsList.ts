import { NewAbonent } from "@models/NewAbonents.js";
import { Composer, Markup } from "telegraf";

const composer = new Composer();

const PAGE_SIZE = 30;

composer.action(/newAbonentsList_(.+)/, async (ctx) => {
  try {
    if (!("data" in ctx.callbackQuery)) return;
    const dataParts = ctx.callbackQuery.data.split("_");
    const mahalla_id = dataParts[1];
    const page = parseInt(dataParts[2] || "1");
    const skip = (page - 1) * PAGE_SIZE;

    const abonents = await NewAbonent.find({
      mahalla_id,
    })
      .select(["accountNumber", "abonent_name"])
      .skip(skip)
      .limit(PAGE_SIZE);

    if (abonents.length == 0) {
      return ctx.reply("Abonentlar yo'q!");
    }
    let text = `<b>${page}-sahifa</b>\n\n`;
    abonents.forEach((abonent, i) => {
      text += `${skip + i + 1}. <code>${abonent.accountNumber}</code> <b>${
        abonent.abonent_name
      }</b>\n`;
    });
    const nextButton =
      abonents.length === PAGE_SIZE
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
  } catch (err) {
    console.error(err);
    ctx.reply("Xatolik");
  }
});

export default composer;
