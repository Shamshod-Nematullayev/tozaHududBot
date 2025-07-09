import { bot } from "../core/bot.js";
import { keyboards } from "@lib/keyboards.js";
import { messages } from "@lib/messages.js";

import "./start.js";
import "./userCommands.js";
import "./admin.js";
import "./language.js";
import "./shaxsiTasdiqlandi/index.ts";
bot.on("text", (ctx) => {
  ctx.reply(messages.startGreeting, keyboards.mainKeyboard);
});
