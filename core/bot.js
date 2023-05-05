// BOT o'zgaruvchisi
const { Telegraf } = require("telegraf");
const TOKEN = process.env.TOKEN;

const bot = new Telegraf(TOKEN);

bot
  .launch()
  .then(() => {
    console.log("Server connected to telegram");
  })
  .catch((err) => {
    console.error(err);
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
module.exports = { bot };
