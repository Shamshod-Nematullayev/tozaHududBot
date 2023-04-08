const { Scenes } = require("telegraf");
const { bot } = require("../core/bot");
const LocalSession = require("telegraf-session-local");
const newAbonentScene = require("./scene/newAbonentScene");
const newAdminScene = require("./scene/newAdminScene");
const findAbonentScene = require("./scene/findAbonentById");
const sendAnswerScene = require("./scene/sendAnswerScene");
const { guvohnomaKiritishScene } = require("./scene/newGuvohnoma");

const stage = new Scenes.Stage([
  newAbonentScene,
  newAdminScene,
  sendAnswerScene,
  findAbonentScene,
  // guvohnomaKiritishScene,
]);

bot.use(new LocalSession({ database: "./session.json" }).middleware());
bot.use(stage.middleware());

// const composer = new Composer();
