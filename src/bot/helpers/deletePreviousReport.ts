import { bot } from "@bot/core/bot.js";
import { ReportsMessage, ReportType } from "@models/ReportsMessage.js";
import { Message } from "telegraf/typings/core/types/typegram";

export async function deletePreviousReport(
  companyId: number,
  type: ReportType,
  msg: Message.PhotoMessage
): Promise<void> {
  try {
    const previous = await ReportsMessage.findOneAndUpdate(
      { companyId, type },
      {
        message_id: msg.message_id,
        chat_id: msg.chat.id,
        date: Date.now(),
      },
      { new: false, upsert: true }
    );

    if (previous) {
      await bot.telegram.deleteMessage(msg.chat.id, previous.message_id);
    }
  } catch (error) {
    console.error(
      "avvalgi hisobotni o'chirib bo'lmadi. deletePreviousReport.ts",
      arguments
    );
  }
}
