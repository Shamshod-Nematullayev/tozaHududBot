const { bot } = require("../core/bot");
const { Mahalla } = require("../models/Mahalla");

// bot.telegram.se
bot.on("document", (ctx, next) => {
  if (ctx.message.caption == "file_id") {
    ctx.reply(ctx.message.document.file_id);
  }
  next();
});
bot.use(async (ctx, next) => {
  if (
    ctx.message &&
    ctx.message.text === process.env.ADD_TG_GROUP_TOKEN &&
    process.env.ADD_TG_GROUP_TOKEN &&
    ctx.chat.id < 0
  ) {
    process.env.ADD_TG_GROUP_TOKEN = "";
    await Mahalla.findOneAndUpdate(
      { id: process.env.CURRENT_MFY_ID },
      {
        $push: {
          groups: {
            title: ctx.chat.title,
            id: ctx.chat.id,
          },
        },
      }
    ).then(() => {
      ctx.telegram.sendMessage(process.env.ADMIN_ID, `Telegram guruhi ulandi`);
    });
  }
  if (ctx.chat.id < 0 && !ctx.update.callback_query) {
    if (ctx.channelPost?.text == "chat_id") {
      ctx.reply(ctx.chat.id);
    }
  } else {
    next();
  }
});
