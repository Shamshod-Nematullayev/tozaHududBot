import { Composer } from "telegraf";
import slashCommands from "./slashCommonds";
import hearsCommands from "./hearsCommands";
import actionsCommands from "../actions/bindex";
import { MyContext } from "types/botContext";

const composer = new Composer<MyContext>();

composer.use(slashCommands);
composer.use(hearsCommands);
composer.use(actionsCommands);

export default composer;
