const { Scenes } = require("telegraf");
const { bot } = require("../core/bot");
const LocalSession = require("telegraf-session-local");
const newAdminScene = require("./scene/userScenes/newAdminScene");
const findAbonentScene = require("./scene/userScenes/findAbonentById");
const sendAnswerScene = require("./scene/adminActions/sendAnswerScene");
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
const {
  importAlertLetters,
} = require("./scene/adminActions/cleancity/dxsh/importAlertLetter");
const {
  pochtaHarajatiniTekshirishScene,
} = require("./scene/adminActions/pochtaHarajatlariniTekshirish");
const {
  new_abonent_request_by_pinfl_scene,
} = require("./scene/userScenes/newAbonentRequestByPinfl");
const {
  sudBuyruqlariYaratish,
} = require("./scene/adminActions/sud/sudBuyruqlariYaratish");
const {
  vaqtinchalikFunc,
} = require("./scene/adminActions/vaqtinchalikFunksiya");
const {
  set_monthly_plan,
} = require("./scene/adminActions/cleancity/viloyat/setMonthlyPlan");
const {
  sendWarningLettersByHybrid,
} = require("./scene/adminActions/sendWarningLettersByHybrid");
const { updateElektrKod } = require("./scene/userScenes/updateElektrKod");
const {
  changeAbonentStreet,
} = require("./scene/userScenes/changeAbonentStreet");

const stage = new Scenes.Stage([
  newAdminScene,
  sendAnswerScene,
  findAbonentScene,
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
  generateSavdoSanoatAriza,
  loginCleanCityScene,
  loginCleanCityViloyatScene,
  recoverCleanCitySession,
  new_abonent_by_pinfl_scene,
  personConfirm,
  userToInspektor,
  updateAbonentDatesByPinfl,
  getSudMaterial,
  ommaviyShartnomaBiriktirish,
  generateProkuraturaSudAriza,
  exportAbonentCards,
  exportWarningLettersZip,
  importAlertLetters,
  pochtaHarajatiniTekshirishScene,
  new_abonent_request_by_pinfl_scene,
  sudBuyruqlariYaratish,
  set_monthly_plan,
  vaqtinchalikFunc,
  sendWarningLettersByHybrid,
  updateElektrKod,
  changeAbonentStreet,
]);

bot.use(new LocalSession({ database: "./session.json" }).middleware());
bot.use(stage.middleware());
