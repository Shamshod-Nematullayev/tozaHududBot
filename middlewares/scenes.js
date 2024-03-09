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
const { importAbonentsScene } = require("./scene/adminActions/importAbonents");
const { generateSBuyruq } = require("./scene/adminActions/generateSudBuyruq");
const {
  connect_mfy_tg_group_scene,
} = require("./scene/adminActions/connect_mfy_tg_group");
const { loginviloyat } = require("./scene/adminActions/loginviloyat");
const {
  generateSavdoSanoatAriza,
} = require("./scene/adminActions/generateSavdoSanoatAriza");
const { loginCleanCityScene } = require("./scene/adminActions/cleancity/login");
const {
  recoverCleanCitySession,
} = require("./scene/adminActions/cleancity/recoverSession");
const {
  loginCleanCityViloyatScene,
} = require("./scene/adminActions/cleancity/viloyat/login");
const {
  new_abonent_by_pinfl_scene,
} = require("./scene/adminActions/newAbonentByPinfl");
const {
  personConfirm,
} = require("./scene/adminActions/addNotificationPersonConfirm");
const { userToInspektor } = require("./scene/adminActions/userToInspektor");
const {
  updateAbonentDatesByPinfl,
} = require("./scene/userScenes/updateAbonentDatesPinfil");
const { aborotkaChiqorish } = require("./scene/adminActions/aborotkaChiqorish");
const { getSudMaterial } = require("./scene/adminActions/getSudMaterials");
const {
  ommaviyShartnomaBiriktirish,
} = require("./scene/adminActions/ommaviyShartnomaBiriktirish");
const {
  generateProkuraturaSudAriza,
} = require("./scene/adminActions/generateProkraturaSudAriza");
const {
  exportAbonentCards,
} = require("./scene/adminActions/exportAbonentCardsZip");
const {
  exportWarningLettersZip,
} = require("./scene/adminActions/exportWarningLettersZip");

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
  importAbonentsScene,
  generateSBuyruq,
  connect_mfy_tg_group_scene,
  loginviloyat,
  generateSavdoSanoatAriza,
  loginCleanCityScene,
  loginCleanCityViloyatScene,
  recoverCleanCitySession,
  new_abonent_by_pinfl_scene,
  personConfirm,
  userToInspektor,
  updateAbonentDatesByPinfl,
  aborotkaChiqorish,
  getSudMaterial,
  ommaviyShartnomaBiriktirish,
  generateProkuraturaSudAriza,
  exportAbonentCards,
  exportWarningLettersZip,
]);

bot.use(new LocalSession({ database: "./session.json" }).middleware());
bot.use(stage.middleware());

// const composer = new Composer();
