import { Context } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";

export function isValidAccountNumber(text: string): boolean {
  return /^\d{12,}$/.test(text);
}

export function isTextMessage(ctx: Context): boolean {
  return Boolean(ctx.message && "text" in ctx.message);
}
