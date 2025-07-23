import { keyboards } from "@lib/keyboards.js";
import { Context } from "telegraf";

export function errorHandler(err: any, ctx: Context) {
  if (err === "NO_ACCESS") {
    return ctx.reply("Sizda yetarli huquq yo‘q", keyboards.mainKeyboard);
  }
  if (err === "NOT_FOUND") {
    return ctx.reply("Ma'lumot topilmadi");
  }
  if (err === "400 bad request") {
    return ctx.reply("Kutilgan amal bajarilmadi", keyboards.cancelBtn.resize());
  }

  console.error(err);
  ctx.reply("Kutilmagan xatolik yuz berdi");
}
