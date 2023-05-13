const { bot } = require("../core/bot");
bot;
bot.action(/done_\w+/g, (ctx) => {
  console.log("Keldi");
});
