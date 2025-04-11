const { NOTIFICATIONS_CHANNEL_ID } = require("../constants");
const {
  nazoratchilarKunlikTushum,
} = require("../intervals/nazoratchilarKunlikTushum");
const { sendMFYIncomeReport } = require("../intervals/sendMFYIncomeReport");
const { kirillga } = require("../middlewares/smallFunctions/lotinKiril");
const { Notification } = require("../models/Notification");
const {
  // node modules
  // required functions
  find_address_by_pinfil_from_mvd,
  // telegraf resourses
  Composer,
  bot,
  keyboards,
  messages,
  // mongo models
  Admin,
  Counter,
  Guvohnoma,
} = require("./../requires");

// small required functions =========================================================================
async function isAdmin(ctx) {
  if (!ctx) return false;

  const admins = await Admin.find();
  return admins.some((admin) => admin.user_id === ctx.from.id);
}

// Main codes =====================================================================================
const composer = new Composer();

//  Entering scenes by inline button =========================================
const ADMIN_ACTIONS = [
  "import_abonents_data",
  "generate_sud_buyruq",
  "connect_mfy_tg_group",
  "generateSavdoSanoatAriza",
  "import_plan_for_inspectors",
  "confirm_game_over",
  "generate_alert_letter",
  "add_notification",
  "shaxsi_tashdiqlandi_bildirish_xati",
  "user_to_inspektor",
  "get_sud_material",
  "ommaviy_shartnoma_biriktirish",
  "generateProkuraturaSudAriza",
  "sudBuyruqlariYaratish",
  "Ogohlantish xati yuborish",
  "upload_execution_to_billing",
];

function enterAdminAction(actionType) {
  if (!actionType) return;

  composer.action(actionType, async (ctx) => {
    if (isAdmin(ctx)) {
      await ctx.deleteMessage();
      ctx.scene.enter(actionType);
    } else ctx.reply(messages.youAreNotAdmin);
  });
}
ADMIN_ACTIONS.forEach((actionType) => enterAdminAction(actionType));

// ============================================================

composer.command("admin", async (ctx) => {
  const admins = await Admin.find();
  if (admins.length === 0) ctx.scene.enter("newAdmin");
});
composer.command("change_password", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);
  ctx.scene.enter("changePasswordScene");
});

composer.hears(["👨‍💻 Ish maydoni", kirillga("👨‍💻 Ish maydoni")], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);

  ctx.reply(messages.chooseMenu, keyboards.adminWorkSpace);
});

composer.action("ulim_guvohnomasini_qabul_qilish", async (ctx) => {
  try {
    if (!(await isAdmin(ctx))) {
      return ctx.reply(messages.youAreNotAdmin);
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

    await ctx.answerCbQuery(messages.sended);
  } catch (error) {
    console.error(error);
    // Handle errors here
    // You might want to return an error message to the user or log it for further investigation
    ctx.reply("An error occurred while processing your request.");
  }
});

// ======================== Special functions (not required just shortcuts) ========================//

composer.hears("Sud buyruqlarini billingga yuklash", (ctx) => {});

composer.command("help", (ctx) => {
  ctx.reply(
    `<b> 🚀 Bot nazoratlarini boshqarish uchun qanday so'raying? </b>\n\n` +
      `1️⃣ /start - Botni qo'rsatish\n` +
      `2️⃣ /admin - Bot administratorlar uchun qanday so'raying?\n` +
      `3️⃣ /tushum - Botning Tushum shartnomasini o'qish\n` +
      `4️⃣ /debit - Botning debit viloyatlarini o'qish\n` +
      `5️⃣ /mvd_PINFIL - MVD-ning PINFIL-iga mos qilingan manzilni o'qish\n`,
    { parse_mode: "HTML" }
  );
});
composer.command("tushum", async (ctx) => {
  // nazoratchilarKunlikTushum();
  sendMFYIncomeReport();
});

composer.hears(/mvd_\w+/g, (ctx) => {
  find_address_by_pinfil_from_mvd(Number(ctx.message.text.split("_")[1]))
    .then((res) => {
      console.log(res);
      ctx.reply(
        `<code>${res.details.PermanentRegistration.Cadastre}</code>\n<code>${res.details.PermanentRegistration.Address}</code>`,
        { parse_mode: "HTML" }
      );
    })
    .catch((err) => console.log(err));
});
composer.hears(/k_\w+/g, (ctx) => {
  find_address_by_pinfil_from_mvd(Number(ctx.message.text.split("_")[1])).then(
    (res) => {
      ctx.reply(
        `<code>${res.details.PermanentRegistration.Cadastre}</code>\n<code>${res.details.PermanentRegistration.Address}</code>`,
        { parse_mode: "HTML" }
      );
    }
  );
});

composer.hears("pochtaHarajatiniTekshirishScene", (ctx) =>
  ctx.scene.enter("pochtaHarajatiniTekshirishScene")
);
composer.hears(
  "Talabnomalarni import qilish",

  (ctx) => {
    ctx.scene.enter("uploadWarningTozamakonScene");
  }
);

bot.use(composer);
