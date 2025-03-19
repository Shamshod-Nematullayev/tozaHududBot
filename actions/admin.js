const { tozaMakonApi } = require("../api/tozaMakon");
const { NOTIFICATIONS_CHANNEL_ID } = require("../constants");
const {
  nazoratchilarKunlikTushum,
} = require("../intervals/nazoratchilarKunlikTushum");
const { sendMFYIncomeReport } = require("../intervals/sendMFYIncomeReport");
const { kirillga } = require("../middlewares/smallFunctions/lotinKiril");
const { Notification } = require("../models/Notification");
const {
  // node modules
  fs,
  path,
  xlsx,
  htmlPDF,
  ejs,
  // required functions
  drawDebitViloyat,
  find_address_by_pinfil_from_mvd,
  getAbonentCardHtml,
  // telegraf resourses
  Composer,
  bot,
  keyboards,
  messages,
  // mongo models
  Admin,
  Counter,
  Guvohnoma,
  Abonent,
  Bildirishnoma,
} = require("./../requires");

// small required functions =========================================================================
function bugungiSana() {
  const date = new Date();
  return `${date.getDate()}.${
    date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
  }.${date.getFullYear()}`;
}

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
  // "new_abonent",
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

// yashovchi soni ko'paytirish so'rovini tasdiqlash funksiyasi
// composer.action(/done_\w+/g, async (ctx) => {
//   try {
//     if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);

//     const doneCb = ctx.update.callback_query.data;
//     const req = await MultiplyRequest.findById(doneCb.split("_")[1]);

//     const response = await tozaMakonApi.patch(
//       "/user-service/residents/inhabitant/" + req.abonent.id,
//       {
//         inhabitantCount: req.YASHOVCHILAR,
//       }
//     );
//     if (response.status !== 200) {
//       await ctx.telegram.sendMessage(
//         req.from.id,
//         `<code>${req.KOD}</code>\n ${req.YASHOVCHILAR} kishi \n 🟥🟥 Bekor qilindi. \n Asos: ${cleancityResponse.msg}`,
//         { parse_mode: "HTML" }
//       );
//       await req.updateOne({
//         $set: {
//           confirm: false,
//         },
//       });
//       console.error(response.data);
//       await ctx.answerCbQuery("Tizimga kiritda xatolik kuzatildi");
//     } else {
//       await ctx.answerCbQuery("Tizimga kiritildi");
//       await ctx.telegram.sendMessage(
//         req.from.id,
//         `<code>${req.KOD}</code>\n ${req.YASHOVCHILAR} kishi \n ✅✅ Tasdiqlandi`,
//         { parse_mode: "HTML" }
//       );
//       await ctx.editMessageText(
//         `#yashovchisoni by <a href="https://t.me/${req.from.username}">${req.from.first_name}</a>\n<code>${req.KOD}</code>\n${req.YASHOVCHILAR} kishi \n✅✅✅ by <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
//         { parse_mode: "HTML", disable_web_page_preview: true }
//       );
//       await ctx.telegram.forwardMessage(
//         process.env.NAZORATCHILAR_GURUPPASI,
//         process.env.CHANNEL,
//         ctx.callbackQuery.message.message_id
//       );
//       await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
//     }
//   } catch (error) {
//     console.log(error);
//   }
// });

composer.action(/notification_\w+/g, async (ctx) => {
  const notificationCb = ctx.update.callback_query.data;
  const notificationId = notificationCb.split("_")[1];
  const notification = await Notification.findById(notificationId);
  await notification.updateOne({ $set: { status: "read" } });
  ctx.telegram.editMessageText(
    NOTIFICATIONS_CHANNEL_ID,
    notification.message_id,
    1,
    ctx.update.callback_query.message.text
  );
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

composer.hears("debit", (ctx) => {
  drawDebitViloyat("toMySelf");
});

composer.hears(/mvd_\w+/g, (ctx) => {
  console.log("here");
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

const mahallaGroup = {
  id: -1002104743021,
  title: "Тоза Худуд МФЙ раислари Каттақўрғон гурухи",
  type: "supergroup",
};

// this shortcut for export billing_abonents collection from mongodb
composer.hears("export_abonents", async (ctx) => {
  let abonents = await Abonent.find({}, { photo: 0 });
  const content = [];
  abonents = abonents.sort((a, b) => a.fio.localeCompare(b.fio));
  abonents.forEach((abonent, i) => {
    content.push({
      tartib: i + 1,
      licshet: abonent.licshet,
      fio: abonent.fio,
      fio2: `${abonent.last_name} ${abonent.first_name} ${abonent.middle_name}`,
      street: abonent.mahalla_name,
      kadastr_number: abonent.kadastr_number,
      passport: abonent.passport_number,
      pinfl: abonent.pinfl,
      confirm: abonent.shaxsi_tasdiqlandi?.confirm,
    });
  });

  const data = [
    {
      Sheet: "Abonents",
      columns: [
        { label: "№", value: "tartib" },
        { label: "Лицевой", value: "licshet" },
        { label: "ФИО--", value: "fio" },
        { label: "ФИО--2", value: "fio2" },
        { label: "Кўча", value: "street" },
        { label: "Кадастр", value: "kadastr_number" },
        { label: "ПАССПОРТ", value: "passport" },
        { label: "ЖШШИР", value: "pinfl" },
        { label: "Шахси тасдиқланди", value: "confirm" },
      ],
      content,
    },
  ];

  const fileName = path.join(__dirname + "/../uploads/", "abonents");
  let settings = {
    fileName: fileName,
    extraLength: 3,
    writeMode: "writeFile",
    writeOptions: {},
  };
  await xlsx(data, settings);
  await ctx.replyWithDocument({ source: fileName + ".xlsx" });
});

composer.hears("q", async (ctx) => {
  const xatlar = await Bildirishnoma.find({ type: "sudga_chiqoring" });
  const fileName = path.join(__dirname + "/../uploads/", "bildirish_xati bor");
  let settings = {
    fileName: fileName,
    writeMode: "writeFile",
    writeOptions: {},
  };
  const ishdanKetganNazoratchilar = [27300, 200, 29203];
  const content = [];
  xatlar.forEach((xat) => {
    let ishdanKetganYozgan = false;
    ishdanKetganNazoratchilar.forEach((id) => {
      if (xat.inspector.id == id) {
        ishdanKetganYozgan = true;
      }
    });
    if (!ishdanKetganYozgan) {
      xat.abonents.forEach((kod) => {
        content.push({ licshet: kod });
      });
    }
  });
  const data = [
    {
      Sheet: "Abonents",
      columns: [{ label: "Лицевой", value: "licshet" }],
      content,
    },
  ];

  await xlsx(data, settings);
  await ctx.replyWithDocument({ source: fileName + ".xlsx" });
  fs.unlink(fileName + ".xlsx", (err) => {});
});

composer.hears("OGOHLANTIRISH XATLARI IMPORT", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);

  ctx.scene.enter("importAlertLetters");
});
composer.hears("ExportAbonentCards", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);

  ctx.scene.enter("exportAbonentCards");
});
composer.hears("ExportWarningLettersZip", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);

  ctx.scene.enter("exportWarningLettersZip");
});

composer.hears("pochtaHarajatiniTekshirishScene", (ctx) =>
  ctx.scene.enter("pochtaHarajatiniTekshirishScene")
);
async function createWarningLetterPDF(licshet) {
  const abonentData = await getAbonentSaldoData(licshet);
  if (!abonentData)
    return { success: false, message: "Abonent data not found" };
  const data = {
    FISH: abonentData.fio,
    MFY: abonentData.mahalla_name,
    STREET: abonentData.streets_name,
    KOD: abonentData.licshet,
    SALDO: abonentData.saldo_k,
    SANA: bugungiSana(),
  };
  const createHtmlString = new Promise((resolve, reject) => {
    ejs.renderFile(
      path.join(__dirname, "../", "views", "gibrid.ogohlantirish.ejs"),
      { data },
      {},
      (err, str) => {
        if (err) return reject(err);
        resolve(str);
      }
    );
  });

  const html = await createHtmlString;
  const convertPDF = new Promise((resolve, reject) => {
    htmlPDF
      .create(html, { format: "A4", orientation: "portrait" })
      .toBuffer((err, str) => {
        if (err) return reject(err);
        const base64PDF = str.toString("base64");
        resolve({ success: true, data: base64PDF });
      });
  });
  return await convertPDF;
}

bot.use(composer);
