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
const { Counter } = require("../models/Counter");
const { Guvohnoma } = require("../models/Guvohnoma");
const { MultiplyRequest } = require("../models/MultiplyRequest");

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

composer.action("ulim_guvohnomasini_qabul_qilish", async (ctx) => {
  try {
    if (!(await isAdmin(ctx))) {
      return ctx.reply(messages[ctx.session.til].youAreNotAdmin);
    }

    const file_id =
      ctx.callbackQuery.message.reply_markup.inline_keyboard[1][0].url
        .split("=")[1]
        .split("_")[1];

    const counter = await Counter.findOne({
      name: "ulim_guvohnoma_document_number",
    });

    const guvohnoma = await Guvohnoma.findByIdAndUpdate(file_id, {
      $set: {
        holat: "QABUL_QILINDI",
        document_number: counter.value + 1,
      },
    });

    await counter.updateOne({
      $set: {
        value: counter.value + 1,
        last_update: Date.now(),
      },
    });

    await ctx.editMessageCaption(
      `<b>guvohnoma№_${counter.value + 1}</b> <a href="https://t.me/${
        guvohnoma.user.username
      }">${guvohnoma.user.fullname}</a>\n` +
        `status: |<b> 🟡QABUL_QILINDI🟡 </b>|        #game_over\n` +
        `<code>${guvohnoma.kod}</code>\n` +
        `<i>${guvohnoma.comment}</i>\n` +
        `✅✅✅ by <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
      { parse_mode: "HTML", disable_web_page_preview: true }
    );

    await ctx.telegram.sendPhoto(guvohnoma.user.id, guvohnoma.file_id, {
      caption: `Siz yuborgan O'lim guvohnomasi operator tomonidan qabul qilindi. Tez orada sizga natijasini yetkazamiz\n\n№ <code>${
        counter.value + 1
      }</code>`,
      parse_mode: "HTML",
    });

    await ctx.answerCbQuery(messages.lotin.sended);
  } catch (error) {
    console.error(error);
    // Handle errors here
    // You might want to return an error message to the user or log it for further investigation
    ctx.reply("An error occurred while processing your request.");
  }
});

// yashovchi soni ko'paytirish so'rovini tasdiqlash funksiyasi
composer.action(/done_\w+/g, async (ctx) => {
  if (!(await isAdmin(ctx)))
    return ctx.reply(messages[ctx.session.til].youAreNotAdmin);

  const doneCb = ctx.update.callback_query.data;
  const req = await MultiplyRequest.findById(doneCb.split("_")[1]);
  await req.updateOne({
    $set: {
      confirm: true,
    },
  });
  await ctx.telegram.sendMessage(
    req.from.id,
    `<code>${req.KOD}</code>\n ${req.YASHOVCHILAR} kishi \n ✅✅ Tasdiqlandi`,
    { parse_mode: "HTML" }
  );
  await ctx.editMessageText(
    `#yashovchisoni by <a href="https://t.me/${req.from.username}">${req.from.first_name}</a>\n<code>${req.KOD}</code>\n${req.YASHOVCHILAR} kishi \n✅✅✅ by <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
    { parse_mode: "HTML", disable_web_page_preview: true }
  );
  await ctx.telegram.forwardMessage(
    process.env.NAZORATCHILAR_GURUPPASI,
    process.env.CHANNEL,
    ctx.callbackQuery.message.message_id
  );
});

composer.hears("quc", (ctx) => {
  yashovchiSoniKopaytirish("105120390245", 3)
    .then((finalResult) => {
      console.log(Boolean(finalResult.success));
    })
    .catch((err) => {
      console.log(err);
    });
});

bot.use(composer);
