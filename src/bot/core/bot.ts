import { Telegraf } from "telegraf";
import { MyContext } from "types/botContext";

// BOT o'zgaruvchisi
const TOKEN = process.env.TOKEN as string;

export const bot = new Telegraf<MyContext>(TOKEN);

bot.catch((error: any, ctx) => {
  console.error("Error:", error);
});
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
