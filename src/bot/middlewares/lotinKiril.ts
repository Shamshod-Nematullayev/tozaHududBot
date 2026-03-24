import { Composer, Context } from 'telegraf';
import { kirillga } from './smallFunctions/lotinKiril.js';
import { MyContext } from 'types/botContext.js';
import { InlineKeyboardButton, ReplyKeyboardMarkup } from 'telegraf/typings/core/types/typegram.js';
const composer = new Composer();

// Faqat matnlarni tarjima qilish
function translateText(text: any) {
  return typeof text === 'string' ? kirillga(text) : text;
}

// reply_markup dagi matnlarni tarjima qilish (har xil formatlarni hisobga olib)
function translateReplyMarkup(replyMarkup: any) {
  if (!replyMarkup) return replyMarkup;

  // Inline keyboard (obyekt ichidagi `text` maydonini tarjima qilish)
  if (Array.isArray(replyMarkup.inline_keyboard)) {
    replyMarkup.inline_keyboard = replyMarkup.inline_keyboard.map((row: any) =>
      row.map((button: InlineKeyboardButton) =>
        button && typeof button === 'object' && 'text' in button
          ? { ...button, text: translateText(button.text) }
          : button
      )
    );
  }

  // Oddiy keyboard (stringlarni tarjima qilish)
  if (Array.isArray(replyMarkup.keyboard)) {
    replyMarkup.keyboard = replyMarkup.keyboard.map((row: any) =>
      row.map((button: InlineKeyboardButton) =>
        typeof button === 'string'
          ? translateText(button) // Oddiy string tugmalarni tarjima qilish
          : button && typeof button === 'object' && 'text' in button
          ? { ...button, text: translateText(button.text) } // Agar object bo'lsa, textni tarjima qilish
          : button
      )
    );
  }

  return replyMarkup;
}

function modifyReplyFunctions(ctx: MyContext) {
  const methods = [
    'reply',
    'replyWithPhoto',
    'replyWithVideo',
    'replyWithAudio',
    'replyWithDocument',
    'replyWithAnimation',
    'replyWithSticker',
    'replyWithVideoNote',
    'replyWithVoice',
    'replyWithMediaGroup',
  ] as const;

  methods.forEach((method) => {
    const originalMethod = ctx[method]?.bind(ctx);

    if (originalMethod) {
      ctx[method] = async function (...args): Promise<any> {
        try {
          let [message, extra = {} as any] = args;

          if (ctx.scene.session.til === 'kiril') {
            // Tarjima qilinmaydigan qismlarni ajratib olish (HTML, @username, URL)
            const regex = /(<[^>]+>)|(@\w+)|(https?:\/\/\S+)|([^<>@\s]+)/g;

            const translateSafe = (text: string) =>
              text.replace(regex, (match, tag, username, url, normalText) =>
                tag || username || url ? match : translateText(normalText)
              );

            // Oddiy matnli xabarlar uchun
            if (typeof message === 'string') {
              message = translateSafe(message);
            }

            // Media xabarlar (caption) uchun
            if (extra?.caption) {
              extra.caption = translateSafe(extra.caption);
            }

            // reply_markup ichidagi matnlarni tarjima qilish
            if (extra.reply_markup) {
              extra.reply_markup = translateReplyMarkup(extra.reply_markup);
            }
          }

          if (message !== undefined) {
            originalMethod(message as any, extra);
          }
        } catch (error) {
          console.error(`${method} uchun tarjima xatosi:`, error);
        }
      };
    }
  });
}

// Bot uchun middleware
composer.use((ctx, next) => {
  modifyReplyFunctions(ctx as MyContext);
  next();
});

// composer.use(modifyReply);

export default composer;
