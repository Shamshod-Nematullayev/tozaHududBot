const {
  getAllMails,
  gertOneMailById,
  createMail,
} = require("../api/hybrid.pochta.uz/");
const { HybridMail } = require("../models/HybridMail");
const {
  // node modules
  fs,
  path,
  xlsx,
  htmlPDF,
  ejs,
  // required functions
  drawAndSendTushum,
  fetchEcopayTushum,
  fetchEcoTranzaksiyalar,
  drawDebitViloyat,
  yashovchiSoniKopaytirish,
  find_address_by_pinfil_from_mvd,
  getAbonentCardHtml,
  getAbonentSaldoData,
  // telegraf resourses
  Composer,
  bot,
  keyboards,
  messages,
  // mongo models
  Admin,
  CleanCitySession,
  Counter,
  Guvohnoma,
  Abonent,
  Bildirishnoma,
  MultiplyRequest,
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
  "show_abonent_pic",
  "generate_alert_letter",
  "add_notification",
  "new_abonent",
  "shaxsi_tashdiqlandi_bildirish_xati",
  "user_to_inspektor",
  "get_sud_material",
  "ommaviy_shartnoma_biriktirish",
  "generateProkuraturaSudAriza",
  "sudBuyruqlariYaratish",
];

function enterAdminAction(actionType) {
  if (!actionType) return;

  composer.action(actionType, (ctx) => {
    if (isAdmin(ctx)) {
      ctx.deleteMessage();
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

composer.hears(["👨‍💻 Ish maydoni", "👨‍💻 Иш майдони"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);

  ctx.reply(messages.chooseMenu, keyboards[ctx.session.til].adminWorkSpace);
});

composer.action("CHARGE_VILOYAT_LOGIN", async (ctx) => {
  await ctx.deleteMessage();
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
composer.action(/done_\w+/g, async (ctx) => {
  try {
    if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);

    const doneCb = ctx.update.callback_query.data;
    const req = await MultiplyRequest.findById(doneCb.split("_")[1]);

    const cleancityResponse = await yashovchiSoniKopaytirish(
      req.KOD,
      req.YASHOVCHILAR
    );
    if (!cleancityResponse.success) {
      await ctx.telegram.sendMessage(
        req.from.id,
        `<code>${req.KOD}</code>\n ${req.YASHOVCHILAR} kishi \n 🟥🟥 Bekor qilindi. \n Asos: ${cleancityResponse.msg}`,
        { parse_mode: "HTML" }
      );
      await req.updateOne({
        $set: {
          confirm: false,
        },
      });
      await ctx.answerCbQuery(cleancityResponse.msg);
    } else {
      await ctx.answerCbQuery(JSON.stringify(cleancityResponse));
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
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    }
  } catch (error) {
    console.log(error);
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

composer.hears("Aborotka chiqorish", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);
  ctx.scene.enter("draw_abarotka");
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

composer.hears(/karta_/g, async (ctx) => {
  const html = await getAbonentCardHtml(ctx.message.text.split("_")[1]);
  htmlPDF
    .create(html, {
      format: "A4",
      orientation: "portrait",
    })
    .toFile("./uploads/abonent_card.pdf", async (err, res) => {
      if (err) throw err;
      await ctx.replyWithDocument({ source: "./uploads/abonent_card.pdf" });
      fs.unlink("./uploads/abonent_card.pdf", (err) =>
        err ? console.log(err) : ""
      );
    });
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
        resolve(base64PDF);
      });
  });
  return await convertPDF;
}
composer.hears(/xat_/g, async (ctx) => {
  const licshet = ctx.message.text.split("_")[1];
  const mail = await HybridMail.findOne({ licshet });
  if (mail) return { ok: false, message: "Mail already exists" };

  const abonentData = await getAbonentSaldoData(licshet);
  const base64PDF = await createWarningLetterPDF(licshet);
  const newMail = await createMail(
    `${abonentData.mahalla_name}, ${abonentData.streets_name}`,
    abonentData.fio,
    base64PDF
  );
  await HybridMail.create({
    licshet: licshet,
    type: "xat",
    hybridMailId: newMail.Id,
    createdOn: new Date(),
    receiver: abonentData.fio,
  });
  console.log(newMail);
  // ctx.replyWithDocument({ source: pdfFilePath });
});

bot.use(composer);
