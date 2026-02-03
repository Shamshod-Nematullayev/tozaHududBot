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
import specialTask from "./specialTask.js";

composer.use(registerScenesWithCbQuery);
composer.use(targets);
composer.use(language);
composer.use(newAbonentsList);
composer.use(adminActions);
composer.use(shaxsiTasdiqlandi);
composer.use(etkTasdiqlandi);
composer.use(specialTask);

export default composer;
