// BOT o'zgaruvchisi
const { Telegraf } = require("telegraf");
const TOKEN = process.env.TOKEN;

const bot = new Telegraf(TOKEN);

bot.catch((err, ctx) => {
  if (err) console.log(err);
});

bot
  .launch()
  .then(() => {
    console.log("Server connected to telegram");
  })
  .catch((err) => {
    throw err;
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
module.exports = { bot };
