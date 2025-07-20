import { Composer } from "telegraf";
import { MyContext } from "types/botContext.js";
import { messages } from "@lib/messages.js";
import { keyboards } from "@lib/keyboards.js";

const composer = new Composer<MyContext>();

import slashCommands from "./slashCommonds.js";
import hearsCommands from "./hearsCommands.js";
import actionsCommands from "../actions/index.js";

composer.use(slashCommands);
composer.use(hearsCommands);
composer.use(actionsCommands);
composer.on("text", (ctx) => {
  ctx.reply(messages.startGreeting, keyboards.mainKeyboard);
});

export default composer;
