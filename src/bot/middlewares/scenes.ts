import { Composer, Scenes } from "telegraf";
import { addNotification } from "./scene/adminActions/addNotification.js";
import { multiplyLivingsScene } from "./scene/userScenes/multiplyLivings.js";
import { guvohnomaKiritishScene } from "./scene/userScenes/newGuvohnoma.js";
import cancelGuvohnoma from "./scene/adminActions/cancelGuvohnoma.js";
import { confirmGuvohnomaScene } from "./scene/adminActions/completeGuvohnoma.js";
import { importPlanForInspectors } from "./scene/adminActions/importPlanForInspectors.js";
import { connectPhoneNumber } from "./scene/userScenes/connectPhoneNumber.js";
import { generateSBuyruq } from "./scene/adminActions/generateSudBuyruq.js";
import { connect_mfy_tg_group_scene } from "./scene/adminActions/connect_mfy_tg_group.js";
import { generateSavdoSanoatAriza } from "./scene/adminActions/generateSavdoSanoatAriza.js";
import { personConfirm } from "./scene/adminActions/addNotificationPersonConfirm.js";
import { userToInspektor } from "./scene/adminActions/userToInspektor.js";
import { updateAbonentDatesByPinfl } from "./scene/userScenes/updateAbonentDatesPinfil.js";
import { getSudMaterial } from "./scene/adminActions/getSudMaterials.js";
import { ommaviyShartnomaBiriktirish } from "./scene/adminActions/ommaviyShartnomaBiriktirish.js";
import { generateProkuraturaSudAriza } from "./scene/adminActions/generateProkraturaSudAriza.js";
import { pochtaHarajatiniTekshirishScene } from "./scene/adminActions/pochtaHarajatlariniTekshirish.js";
import { new_abonent_request_by_pinfl_scene } from "./scene/userScenes/newAbonentRequestByPinfl.js";
import { sudBuyruqlariYaratish } from "./scene/adminActions/sud/sudBuyruqlariYaratish.js";
// import { sendWarningLettersByHybrid } from './scene/adminActions/sendWarningLettersByHybrid.js'
import { updateElektrKod } from "./scene/userScenes/updateElektrKod.js";
import { changeAbonentStreet } from "./scene/userScenes/changeAbonentStreet.js";
import { sendWarningLettersByHybrid } from "./scene/adminActions/sendWarningLettersByHybrid/index.js";
import { createTargetScene } from "./scene/userScenes/createTarget.js";
import changePasswordScene from "./scene/adminActions/changePassword.js";
import { getAbonentCard } from "./scene/userScenes/getAbonentCard.js";
import { getWarningLetter } from "./scene/userScenes/getWarningLetter.js";
import { getAbonentsList } from "./scene/userScenes/getAbonentsList.js";
import { searchAbonentbyName } from "./scene/userScenes/searchAbonentByName.js";

const stage = new Scenes.Stage<any>([
  addNotification,
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
  sendWarningLettersByHybrid,
  updateElektrKod,
  changeAbonentStreet,
  createTargetScene,
  changePasswordScene,
  getAbonentCard,
  getWarningLetter,
  getAbonentsList,
  searchAbonentbyName,
]);

const composer = new Composer();
composer.use(stage.middleware());

export default composer;
