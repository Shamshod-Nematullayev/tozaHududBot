import { Composer } from "telegraf";
import slashCommands from "./slashCommonds.js";
import hearsCommands from "./hearsCommands.js";
import actionsCommands from "../actions/bindex.js";
import { MyContext } from "types/botContext.js";

const composer = new Composer<MyContext>();

composer.use(slashCommands);
composer.use(hearsCommands);
composer.use(actionsCommands);

export default composer;
