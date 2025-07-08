import { Scenes } from "telegraf";
import { bot } from "../core/bot";
import LocalSession from "telegraf-session-local";
import newAdminScene from "./scene/userScenes/newAdminScene";
import { addNotification } from "./scene/adminActions/addNotification";
import { searchAbonentbyName } from "./scene/userScenes/searchAbonentByName";
import { multiplyLivingsScene } from "./scene/userScenes/multiplyLivings";
import { guvohnomaKiritishScene } from "./scene/userScenes/newGuvohnoma";
import cancelGuvohnoma from "./scene/adminActions/cancelGuvohnoma";
import { confirmGuvohnomaScene } from "./scene/adminActions/completeGuvohnoma";
import { importPlanForInspectors } from "./scene/adminActions/importPlanForInspectors";
import { connectPhoneNumber } from "./scene/userScenes/connectPhoneNumber";
import { generateSBuyruq } from "./scene/adminActions/generateSudBuyruq";
import { connect_mfy_tg_group_scene } from "./scene/adminActions/connect_mfy_tg_group";
import { generateSavdoSanoatAriza } from "./scene/adminActions/generateSavdoSanoatAriza";
import { personConfirm } from "./scene/adminActions/addNotificationPersonConfirm";
import { userToInspektor } from "./scene/adminActions/userToInspektor";
import { updateAbonentDatesByPinfl } from "./scene/userScenes/updateAbonentDatesPinfil";
import { getSudMaterial } from "./scene/adminActions/getSudMaterials";
import { ommaviyShartnomaBiriktirish } from "./scene/adminActions/ommaviyShartnomaBiriktirish";
import { generateProkuraturaSudAriza } from "./scene/adminActions/generateProkraturaSudAriza";
import { pochtaHarajatiniTekshirishScene } from "./scene/adminActions/pochtaHarajatlariniTekshirish";
import { new_abonent_request_by_pinfl_scene } from "./scene/userScenes/newAbonentRequestByPinfl";
import { sudBuyruqlariYaratish } from "./scene/adminActions/sud/sudBuyruqlariYaratish";
// import { sendWarningLettersByHybrid } from "./scene/adminActions/sendWarningLettersByHybrid";
import { updateElektrKod } from "./scene/userScenes/updateElektrKod";
import { changeAbonentStreet } from "./scene/userScenes/changeAbonentStreet";
import { sendWarningLettersByHybrid } from "./scene/adminActions/sendWarningLettersByHybrid";
import { createTargetScene } from "./scene/userScenes/createTarget";
import changePasswordScene from "./scene/adminActions/changePassword";
import { getAbonentCard } from "./scene/userScenes/getAbonentCard";
import { uploadWarningTozamakonScene } from "./scene/adminActions/uploadWarningTozamakon";
import { abonentlarniGeozonagaBiriktirish } from "./scene/adminActions/abonentlarniGeozonagaBiriktirish";
import { getWarningLetter } from "./scene/userScenes/getWarningLetter";

const stage = new Scenes.Stage([
  newAdminScene,
  addNotification,
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
  sendWarningLettersByHybrid,
  updateElektrKod,
  changeAbonentStreet,
  createTargetScene,
  changePasswordScene,
  getAbonentCard,
  uploadWarningTozamakonScene,
  abonentlarniGeozonagaBiriktirish,
  getWarningLetter,
]);

bot.use(new LocalSession({ database: "./session.json" }).middleware());
bot.use(stage.middleware());
