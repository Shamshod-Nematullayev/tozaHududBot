import lotinKiril from "./lotinKiril.js";
import checkNotGrup from "./notGroup.js";
import setLanguage from "./setLanguage.js";
import saveUser from "./saveUser.js";

import { Composer } from "telegraf";
const composer = new Composer();

composer.use(lotinKiril);
composer.use(checkNotGrup);
composer.use(setLanguage);
composer.use(saveUser);

export default composer;
