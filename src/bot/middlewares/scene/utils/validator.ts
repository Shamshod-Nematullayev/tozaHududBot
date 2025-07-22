import { Admin } from "@models/Admin.js";
import { Context } from "telegraf";

export function isValidAccountNumber(text: string): boolean {
  return /^\d{12,}$/.test(text);
}

export function isTextMessage(
  ctx: Context
): ctx is Context & { message: { text: string } } {
  return !!ctx.message && "text" in ctx.message;
}

export function isCallbackQueryMessage(
  ctx: Context
): ctx is Context & { callbackQuery: { data: string } } {
  return !!ctx.callbackQuery && "data" in ctx.callbackQuery;
}

export function isDigitOnly(text: string) {
  return /^\d+$/.test(text);
}

export async function isAdmin(id: number): Promise<boolean> {
  const admin = await Admin.findOne({ user_id: id });
  if (!admin) return false;

  return true;
}
