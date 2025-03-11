const { bot } = require("../core/bot");
const { keyboards } = require("../lib/keyboards");
const { messages } = require("../lib/messages");

require("./start");
require("./mainCommands");
require("./admin");
require("./language");
require("./shaxsiTasdiqlandi");
bot.on("text", (ctx) => {
  ctx.reply(messages.startGreeting, keyboards.mainKeyboard);
});
