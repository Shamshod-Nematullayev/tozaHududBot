// requires
const { Markup } = require("telegraf");
const { Mahalla } = require("../models/Mahalla");
const { NewAbonent } = require("../models/NewAbonents");
const {
  Composer,
  bot,
  messages,
  keyboards,
  Nazoratchi,
  Admin,
  Abonent,
} = require("../requires");
const { Target } = require("../models/TargetAbonent");
const { kirillga } = require("../middlewares/smallFunctions/lotinKiril");
const { createTozaMakonApi } = require("../api/tozaMakon");

const composer = new Composer();
composer.command("user", (ctx) => {
  ctx.reply(`Sizning id raqamingiz: <code> ${ctx.from.id}</code>`, {
    parse_mode: "HTML",
  });
});
composer.hears(
  ["👤Yangi abonent ochish", kirillga("👤Yangi abonent ochish")],
  (ctx) => {
    ctx.scene.enter("new_abonent_request");
  }
);
composer.hears(["🔎Izlash", kirillga("🔎Izlash")], (ctx) => {
  ctx.scene.enter("SEARCH_BY_NAME");
});
composer.hears(["📅Abonent karta", kirillga("📅Abonent karta")], (ctx) => {
  ctx.scene.enter("getAbonentCard");
});
composer.hears(
  ["🔌 ELEKTR KODI🔌", kirillga("🔌 ELEKTR KODI🔌")],
  async (ctx) => {
    ctx.scene.enter("updateElektrKod");
  }
);

composer.hears(
  ["👥Mening abonentlarim", kirillga("👥Mening abonentlarim")],
  async (ctx) => {
    try {
      const nazoratchi = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      if (!nazoratchi) {
        return ctx.reply(`Siz bunday huquqga ega emassiz`);
      }

      const mahallalar = await Mahalla.find({
        "biriktirilganNazoratchi.inspactor_id": nazoratchi.id,
      });
      if (mahallalar.length == 0) {
        return ctx.reply("Sizga biriktirilgan mahallalar yo'q!");
      }
      const keys = mahallalar.map((mfy) => {
        return [Markup.button.callback(mfy.name, "newAbonentsList_" + mfy.id)];
      });
      ctx.reply("Sizga biriktirilgan mahallalar", Markup.inlineKeyboard(keys));
    } catch (err) {
      console.error(err);
      ctx.reply("Xatolik");
    }
  }
);
composer.action(/newAbonentsList_/, async (ctx) => {
  try {
    await ctx.deleteMessage();
    const abonents = await NewAbonent.find({
      mahalla_id: ctx.callbackQuery.data.split("_")[1],
    });
    let str = "";
    if (abonents.length == 0) {
      return ctx.reply("Abonentlar yo'q!");
    }
    abonents.forEach((abonent) => {
      str += `<b>${abonent.licshet}</b> = ${abonent.abonent_name}\n`;
    });
    ctx.replyWithHTML(str);
  } catch (err) {
    console.error(err);
    ctx.reply("Xatolik");
  }
});

composer.hears(["📓Qo`llanma", kirillga("📓Qo`llanma")], (ctx) => {
  ctx.reply("Hozircha video qo'llanma mavjud emas. 🧠 Ishlatish kifoya");
});
composer.hears(
  ["✏️Ma'lumotlarini o'zgartirish", kirillga("✏️Ma'lumotlarini o'zgartirish")],
  (ctx) => {
    ctx.reply(messages.chooseEditType, keyboards.editTypes.oneTime());
  }
);

composer.hears(["⚙Sozlamalar", kirillga("⚙Sozlamalar")], (ctx) => {
  ctx.reply(messages.chooseMenu, keyboards.settings);
});

composer.hears(["✒️Sudga xat✒️", kirillga("✒️Sudga xat✒️")], (ctx) => {
  ctx.reply(
    `To'lov qilishdan bosh tortgan abonentlarni majburiy undiruvga qaratish bo'limi`,
    keyboards.targetMenuKeyboard
  );
});

composer.action("getTargets", async (ctx) => {
  try {
    await ctx.deleteMessage();
    const inspector = await Nazoratchi.findOne({
      telegram_id: ctx.from.id,
    });
    if (!inspector || !inspector.activ)
      return ctx.reply("Sizga ruxsat berilmagan!", keyboards.cancelBtn);

    const mahallalar = await Mahalla.find({
      "biriktirilganNazoratchi.inspactor_id": inspector.id,
    });
    if (!mahallalar.length)
      return ctx.reply("Sizga biriktirilgan mahallalar yo'q!");

    const keys = mahallalar.map((mfy) => [
      Markup.button.callback(mfy.name, `getTargets_${mfy.id}`),
    ]);
    ctx.reply("Mahallani tanlang!", Markup.inlineKeyboard(keys));
  } catch (error) {
    ctx.reply("Xatolik mainCommands.js");
    console.error(error);
  }
});

composer.action(/getTargets_/, async (ctx) => {
  try {
    await ctx.deleteMessage();
    const mahalla_id = ctx.callbackQuery.data.split("_")[1];
    const targets = await Target.find({ mahalla_id });
    if (!targets.length) return ctx.reply("Ro'yxat bo'sh");

    let text = ``;
    targets.forEach((target, index) => {
      text += `${index + 1}. <code>${target.accountNumber}</code> <b>${
        target.fullName
      }</b>\n`;
    });
    ctx.replyWithHTML(text);
  } catch (error) {
    ctx.reply("Xatolik mainCommands.js");
    console.error(error);
  }
});

// Entering to scene by inline buttons
const actions = [
  "GUVOHNOMA_KIRITISH",
  "multiply_livings",
  "update_abonent_date_by_pinfil",
  "connect_phone_number",
  "changeAbonentStreet",
  "createTarget",
];

actions.forEach((action) => {
  composer.action(action, async (ctx) => {
    try {
      const nazoratchi = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      if (!nazoratchi) {
        return await ctx.reply(
          "Ushbu amaliyotni bajarish uchun yetarli huquqqa ega emassiz"
        );
      }
      ctx.scene.enter(action);
      await ctx.deleteMessage();
    } catch (error) {
      console.error(error);
    }
  });
});

composer.hears(/add-abonent_/, async (ctx) => {
  try {
    const admin = await Admin.findOne({ user_id: ctx.from.id });
    if (!admin) return ctx.reply("Sizda huquq yo'q");
    const licshet = ctx.message.text.split("_")[1];
    const abonent = await Abonent.findOne({ licshet });
    if (abonent) return ctx.reply("Bu abonent tizimda allaqachon mavjud");

    const tozaMakonApi = createTozaMakonApi(admin.companyId);

    let abonentData = (
      await tozaMakonApi.get("/user-service/residents", {
        params: {
          districtId: 47,
          sort: "id,DESC",
          page: 0,
          size: 5,
          accountNumber: licshet,
        },
      })
    ).data.content;
    if (abonentData.length != 1) return ctx.reply("Billingda topilmadi");
    abonentData = abonentData[0];
    await Abonent.create({
      fio: abonentData.fullName,
      licshet: abonentData.accountNumber,
      energy_licshet: abonentData.electricityAccountNumber,
      kadastr_number: abonentData.cadastralNumber,
      mahalla_name: abonentData.mahallaName,
      mahallas_id: abonentData.mahallaId,
      streets_id: abonentData.streetId,
      phone: abonentData.phone,
      pinfl: abonentData.pinfl,
      passport_number: abonentData.passport,
      id: abonentData.id,
      companyId: admin.companyId,
    });
    await ctx.reply("Abonent muvaffaqqiyatli yaratildi");
  } catch (error) {
    console.log(error.message);
    ctx.reply("Error" + error.message);
  }
});

bot.use(composer);
