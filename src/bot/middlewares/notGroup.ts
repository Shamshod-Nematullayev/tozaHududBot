import { Composer, Context } from "telegraf";

const composer = new Composer();
const chatIdMiddleware = async (ctx: Context, next: () => Promise<void>) => {
  const chatId = Number(ctx.chat?.id);

  if (chatId < 0 && !(ctx.callbackQuery as any)?.data) {
    if ((ctx.message as any)?.text === "chat_id") {
      await ctx.reply(String(chatId));
    }
    if ((ctx.channelPost as any)?.text === "chat_id") {
      await ctx.reply(String(chatId));
    }
    return;
  }

  return next();
};

composer.use(chatIdMiddleware);

export default composer;
