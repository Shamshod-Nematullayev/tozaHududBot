import { Context } from "telegraf";

export async function tryDeleteOrEditMessage(
  ctx: Context,
  channelId: string | number,
  messageId: number,
  fallbackText: string
) {
  try {
    await ctx.telegram.deleteMessage(channelId, messageId);
  } catch (err) {
    try {
      await ctx.telegram.editMessageCaption(
        channelId,
        messageId,
        "0",
        fallbackText,
        { parse_mode: "HTML" }
      );
    } catch (e) {
      // Agar edit ham iloji bo'lmasa, bu yerda log yoki hech nima qilinmaydi
      console.error("Xabarni delete/edit qilish imkonsiz:", e);
    }
  }
}
