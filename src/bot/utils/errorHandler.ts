import { keyboards } from "@lib/keyboards.js";
import { Context } from "telegraf";

export enum ErrorTypes {
  NO_ACCESS = "NO_ACCESS",
  NOT_FOUND = "NOT_FOUND",
  BAD_REQUEST = "400 bad request",
}

export function errorHandler(err: any, ctx: Context) {
  if (err === ErrorTypes.NO_ACCESS) {
    return ctx.reply("Sizda yetarli huquq yo‘q", keyboards.cancelBtn.resize());
  }
  if (err === ErrorTypes.NOT_FOUND) {
    return ctx.reply("Ma'lumot topilmadi", keyboards.cancelBtn.resize());
  }
  if (err === ErrorTypes.BAD_REQUEST) {
    return ctx.reply("Kutilgan amal bajarilmadi", keyboards.cancelBtn.resize());
  }

  console.error(err);
  ctx.reply("Kutilmagan xatolik yuz berdi", keyboards.cancelBtn.resize());
}
