// BOT o'zgaruvchisi
const { Telegraf } = require("telegraf");
const TOKEN = process.env.TOKEN;

const bot = new Telegraf(TOKEN);

bot.catch((error, ctx) => {
  if (error.response && error.response.error_code === 403) {
    // User has blocked the bot
    console.log("User has blocked the bot:", error.response.description);
    // Handle this situation as per your requirements
  } else {
    // Other errors, handle accordingly
    console.error("Error:", error);
  }
});

module.exports = { bot };
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
