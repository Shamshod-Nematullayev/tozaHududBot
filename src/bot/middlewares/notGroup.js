import { Composer } from "telegraf";

const composer = new Composer();
const chatIdMiddleware = async (ctx, next) => {
  const chatId = Number(ctx.chat?.id);

  if (chatId < 0 && !ctx.callbackQuery?.data) {
    if (ctx.message?.text === "chat_id") {
      await ctx.reply(String(chatId));
    }
    if (ctx.channelPost?.text === "chat_id") {
      await ctx.reply(String(chatId));
    }
    return;
  }

  return next();
};

composer.use(chatIdMiddleware);

export default composer;
