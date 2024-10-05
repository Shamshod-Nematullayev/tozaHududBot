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

// bot.telegram.setMyCommands([
//   { command: "start", description: "Start the bot" },
//   { command: "help", description: "Get help information" },
//   { command: "settings", description: "Configure your settings" },
// ]);

bot
  .launch(() => {
    console.log("Bot has been started.");
  })
  .catch((err) => {
    console.log(err);
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
module.exports = { bot };
