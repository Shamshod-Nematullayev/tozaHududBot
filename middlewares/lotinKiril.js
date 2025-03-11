const { bot } = require("../core/bot");
const { kirillga } = require("./smallFunctions/lotinKiril");
function modifyReply(ctx) {
  const originalReply = ctx.reply.bind(ctx);
  // kirill tilini tanlaganlar uchun kirillda xabar yuborish
  ctx.reply = async function () {
    let kirilcha = "";
    if (ctx.session.til === "kiril") {
      kirilcha = kirillga(arguments[0]);
      return originalReply(kirilcha, arguments[1]);
    }
    return originalReply(...arguments);
  };
}
bot.use((ctx, next) => {
  modifyReply(ctx);
  next();
});
