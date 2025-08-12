import { ExtraPhoto } from "telegraf/typings/telegram-types";
import generateImage from "@helpers/puppeteer-wrapper.js";
import { bot } from "@bot/core/bot.js";
import { Message } from "telegraf/typings/core/types/typegram";

/**
 * Converts an HTML string into an image and sends it as a photo message to a specified chat.
 *
 * @param htmlParams - An object containing the HTML string and a CSS selector used for capturing the image.
 * @param chatId - The ID of the chat where the photo message will be sent.
 * @param extra - Additional options for sending the photo as defined in ExtraPhoto.
 *
 * @returns A Promise that resolves to the sent PhotoMessage.
 */
export async function sendHtmlAsPhoto(
  htmlParams: { htmlString: string; selector: string },
  chatId: number | string,
  extra?: ExtraPhoto
): Promise<Message.PhotoMessage> {
  const binaryData = (await generateImage({
    html: htmlParams.htmlString,
    type: "png",
    encoding: "binary",
    selector: htmlParams.selector,
  })) as string;
  const buffer = Buffer.from(binaryData, "binary");
  const msg = await bot.telegram.sendPhoto(chatId, { source: buffer }, extra);

  return msg;
}
