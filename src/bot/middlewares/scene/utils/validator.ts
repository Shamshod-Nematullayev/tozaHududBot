import { Context } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";

export function isValidAccountNumber(text: string): boolean {
  return /^\d{12,}$/.test(text);
}

export function isTextMessage(
  ctx: Context
): ctx is Context & { message: { text: string } } {
  return !!ctx.message && "text" in ctx.message;
}

export function isDigitOnly(text: string) {
  return /^\d+$/.test(text);
}
