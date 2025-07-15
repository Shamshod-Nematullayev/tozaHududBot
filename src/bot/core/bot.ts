import { Telegraf } from "telegraf";
import { MyContext } from "types/botContext";
import composer from "@bot/commands";
import { errorHandler } from "@bot/utils/errorHandler";

// BOT o'zgaruvchisi
const TOKEN = process.env.TOKEN as string;

export const bot = new Telegraf<MyContext>(TOKEN);

bot.use(composer);
bot.catch((error: any, ctx) => {
  errorHandler(error, ctx);
});
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
