const { Composer } = require("telegraf");
const { bot } = require("../core/bot");
const { keyboards } = require("../lib/keyboards");
const { messages } = require("../lib/messages");
const { Admin } = require("../models/Admin");
const { drawAndSendTushum } = require("../middlewares/drawTushum");
const {
  fetchEcopayTushum,
  fetchEcoTranzaksiyalar,
} = require("../middlewares/fetchEcopay");
const { CleanCitySession } = require("../models/CleanCitySession");
const {
  drawDebitViloyat,
} = require("../middlewares/scene/adminActions/cleancity/viloyat/toSendDebitorReport");
const {
  yashovchiSoniKopaytirish,
} = require("../middlewares/scene/adminActions/cleancity/yashovchiSoniKopaytirish");

// =====================================================================================
const composer = new Composer();

const ADMIN_ACTIONS = [
  "import_abonents_data",
  "generate_sud_buyruq",
  "connect_mfy_tg_group",
  "generateSavdoSanoatAriza",
  "import_plan_for_inspectors",
  "confirm_game_over",
  "show_abonent_pic",
  "generate_alert_letter",
  "add_notification",
];

// main required functions
async function isAdmin(ctx) {
  if (!ctx) return false;

  const admins = await Admin.find();
  return admins.some((admin) => admin.user_id === ctx.from.id);
}

function enterAdminAction(actionType) {
  if (!actionType) return;

  composer.action(actionType, (ctx) => {
    if (isAdmin(ctx)) {
      ctx.deleteMessage();
      ctx.scene.enter(actionType);
    } else {
      ctx.reply(messages[ctx.session.til].youAreNotAdmin);
    }
  });
}
ADMIN_ACTIONS.forEach((actionType) => enterAdminAction(actionType));

composer.command("admin", async (ctx) => {
  const admins = await Admin.find();
  if (admins.length === 0) ctx.scene.enter("newAdmin");
});

composer.hears(["👨‍💻 Ish maydoni", "👨‍💻 Иш майдони"], async (ctx) => {
  if (!(await isAdmin(ctx)))
    return ctx.reply(messages[ctx.session.til].youAreNotAdmin);

  ctx.reply(
    messages[ctx.session.til].chooseMenu,
    keyboards[ctx.session.til].adminWorkSpace
  );
});

composer.hears(["Тушумни ташлаш", "Tushumni tashlash"], async (ctx) => {
  if (!(await isAdmin(ctx)))
    return ctx.reply(messages[ctx.session.til].youAreNotAdmin);

  ctx.scene.enter("import_income_report");
});

composer.action("CHARGE_VILOYAT_LOGIN", async (ctx) => {
  if (!(await isAdmin(ctx)))
    return ctx.reply(messages[ctx.session.til].youAreNotAdmin);

  const session = await CleanCitySession.findOne({
    type: "stm_reports",
  });
  if (!session) {
    ctx.scene.enter("login_clean_city_viloyat");
  } else {
    ctx.session.session_type = "stm_reports";
    ctx.scene.enter("recover_clean_city_session");
  }
});

// ======================== Special functions (not required just shortcuts) ========================//
composer.command("tushum", async (ctx) => {
  const data = await fetchEcopayTushum();
  fetchEcoTranzaksiyalar();
  drawAndSendTushum(data, ctx);
});

composer.hears("debit", (ctx) => {
  drawDebitViloyat("toMySelf");
});
composer.hears("quc", (ctx) => yashovchiSoniKopaytirish("105120390245"));

bot.use(composer);
