const { bot } = require("../core/bot");
const { keyboards } = require("../lib/keyboards");
const { messages } = require("../lib/messages");

require("./start");
require("./mainCommands");
require("./admin");
require("./language");
require("./../middlewares/scene/adminActions/cleancity/mfyIncomeReport");
bot.on("text", (ctx) => {
  ctx.reply(
    messages[ctx.session.til].startGreeting,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});
