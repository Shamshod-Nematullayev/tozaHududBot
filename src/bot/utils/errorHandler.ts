import { keyboards } from "@lib/keyboards";
import { Context } from "telegraf";

export function errorHandler(err: any, ctx: Context) {
  if (err?.message === "NO_ACCESS") {
    return ctx.reply("Sizda yetarli huquq yo‘q", keyboards.mainKeyboard);
  }
  if (err?.message === "NOT_FOUND") {
    return ctx.reply("Ma'lumot topilmadi");
  }

  console.error(err);
  ctx.reply("Kutilmagan xatolik yuz berdi");
}
