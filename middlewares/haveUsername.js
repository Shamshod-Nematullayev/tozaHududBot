const { bot } = require("../core/bot");
const { messages } = require("../lib/messages");
const { Guvohnoma } = require("../models/Guvohnoma");
const https = require("https");
const fetch = require("node-fetch");

bot.use(async (ctx, next) => {
  if (ctx.from.id == 5347896070) {
  }
  // ctx.replyWithDocument(
  //   "BQACAgIAAxkBAAIotGR1hlLaewnxefO7RRSnqVpsAAGpCwACjy8AAlkjqEus3oJmj3A_Xi8E"
  // );
  // try {
  //   if (ctx.message.forward_from_message_id > 0 && ctx.from.id == 5347896070) {
  //     await Guvohnoma.findOneAndUpdate(
  //       {
  //         kod: parseInt(ctx.message.caption.split("\n")[2]),
  //         holat: "QABUL_QILINDI",
  //       },
  //       { $set: { messageIdChannel: ctx.message.forward_from_message_id } }
  //     )
  //       .then((res) => {
  //         console.log(ctx.message);
  //         console.log(parseInt(ctx.message.caption.split("\n")[2]));
  //       })
  //       .catch((err) => console.log(err));
  //   }
  // } catch (error) {}
  if (ctx.message && ctx.message.from && ctx.chat.id > 0) {
    const username = ctx.message.from.username;
    username ? next() : ctx.reply(messages["lotin"].haveNotUsername);
  } else {
    next();
  }
});
