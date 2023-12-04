const { bot } = require("../core/bot");
const { kirillga } = require("./smallFunctions/lotinKiril");
function modifyReply(ctx) {
  const originalReply = ctx.reply.bind(ctx);
  // I manually create a Promise here to be resolved when message is actually sent.
  // It may be sent in some time after a rate limit catches up. For my convenience
  // I store the original bound reply. You may simplify this by just returning
  // ctx.reply(...arguments) after "your code here" if you don't need something
  // complex and asynchronous. I didn't try latter myself though, consider it just a suggestion.

  ctx.reply = async function () {
    try {
      let kirilcha = "";
      if (ctx.session.til === "kiril") {
        kirilcha = kirillga(arguments[0]);
        return originalReply(kirilcha, arguments[1]);
      }
      return originalReply(...arguments);
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
