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
} = require("../middlewares/scene/adminActions/cleancity/dxsh/yashovchiSoniKopaytirish");
const { Counter } = require("../models/Counter");
const { Guvohnoma } = require("../models/Guvohnoma");
const { MultiplyRequest } = require("../models/MultiplyRequest");
const {
  yangiAbonent,
} = require("../middlewares/scene/adminActions/cleancity/dxsh/yangiAbonent");
const {
  find_one_by_pinfil_from_mvd,
  find_address_by_pinfil_from_mvd,
} = require("../api/mvd-pinfil");
const {
  changeAbonentDates,
} = require("../middlewares/scene/adminActions/cleancity/dxsh/abonentMalumotlariniOzgartirish");
const {
  sendMahallaKunlikTushum,
  getMahallaKunlikTushum,
  drawMahallaKunlikTushum,
} = require("../intervals/mahallaKunlikTushum");
const { Abonent } = require("../models/Abonent");
const fs = require("fs");
const path = require("path");
const xlsx = require("json-as-xlsx");
const { Bildirishnoma } = require("../models/SudBildirishnoma");
const {
  importAlertLetter,
} = require("../middlewares/scene/adminActions/cleancity/dxsh/importAlertLetter");
const {
  getAbonentCardHtml,
} = require("../api/cleancity/dxsh/getAbonentCardHTML");
const htmlPDF = require("html-pdf");
const {
  getLastAlertLetter,
} = require("../api/cleancity/dxsh/getLastAlertLetter");
const {
  enterWarningLetterToBilling,
} = require("../api/cleancity/dxsh/enterWarningLetterToBilling");

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
  "new_abonent",
  "shaxsi_tashdiqlandi_bildirish_xati",
  "user_to_inspektor",
  "get_sud_material",
  "ommaviy_shartnoma_biriktirish",
  "generateProkuraturaSudAriza",
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
      ctx.reply(messages.youAreNotAdmin);
    }
  });
}
ADMIN_ACTIONS.forEach((actionType) => enterAdminAction(actionType));

composer.command("admin", async (ctx) => {
  const admins = await Admin.find();
  if (admins.length === 0) ctx.scene.enter("newAdmin");
});

composer.hears(["👨‍💻 Ish maydoni", "👨‍💻 Иш майдони"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);

  ctx.reply(messages.chooseMenu, keyboards[ctx.session.til].adminWorkSpace);
});

composer.hears(["Тушумни ташлаш", "Tushumni tashlash"], async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);

  ctx.scene.enter("import_income_report");
});

composer.action("CHARGE_VILOYAT_LOGIN", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);

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
    }
  } catch (error) {
    console.log(error);
  }
});

composer.hears("Aborotka chiqorish", async (ctx) => {
  if (!(await isAdmin(ctx))) return ctx.reply(messages.youAreNotAdmin);
  ctx.scene.enter("draw_abarotka");
});

composer.hears(/mvd_\w+/g, (ctx) => {
  // find_one_by_pinfil_from_mvd(Number(ctx.message.text.split("_")[1])).then(
  //   (res) => {
  //     console.log(res);
  //   }
  // );
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
  // find_one_by_pinfil_from_mvd(Number(ctx.message.text.split("_")[1])).then(
  //   (res) => {
  //     console.log(res);
  //   }
  // );
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

bot.hears("kunlik", (ctx) => {
  const date = new Date();
  getMahallaKunlikTushum(date).then(async (rows) => {
    const imgPath = await drawMahallaKunlikTushum(rows, new Date());
    sendMahallaKunlikTushum([1382670100, mahallaGroup.id], imgPath, ctx);
  });
});

composer.hears("export_abonents", async (ctx) => {
  let abonents = await Abonent.find({}, { photo: 0 });
  const content = [];
  abonents = abonents.sort((a, b) => a.fio.localeCompare(b.fio));
  abonents.forEach((abonent, i) => {
    content.push({
      tartib: i + 1,
      licshet: abonent.licshet,
      fio: abonent.fio,
      street: abonent.mahalla_name,
      kadastr_number: abonent.kadastr_number,
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
        { label: "Кўча", value: "street" },
        { label: "Кадастр", value: "kadastr_number" },
        { label: "ЖШШИР", value: "pinfl" },
        { label: "Шахси тасдиқланди", value: "confirm" },
      ],
      content,
    },
  ];

  const fileName = path.join(__dirname + "/../uploads/", "abonents");
  let settings = {
    fileName: fileName, // Name of the resulting spreadsheet
    extraLength: 3, // A bigger number means that columns will be wider
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    // RTL: true, // Display the columns from right-to-left (the default value is false)
  };
  await xlsx(data, settings);
  await ctx.replyWithDocument({ source: fileName + ".xlsx" });
  // fs.unlink(fileName + ".xlsx", (err) => {
  //   if (err) throw err;
  // });
});

composer.hears("q", async (ctx) => {
  const xatlar = await Bildirishnoma.find({ type: "sudga_chiqoring" });
  const fileName = path.join(__dirname + "/../uploads/", "bildirish_xati bor");
  let settings = {
    fileName: fileName, // Name of the resulting spreadsheet
    extraLength: 3, // A bigger number means that columns will be wider
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    // RTL: true, // Display the columns from right-to-left (the default value is false)
  };
  const content = [];
  xatlar.forEach((xat) => {
    xat.abonents.forEach((kod) => {
      content.push({ licshet: kod });
    });
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
});

composer.hears(/karta_/g, async (ctx) => {
  const html = await getAbonentCardHtml(ctx.message.text.split("_")[1]);
  htmlPDF
    .create(html, {
      format: "A4",
      orientation: "portrait",
    })
    .toFile("./uploads/abonent_card.pdf", (err, res) => {
      if (err) throw err;
      ctx.replyWithDocument({ source: "./uploads/abonent_card.pdf" });
      // .then(() => {
      //   fs.unlink("./uploads/abonent_card.pdf", (err) =>
      //     err ? console.log(err) : ""
      //   );
      // });
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

composer.hears("a", (ctx) => {
  importAlertLetter();
});
composer.hears("b", async (ctx) => {
  console.log(
    await enterWarningLetterToBilling({
      lischet: "105120380070",
      qarzdorlik: 217464,
      comment: "Test 1",
      sana: "07.03.2024",
      file_path: "./380070.PDF",
    })
  );
});

bot.use(composer);
