const { Scenes } = require("telegraf");
const { bot } = require("../core/bot");
const LocalSession = require("telegraf-session-local");
const newAbonentScene = require("./scene/newAbonentScene");
const newAdminScene = require("./scene/newAdminScene");
const findAbonentScene = require("./scene/findAbonentById");
const sendAnswerScene = require("./scene/adminActions/sendAnswerScene");
const importIncomeScene = require("./scene/adminActions/importIncome");
const { fuqoroRasmiScene } = require("./scene/fuqoroRasmiScene");
const { showAbonentPic } = require("./scene/adminActions/showAbonentPic");
const { addNotification } = require("./scene/adminActions/addNotification");
const generateAlertLetter = require("./scene/adminActions/generateAlertLetter");

const stage = new Scenes.Stage([
  newAbonentScene,
  newAdminScene,
  sendAnswerScene,
  findAbonentScene,
  importIncomeScene,
  fuqoroRasmiScene,
  showAbonentPic,
  addNotification,
  generateAlertLetter,
  // guvohnomaKirit ishScene,
]);

bot.use(new LocalSession({ database: "./session.json" }).middleware());
bot.use(stage.middleware());

// const composer = new Composer();
