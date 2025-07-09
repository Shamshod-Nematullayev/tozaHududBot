const compoaser = new Composer();
import { Composer } from "telegraf";
import targets from "./targets";

compoaser.use(targets);

export default targets;
