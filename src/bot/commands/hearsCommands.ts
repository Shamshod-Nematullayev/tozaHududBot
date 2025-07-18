import { createTozaMakonApi } from "@api/tozaMakon.js";
import { isValidAccountNumber } from "@bot/middlewares/scene/utils/validator.js";
import { kirillga } from "@bot/middlewares/smallFunctions/lotinKiril.js";
import { keyboards } from "@lib/keyboards.js";
import { messages } from "@lib/messages.js";
import { Abonent } from "@models/Abonent.js";
import { Admin } from "@models/Admin.js";
import { Mahalla } from "@models/Mahalla.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { searchAbonent } from "@services/billing/index.js";
import { Composer, Markup } from "telegraf";
import { MyContext } from "types/botContext";
import { scenaNames } from "types/scenes.js";

const composer = new Composer<MyContext>();

const hearsActions = [
  {
    buttons: ["👤Yangi abonent ochish"],
    listener: (ctx: MyContext) =>
      ctx.scene.enter(scenaNames.new_abonent_request),
  },
  {
    buttons: ["🔎Izlash"],
    listener: (ctx: MyContext) => ctx.scene.enter("SEARCH_BY_NAME"),
  },
  {
    buttons: ["📅Abonent karta"],
    listener: (ctx: MyContext) => {
      console.log(ctx);
      ctx.scene.enter("getAbonentCard");
    },
  },
  {
    buttons: ["✉️Ogohlantrish xati"],
    listener: (ctx: MyContext) => ctx.scene.enter("getWarningLetter"),
  },
  {
    buttons: ["🔌 ELEKTR KODI🔌"],
    listener: async (ctx: MyContext) => {
      ctx.scene.enter("updateElektrKod");
    },
  },
  {
    buttons: ["👥Mening abonentlarim"],
    listener: async (ctx: MyContext) => {
      try {
        const nazoratchi = await Nazoratchi.findOne({
          telegram_id: ctx.from?.id,
        });
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
          return [
            Markup.button.callback(mfy.name, "newAbonentsList_" + mfy.id),
          ];
        });
        ctx.reply(
          "Sizga biriktirilgan mahallalar",
          Markup.inlineKeyboard(keys)
        );
      } catch (err) {
        console.error(err);
        ctx.reply("Xatolik");
      }
    },
  },
  {
    buttons: ["📓Qo`llanma"],
    listener: (ctx: MyContext) => {
      ctx.reply("Hozircha video qo'llanma mavjud emas. 🧠 Ishlatish kifoya");
    },
  },
  {
    buttons: ["✏️Ma'lumotlarini o'zgartirish"],
    listener: (ctx: MyContext) => {
      ctx.reply(messages.chooseEditType, keyboards.editTypes);
    },
  },
  {
    buttons: ["⚙Sozlamalar"],
    listener: (ctx: MyContext) => {
      ctx.reply(messages.chooseMenu, keyboards.settings);
    },
  },
  {
    buttons: ["✒️Sudga xat✒️"],
    listener: (ctx: MyContext) => {
      ctx.reply(
        `To'lov qilishdan bosh tortgan abonentlarni majburiy undiruvga qaratish bo'limi`,
        keyboards.targetMenuKeyboard
      );
    },
  },
];

hearsActions.forEach(({ buttons, listener }) => {
  let buttonsKirill = buttons.map((button) => kirillga(button));
  composer.hears([...buttons, ...buttonsKirill], listener);
});

// Addintional commands (ShortCuts)

composer.hears(/add-abonent_/, async (ctx) => {
  try {
    const admin = await Admin.findOne({ user_id: ctx.from.id });
    if (!admin) return ctx.reply("Sizda huquq yo'q");
    const licshet = ctx.message.text.split("_")[1];
    if (!isValidAccountNumber(licshet))
      return ctx.reply("Abonent hisob raqamini to'g'ri kiriting");
    const abonent = await Abonent.findOne({ licshet });
    if (abonent) return ctx.reply("Bu abonent tizimda allaqachon mavjud");

    const tozaMakonApi = createTozaMakonApi(admin.companyId);

    const searchResult = (
      await searchAbonent(tozaMakonApi, {
        accountNumber: licshet,
        companyId: admin.companyId,
      })
    ).content;

    if (searchResult.length != 1) return ctx.reply("Billingda topilmadi");

    const abonentData = searchResult[0];
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
  } catch (error: any) {
    console.log(error.message);
    ctx.reply("Error" + error.message);
  }
});

export default composer;
