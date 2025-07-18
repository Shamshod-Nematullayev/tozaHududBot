import { Telegraf } from "telegraf";
import { MyContext } from "types/botContext";
import composer from "@bot/commands/index.js";
import { errorHandler } from "@bot/utils/errorHandler.js";
import { session } from "@bot/middlewares/session.js";
import { stage } from "@bot/middlewares/scenes.js";

// BOT o'zgaruvchisi
const TOKEN = process.env.TOKEN as string;

export const bot = new Telegraf<MyContext>(TOKEN);

bot.use(session.middleware());
bot.use(stage);

bot.use(composer);
bot.catch((error: any, ctx) => {
  errorHandler(error, ctx);
});
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
