const { Scenes } = require("telegraf");
const { bot } = require("../core/bot");
const LocalSession = require("telegraf-session-local");
const newAdminScene = require("./scene/userScenes/newAdminScene");
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
const { generateSBuyruq } = require("./scene/adminActions/generateSudBuyruq");
const {
  connect_mfy_tg_group_scene,
} = require("./scene/adminActions/connect_mfy_tg_group");
const {
  generateSavdoSanoatAriza,
} = require("./scene/adminActions/generateSavdoSanoatAriza");
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
  pochtaHarajatiniTekshirishScene,
} = require("./scene/adminActions/pochtaHarajatlariniTekshirish");
const {
  new_abonent_request_by_pinfl_scene,
} = require("./scene/userScenes/newAbonentRequestByPinfl");
const {
  sudBuyruqlariYaratish,
} = require("./scene/adminActions/sud/sudBuyruqlariYaratish");
// const {
//   sendWarningLettersByHybrid,
// } = require("./scene/adminActions/sendWarningLettersByHybrid");
const { updateElektrKod } = require("./scene/userScenes/updateElektrKod");
const {
  changeAbonentStreet,
} = require("./scene/userScenes/changeAbonentStreet");
const {
  sendWarningLettersByHybrid,
} = require("./scene/adminActions/sendWarningLettersByHybrid");
const { createTargetScene } = require("./scene/userScenes/createTarget");
const changePasswordScene = require("./scene/adminActions/changePassword");
const getAbonentCard = require("./scene/userScenes/getAbonentCard");

const stage = new Scenes.Stage([
  newAdminScene,
  addNotification,
  generateAlertLetter,
  searchAbonentbyName,
  multiplyLivingsScene,
  guvohnomaKiritishScene,
  cancelGuvohnoma,
  confirmGuvohnomaScene,
  importPlanForInspectors,
  connectPhoneNumber,
  generateSBuyruq,
  connect_mfy_tg_group_scene,
  generateSavdoSanoatAriza,
  personConfirm,
  userToInspektor,
  updateAbonentDatesByPinfl,
  getSudMaterial,
  ommaviyShartnomaBiriktirish,
  generateProkuraturaSudAriza,
  pochtaHarajatiniTekshirishScene,
  new_abonent_request_by_pinfl_scene,
  sudBuyruqlariYaratish,
  vaqtinchalikFunc,
  sendWarningLettersByHybrid,
  updateElektrKod,
  changeAbonentStreet,
  createTargetScene,
  changePasswordScene,
  getAbonentCard,
]);

bot.use(new LocalSession({ database: "./session.json" }).middleware());
bot.use(stage.middleware());
