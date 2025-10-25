import { Scenes, Markup } from "telegraf";

import { Abonent, IAbonentDoc } from "@models/Abonent.js";

import { Company } from "@models/Company.js";

import isCancel from "../../smallFunctions/isCancel.js";
import { messages } from "@lib/messages.js";

import { keyboards, createInlineKeyboard } from "@lib/keyboards.js";

import { find_one_by_pinfil_from_mvd } from "@api/mvd-pinfil.js";

import isPinfl from "../../smallFunctions/isPinfl.js";
import { CustomDataRequest } from "@models/CustomDataRequest.js";

import { Nazoratchi } from "@models/Nazoratchi.js";

import { createTozaMakonApi } from "@api/tozaMakon.js";

import { extractBirthDateString } from "../../../../helpers/extractBirthDateFromPinfl.js";
import {
  Abonent as IAbonent,
  getAbonentById,
} from "@services/billing/getAbonentById.js";

import { WizardWithState } from "@bot/helpers/WizardWithState.js";
import { isCallbackQueryMessage, isTextMessage } from "../utils/validator.js";
import { ErrorTypes } from "@bot/utils/errorHandler.js";
import { getFileAsBuffer } from "@services/billing/getFileAsBufferFromTozamakon.js";
import { getCitizen } from "@services/billing/getCitizen.js";

interface MyWizardState {
  pinfl?: string;
  reUpdating?: boolean;
  inspector_id?: string;
  inspector_name?: string;
  companyId?: number;
  abonent?: IAbonentDoc;
  customDates?: any;
  abonentOnBilling?: IAbonent;
}

type Ctx = WizardWithState<MyWizardState>;

export const updateAbonentDatesByPinfl = new Scenes.WizardScene<Ctx>(
  "update_abonent_date_by_pinfil",
  async (ctx) => {
    try {
      ctx.wizard.state.reUpdating = false;
      const inspektor = await Nazoratchi.findOne({
        telegram_id: ctx.from?.id,
        activ: true,
      });
      if (!inspektor) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
        );
        return ctx.scene.leave();
      }
      const company = await Company.findOne({ id: inspektor.companyId });
      if (!company) throw "Company not found";
      const now = new Date();
      if (!company.active || company.activeExpiresDate < now) {
        await ctx.reply(
          "Dastur faoliyati vaqtincha cheklangan. \nIltimos, xizmatlardan foydalanishni davom ettirish uchun to‘lovni amalga oshiring."
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.inspector_id = inspektor._id.toString();
      ctx.wizard.state.inspector_name = inspektor.name;
      ctx.wizard.state.companyId = inspektor.companyId;
      if (!ctx.message || !("text" in ctx.message))
        return ctx.reply(
          "kutilgan ma'lumot kiritilmadi",
          keyboards.cancelBtn.resize()
        );
      if (ctx.message && isCancel(ctx.message.text)) {
        ctx.reply("Bekor qilindi");
        return ctx.scene.leave();
      }
      if (isNaN(Number(ctx.message.text)))
        return ctx.reply(
          messages.enterOnlyNumber,
          keyboards.cancelBtn.resize()
        );
      const abonents = await Abonent.find({
        licshet: new RegExp(ctx.message.text),
        companyId: inspektor.companyId,
      });
      if (abonents.length !== 1) {
        return ctx.reply(
          "Siz kiritgan hisob raqami bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.cancelBtn.resize()
        );
      }
      const abonent = abonents[0];
      const abonentOnBilling = await getAbonentById(
        createTozaMakonApi(inspektor.companyId),
        abonent.id
      );
      if (!abonentOnBilling) {
        return ctx.reply(
          "Siz kiritgan hisob raqami bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.cancelBtn.resize()
        );
      }
      abonent.pinfl = Number(abonentOnBilling.citizen.pnfl);
      ctx.wizard.state.abonent = abonent;
      ctx.wizard.state.abonentOnBilling = abonentOnBilling;
      // agar abonentning shaxsi tasdiqlangan bo'lsa ogohlantirish
      if (abonent.shaxsi_tasdiqlandi && abonent.shaxsi_tasdiqlandi.confirm) {
        if (abonent.companyId === 1144 && inspektor.id !== 17413) {
          ctx.scene.leave();
          return ctx.reply(
            `Ushbu abonent ${
              abonent.shaxsi_tasdiqlandi.inspector?.name ||
              abonent.shaxsi_tasdiqlandi.inspector_name
            } tomonidan allaqachon shaxsi tasdiqlangan!`
          );
        }
        ctx.reply(
          `Ushbu abonent ${
            abonent.shaxsi_tasdiqlandi.inspector?.name ||
            abonent.shaxsi_tasdiqlandi.inspector_name
          } tomonidan allaqachon shaxsi tasdiqlangan! Baribir o'zgartirmoqchimisiz?`,
          createInlineKeyboard([
            [
              ["Xa 👌", "yes"],
              ["Yo'q 🙅‍♂️", "no"],
            ],
          ])
        );
        ctx.wizard.selectStep(4);
        return;
      }
      const buttons = [];
      if (ctx.wizard.state.abonent.pinfl) {
        buttons.push([ctx.wizard.state.abonent.pinfl.toString()]);
      }
      buttons.push(["🚫Bekor qilish"]);
      ctx.replyWithHTML(
        `<b>${ctx.wizard.state.abonent.fio}</b>\n Pasport pinfil raqamini kiriting! \nDiqqat! pastda ko'rsatilgan raqam abonentning joriy raqami hisoblanadi`,
        Markup.keyboard(buttons).resize()
      );
      ctx.wizard.next();
    } catch (error: any) {
      console.error(error);
      ctx.reply("Xatolik kuzatildi, " + error?.message, keyboards.cancelBtn);
    }
  },
  async (ctx) => {
    // pinfil validatsiyasi
    if (!isTextMessage(ctx))
      return ctx.reply(
        "Kutilgan ma'lumot kiritilmadi",
        keyboards.cancelBtn.resize()
      );

    if (!isPinfl(ctx.message.text)) {
      return ctx.replyWithPhoto(
        "https://scontent.fbhk1-4.fna.fbcdn.net/v/t39.30808-6/245114763_1689005674643325_574715679907072430_n.jpg?cstp=mx960x540&ctp=s960x540&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=UuAJ9wX9hRUQ7kNvgFH6cIS&_nc_ht=scontent.fbhk1-4.fna&oh=00_AYBErDlZHdtXHYwOa1n9AicX7rhWP63Hkf8COiCnTKAlUw&oe=669E7F35",
        {
          caption: messages.enterReallyPinfl,
          reply_markup: keyboards.cancelBtn.resize().reply_markup,
        }
      );
    }
    // shaxsiy ma'lumotlarni olish
    const customDates = await find_one_by_pinfil_from_mvd(ctx.message.text);
    if (!customDates.success) {
      if (
        customDates.message ==
        "Hozirda baza ishlamayapti, keyinroq boshqatdan urinib ko'ring"
      ) {
        const tozaMakonApi = createTozaMakonApi(
          ctx.wizard.state.companyId as number
        );
        const birthdate = extractBirthDateString(ctx.message.text);
        const citizen = await getCitizen(tozaMakonApi, {
          pinfl: ctx.message.text,
          birthdate,
          photoStatus: "WITH_PHOTO",
        });
        if (citizen) {
          customDates.success = true;
          customDates.last_name = citizen.lastName;
          customDates.first_name = citizen.firstName;
          customDates.middle_name = citizen.patronymic;
          customDates.birth_date = citizen.birthDate;
          customDates.passport_serial = citizen.passport.slice(0, 2);
          customDates.passport_number = citizen.passport.slice(2);

          customDates.photo = citizen.photo;
        }
      } else {
        return ctx.reply(customDates.message, keyboards.cancelBtn.resize());
      }
    }
    if (customDates.first_name == "" || customDates.success === false) {
      return ctx.reply(
        "Ushbu fuqoroga tegishli ma'lumotlar topilmadi. PINFL to'g'ri kiritilganmikan tekshirib qaytadan kiriting",
        keyboards.cancelBtn.resize()
      ); // agarda ma'lumotlar topilmasa
    }
    ctx.wizard.state.pinfl = ctx.message.text;
    ctx.wizard.state.customDates = customDates;
    // nazoratchiga tasdiqlash uchun yuborish
    const buffer = customDates.isFromTozaMakon
      ? customDates.photo
      : Buffer.from(customDates.photo, "base64");
    await ctx.replyWithPhoto(
      { source: buffer },
      {
        caption: `<b>${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}</b> <i>${customDates.birth_date}</i>\n Siz shu kishini nazarda tutyapsizmi?`,
        reply_markup: createInlineKeyboard([
          [
            ["Xa 👌", "yes"],
            ["Yo'q 🙅‍♂️", "no"],
          ],
        ]).reply_markup,
        parse_mode: "HTML",
      }
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    const customDates = ctx.wizard.state.customDates;
    if (isTextMessage(ctx))
      return await ctx.replyWithHTML(
        `<b>${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}</b> <i>${customDates.birth_date}</i>\n Siz shu kishini nazarda tutyapsizmi?`,
        createInlineKeyboard([
          [
            ["Xa 👌", "yes"],
            ["Yo'q 🙅‍♂️", "no"],
          ],
        ])
      );
    if (!isCallbackQueryMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
    switch (ctx.callbackQuery?.data) {
      case "yes":
        await ctx.deleteMessage();
        const { ...data } = ctx.wizard.state.customDates;
        delete data.photo;
        const req = await CustomDataRequest.create({
          user: ctx.from,
          data: {
            ...data,
            pinfl: ctx.wizard.state.pinfl,
          },
          inspector_id: ctx.wizard.state.inspector_id,
          licshet: ctx.wizard.state.abonent?.licshet,
          reUpdating: ctx.wizard.state.reUpdating,
          companyId: ctx.wizard.state.companyId,
        });
        const buffer = customDates.isFromTozaMakon
          ? customDates.photo
          : Buffer.from(customDates.photo, "base64");
        let text = `KOD: ${ctx.wizard.state.abonent?.licshet}\nPasport: ${customDates.last_name} ${customDates.first_name} ${customDates.middle_name} ${customDates.birth_date}\nBilling: ${ctx.wizard.state.abonent?.fio}\nInspector: <a href="https://t.me/${ctx.from?.username}">${ctx.from?.first_name}</a> \n🔌KOD: ${ctx.wizard.state.abonentOnBilling?.electricityAccountNumber}`;
        if (ctx.wizard.state.reUpdating)
          text =
            "‼️<b>DIQQAT</b>‼️\nUshbu abonent ikkinchi marta shaxsi tasdiqlanmoqda\n" +
            text;

        const company = await Company.findOne({
          id: ctx.wizard.state.companyId,
        });
        if (!company) throw "Company not found";

        await ctx.telegram.sendPhoto(
          company.CHANNEL_ID_SHAXSI_TASDIQLANDI,
          { source: buffer },
          {
            caption: text,
            reply_markup: createInlineKeyboard([
              [
                ["✅✅", "shaxsitasdiqlandi_" + req._id + "_true"],
                ["🙅‍♂️🙅‍♂️", "shaxsitasdiqlandi_" + req._id + "_false"],
              ],
            ]).reply_markup,
            parse_mode: "HTML",
          }
        );
        ctx.reply(
          "Rahmat 😇\nMa'lumotlar tizim adminiga o'rganish uchun yuborildi..\n Yana kiritishni hohlaysizmi? 🙂",
          createInlineKeyboard([[["Xa", "xa"]], [["Yo'q", "yoq"]]])
        );

        ctx.wizard.next();
        break;
      case "no":
        ctx.deleteMessage();
        await ctx.reply("Bekor qilindi. Demak PINFL raqami noto'g'ri ekan");
        ctx.scene.leave();
        break;
    }
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) {
      ctx.reply("OK", keyboards.mainKeyboard.resize());
      return ctx.scene.leave();
    }
    if (ctx.callbackQuery?.data) {
      try {
        await ctx.deleteMessage();
      } catch (error) {}
    }
    switch (ctx.callbackQuery?.data) {
      case "xa":
        ctx.reply("Abonent shaxsiy raqamini kiriting!");
        ctx.wizard.selectStep(0);
        break;
      case "yoq":
        ctx.reply("OK", keyboards.mainKeyboard.resize());
        ctx.scene.leave();
        break;
    }
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) {
      ctx.reply("OK", keyboards.mainKeyboard.resize());
      return ctx.scene.leave();
    }
    if (ctx.callbackQuery?.data) await ctx.deleteMessage();
    if (ctx.callbackQuery.data === "yes") {
      ctx.wizard.state.reUpdating = true;
      const buttons = [];
      if (ctx.wizard.state.abonent?.pinfl) {
        buttons.push([ctx.wizard.state.abonent?.pinfl.toString()]);
      }
      buttons.push(["🚫Bekor qilish"]);
      ctx.replyWithHTML(
        `<b>${ctx.wizard.state.abonent?.fio}</b>\n Pasport pinfil raqamini kiriting! \nDiqqat! pastda ko'rsatilgan raqam abonentning joriy raqami hisoblanadi`,
        Markup.keyboard(buttons).resize()
      );
      ctx.wizard.selectStep(1);
    } else {
      ctx.reply("OK", keyboards.mainKeyboard.resize());
      ctx.scene.leave();
    }
  }
);

updateAbonentDatesByPinfl.enter((ctx) => {
  ctx.reply(`Abonent shaxsiy raqamini kiriting`, keyboards.cancelBtn);
});

updateAbonentDatesByPinfl.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.mainKeyboard);
    return ctx.scene.leave();
  } else return next();
});
