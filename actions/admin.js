const nodeHtmlToImage = require("node-html-to-image");
const { Composer } = require("telegraf");
const { bot } = require("../core/bot");
const { keyboards } = require("../lib/keyboards");
const { messages } = require("../lib/messages");
const { Admin } = require("../models/Admin");
const fs = require("fs");
const { drawAndSendTushum } = require("../middlewares/drawTushum");
const {
  fetchEcopayTushum,
  fetchEcoTranzaksiyalar,
} = require("../middlewares/fetchEcopay");
const { CleanCitySession } = require("../models/CleanCitySession");

const composer = new Composer();
async function isAdmin(ctx) {
  const admins = await Admin.find();
  let confirm = false;
  admins.forEach((admin) => {
    if (admin.user_id == ctx.from.id) {
      confirm = true;
    }
  });
  return confirm;
}
composer.command("admin", async (ctx) => {
  const admins = await Admin.find();
  if (admins.length === 0) ctx.scene.enter("newAdmin");
});

composer.hears(["👨‍💻 Ish maydoni", "👨‍💻 Иш майдони"], async (ctx) => {
  console.log(keyboards);
  const confirm = isAdmin(ctx);
  if (!confirm) {
    ctx.reply(messages[ctx.session.til].youAreNotAdmin);
  } else {
    ctx.reply(
      messages[ctx.session.til].chooseMenu,
      keyboards[ctx.session.til].adminWorkSpace
    );
  }
});

composer.hears(["Тушумни ташлаш", "Tushumni tashlash"], (ctx) => {
  const confirm = isAdmin(ctx);
  if (!confirm) {
    ctx.reply(messages.lotin.youAreNotAdmin);
  } else {
    ctx.scene.enter("import_income_report");
  }
});

composer.command("tushum", async (ctx) => {
  const data = await fetchEcopayTushum();
  console.log("Tushum tashlandi hukumdorim");
  fetchEcoTranzaksiyalar();
  drawAndSendTushum(data, ctx);
});

composer.action("add_notification_letter", (ctx) => {
  const confirm = isAdmin(ctx);
  ctx.deleteMessage();
  if (!confirm) {
    ctx.reply(messages.lotin.youAreNotAdmin);
  } else {
    ctx.scene.enter("add_notification");
  }
});

composer.action("generate_alert", (ctx) => {
  ctx.scene.enter("generate_alert_letter");
});

composer.action("show_abonent_pic", (ctx) => {
  ctx.scene.enter("show_abonent_pic");
});

composer.action("game_over_play", (ctx) =>
  ctx.scene.enter("confirm_game_over")
);
composer.action("CHARGE_VILOYAT_LOGIN", async (ctx) => {
  if (isAdmin(ctx)) {
    const session = await CleanCitySession.findOne({
      type: "stm_reports",
    });
    if (!session) {
      ctx.scene.enter("login_clean_city_viloyat");
    } else {
      ctx.session.session_type = "stm_reports";
      ctx.scene.enter("recover_clean_city_session");
    }
  }
});
composer.action("import_abonents_data", (ctx) => {
  if (isAdmin(ctx)) {
    ctx.scene.enter("import_abonents_data");
  }
});
composer.action("generate_sud_buyruq", (ctx) => {
  if (isAdmin(ctx)) {
    ctx.scene.enter("generate_sud_buyruq");
  }
});
composer.action("connect_mfy_tg_group", (ctx) => {
  if (isAdmin(ctx)) {
    ctx.scene.enter("connect_mfy_tg_group");
  }
});
composer.action("generateSavdoSanoatAriza", (ctx) => {
  if (isAdmin(ctx)) {
    ctx.scene.enter("generateSavdoSanoatAriza");
  }
});

composer.hears("olala", (ctx) => ctx.scene.enter("viloyatlogintest"));

composer.action("set_plan_for_inspectors", (ctx) => {
  ctx.scene.enter("import_plan_for_inspectors");
});

bot.use(composer);
