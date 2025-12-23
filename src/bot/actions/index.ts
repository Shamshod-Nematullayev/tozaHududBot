import { Composer } from "telegraf";
import { MyContext } from "types/botContext.js";

const composer = new Composer<MyContext>();

import registerScenesWithCbQuery from "./registerScenesWithCbQuery.js";
import targets from "./targets.js";
import language from "./language.js";
import newAbonentsList from "./newAbonentsList.js";
import adminActions from "./adminActions.js";
import shaxsiTasdiqlandi from "./shaxsiTasdiqlandi/index.js";
import etkTasdiqlandi from "./etkTasdiqlandi.js";

composer.use(registerScenesWithCbQuery);
composer.use(targets);
composer.use(language);
composer.use(newAbonentsList);
composer.use(adminActions);
composer.use(shaxsiTasdiqlandi);
composer.use(etkTasdiqlandi);

export default composer;
