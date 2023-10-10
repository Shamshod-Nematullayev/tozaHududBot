const { Scenes } = require("telegraf");
const { bot } = require("../core/bot");
const LocalSession = require("telegraf-session-local");
const newAbonentScene = require("./scene/userScenes/newAbonentScene");
const newAdminScene = require("./scene/userScenes/newAdminScene");
const findAbonentScene = require("./scene/userScenes/findAbonentById");
const sendAnswerScene = require("./scene/adminActions/sendAnswerScene");
const importIncomeScene = require("./scene/adminActions/importIncome");
const { fuqoroRasmiScene } = require("./scene/userScenes/fuqoroRasmiScene");
const { showAbonentPic } = require("./scene/adminActions/showAbonentPic");
const { addNotification } = require("./scene/adminActions/addNotification");
const generateAlertLetter = require("./scene/adminActions/generateAlertLetter");
const {
  searchAbonentbyName,
} = require("./scene/userScenes/searchAbonentByName");
const { multiplyLivingsScene } = require("./scene/userScenes/multiplyLivings");
const { guvohnomaKiritishScene } = require("./scene/userScenes/newGuvohnoma");
const cancelGuvohnoma = require("./scene/adminActions/cancelGuvohnoma");
const {
  confirmGuvohnomaScene,
} = require("./scene/adminActions/completeGuvohnoma");
const importPlanForInspectors = require("./scene/adminActions/importPlanForInspectors");
const { connectPhoneNumber } = require("./scene/userScenes/connectPhoneNumber");
const {
  chargeCleanCityViloyatScene,
} = require("./scene/adminActions/chargeCleanCityViloyat");
const { importAbonentsScene } = require("./scene/adminActions/importAbonents");

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
  searchAbonentbyName,
  multiplyLivingsScene,
  guvohnomaKiritishScene,
  cancelGuvohnoma,
  confirmGuvohnomaScene,
  importPlanForInspectors,
  connectPhoneNumber,
  chargeCleanCityViloyatScene,
  importAbonentsScene,
]);

bot.use(new LocalSession({ database: "./session.json" }).middleware());
bot.use(stage.middleware());

// const composer = new Composer();
