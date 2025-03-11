const { bot } = require("../core/bot");
const { kirillga } = require("./smallFunctions/lotinKiril");

// Faqat matnlarni tarjima qilish
function translateText(text) {
  return typeof text === "string" ? kirillga(text) : text;
}

// reply_markup dagi matnlarni tarjima qilish (har xil formatlarni hisobga olib)
function translateReplyMarkup(replyMarkup) {
  if (!replyMarkup) return replyMarkup;

  // Inline keyboard (obyekt ichidagi `text` maydonini tarjima qilish)
  if (Array.isArray(replyMarkup.inline_keyboard)) {
    replyMarkup.inline_keyboard = replyMarkup.inline_keyboard.map((row) =>
      row.map((button) =>
        button && typeof button === "object" && "text" in button
          ? { ...button, text: translateText(button.text) }
          : button
      )
    );
  }

  // Oddiy keyboard (stringlarni tarjima qilish)
  if (Array.isArray(replyMarkup.keyboard)) {
    replyMarkup.keyboard = replyMarkup.keyboard.map((row) =>
      row.map((button) =>
        typeof button === "string"
          ? translateText(button) // Oddiy string tugmalarni tarjima qilish
          : button && typeof button === "object" && "text" in button
          ? { ...button, text: translateText(button.text) } // Agar object bo'lsa, textni tarjima qilish
          : button
      )
    );
  }

  return replyMarkup;
}

// ctx.reply ni modifikatsiya qilish
function modifyReply(ctx) {
  const originalReply = ctx.reply.bind(ctx);

  ctx.reply = async function (message, extra = {}) {
    try {
      if (ctx.session?.til === "kiril") {
        // HTML teglarini buzmay tarjima qilish
        message = message.replace(/(<[^>]+>)|([^<>]+)/g, (match, tag, text) =>
          tag ? tag : translateText(text)
        );

        // reply_markup ichidagi matnlarni tarjima qilish
        extra.reply_markup = translateReplyMarkup(extra.reply_markup);
      }

      return originalReply(message, extra);
    } catch (error) {
      console.error("lotin-kiril reply xatosi:", error);
    }
  };
}

// Bot uchun middleware
bot.use((ctx, next) => {
  modifyReply(ctx);
  return next();
});

function modifyReplyFunctions(ctx) {
  const methods = [
    "reply",
    "replyWithPhoto",
    "replyWithVideo",
    "replyWithAudio",
    "replyWithDocument",
    "replyWithAnimation",
    "replyWithSticker",
    "replyWithVideoNote",
    "replyWithVoice",
    "replyWithMediaGroup",
  ];

  methods.forEach((method) => {
    const originalMethod = ctx[method]?.bind(ctx);

    if (originalMethod) {
      ctx[method] = async function (...args) {
        try {
          let [message, extra = {}] = args;

          if (ctx.session?.til === "kiril") {
            // Tarjima qilinmaydigan qismlarni ajratib olish (HTML, @username, URL)
            const regex = /(<[^>]+>)|(@\w+)|(https?:\/\/\S+)|([^<>@\s]+)/g;

            const translateSafe = (text) =>
              text.replace(regex, (match, tag, username, url, normalText) =>
                tag || username || url ? match : translateText(normalText)
              );

            // Oddiy matnli xabarlar uchun
            if (typeof message === "string") {
              message = translateSafe(message);
            }

            // Media xabarlar (caption) uchun
            if (extra.caption) {
              extra.caption = translateSafe(extra.caption);
            }

            // reply_markup ichidagi matnlarni tarjima qilish
            if (extra.reply_markup) {
              extra.reply_markup = translateReplyMarkup(extra.reply_markup);
            }
          }

          return originalMethod(message, extra);
        } catch (error) {
          console.error(`${method} uchun tarjima xatosi:`, error);
        }
      };
    }
  });
}

// Bot uchun middleware
bot.use((ctx, next) => {
  modifyReplyFunctions(ctx);
  return next();
});
