import { NewAbonent } from "@models/NewAbonents.js";
import { Composer } from "telegraf";

const composer = new Composer();

composer.action(/newAbonentsList_/, async (ctx) => {
  try {
    await ctx.deleteMessage();
    if (!("data" in ctx.callbackQuery)) return;
    const abonents = await NewAbonent.find({
      mahalla_id: ctx.callbackQuery.data.split("_")[1],
    });
    let str = "";
    if (abonents.length == 0) {
      return ctx.reply("Abonentlar yo'q!");
    }
    abonents.forEach((abonent) => {
      str += `<b>${abonent.accountNumber}</b> = ${abonent.abonent_name}\n`;
    });
    ctx.replyWithHTML(str);
  } catch (err) {
    console.error(err);
    ctx.reply("Xatolik");
  }
});

export default composer;
