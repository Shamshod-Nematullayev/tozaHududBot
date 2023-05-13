const { bot } = require("../core/bot");
const { MultiplyRequest } = require("../models/MultiplyRequest");

bot.use(async (ctx, next) => {
  if (ctx.chat.id < 0) {
    try {
      const doneCb = ctx.update.callback_query.data.match(/done_\w+/g)[0];
      if (doneCb) {
        const req = await MultiplyRequest.findById(doneCb.split("_")[1]);
        console.log(req);
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    next();
  }
});
