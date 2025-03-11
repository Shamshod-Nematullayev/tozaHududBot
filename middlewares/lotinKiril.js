const { bot } = require("../core/bot");
const { kirillga } = require("./smallFunctions/lotinKiril");
function modifyReply(ctx) {
  const originalReply = ctx.reply.bind(ctx);
  // kirill tilini tanlaganlar uchun kirillda xabar yuborish
  ctx.reply = async function (message, ...extra) {
    try {
      if (ctx.session?.til === "kiril") {
        // HTML teglarini himoya qilish va faqatgina matnni tarjima qilish
        message = message.replace(/(<[^>]+>)|([^<>]+)/g, (match, tag, text) => {
          return tag ? tag : kirillga(text);
        });
      }
      return originalReply(message, ...extra);
    } catch (error) {
      console.log("lotin kiril chiqish functionda xatolik");
      console.error(error);
    }
  };
}
bot.use((ctx, next) => {
  modifyReply(ctx);
  next();
});
