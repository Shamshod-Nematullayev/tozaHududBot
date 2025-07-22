import { Scenes, Markup, Context } from "telegraf";

import isCancel from "../../smallFunctions/isCancel.js";
import isRealPinflValidate from "../../smallFunctions/isPinfl.js";
import { messages } from "@lib/messages.js";

import { keyboards, createInlineKeyboard } from "@lib/keyboards.js";

import { Abonent } from "@models/Abonent.js";

import { INazoratchi, Nazoratchi } from "@models/Nazoratchi.js";

import { Mahalla } from "@models/Mahalla.js";

import { NewAbonent } from "@models/NewAbonents.js";

import { createTozaMakonApi } from "@api/tozaMakon.js";

import { extractBirthDateString } from "../../../../helpers/extractBirthDateFromPinfl.js";
import { EtkAbonent } from "@models/EtkAbonent.js";

import { Notification } from "@models/Notification.js";
import { Admin } from "@models/Admin.js";
import { Company, ICompany } from "@models/Company.js";

import axios from "axios";

import { caotoNames } from "../../../../constants.js";

import { io, usersMapSocket } from "../../../../config/socketConfig.js";
import { WizardWithState } from "@bot/helpers/WizardWithState.js";
import {
  InlineKeyboardButton,
  Message,
} from "telegraf/typings/core/types/typegram";
import { Citizen } from "types/billing";
import {
  getCitizen,
  getResidentHousesByPnfl,
} from "@services/billing/index.js";
import { getStreetsByMahallaId } from "@services/billing/getStreetsByMahallaId.js";
import { getElectricResidentDetails } from "@services/payme.js";
// import { MyContext } from "types/botContext";
// 1. Lokal state tipi
// 1. State tipi
interface BasicState {
  id: number;
  name: string;
}
interface IEtk_Abonent {
  caotoNumber: string;
  accountNumber: string;
  companyId: number;
  customerName: string;
}
interface MySceneState {
  inspector?: INazoratchi;
  company?: ICompany;
  companyId?: number;
  mahallalarButtons?: any;
  citizen?: Citizen;
  kadastr_baza_not_worked?: boolean;
  abonentCadastr?: string;
  mahalla?: BasicState;
  street?: BasicState;
  streets?: BasicState[];
  inhabitantCount?: number;
  etk_abonent?: IEtk_Abonent;
  findedETKAbonents?: IEtk_Abonent[];
  session?: any;
}

type Ctx = WizardWithState<MySceneState>;

const enterFunc = (ctx: Ctx) => {
  ctx.reply("Xonadon egasining PINFL raqamini kiriting!", keyboards.cancelBtn);
};
// 0 - jshshir
// 1 - xonadon kadastr raqami
// 2 - mahalla
// 3 - ko'cha/qishloq
// 4 - yashovchilar soni
// 5 - elektr kodi
// 6 - elektr caoto
// 7 - elektr kod to'g'rimi?
// 8 - jami ma'lumotlar to'g'rimi?
export const new_abonent_request_by_pinfl_scene = new Scenes.WizardScene<Ctx>(
  "new_abonent_request",
  async (ctx) => {
    try {
      if (!ctx.message || !("text" in ctx.message)) {
        await ctx.reply("Iltimos, faqat matnli PINFL raqamni yuboring.");
        return;
      }
      const admin = await Admin.findOne({ user_id: ctx.from?.id });
      const inspektor = await Nazoratchi.findOne({
        telegram_id: ctx.from?.id,
        activ: true,
      });
      const company = await Company.findOne({
        id: inspektor?.companyId || admin?.companyId,
      });
      if (!company) throw "Company not found";
      if (!company.canInspectorsCreateAbonent && !admin) {
        await ctx.reply(
          "Sizning tashkilotingiz nazoratchilar uchun yangi abonent yaratishga ruxsat bermagan"
        );
        ctx.scene.leave();
        return;
      }
      if (!inspektor && !admin) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
        );
        return ctx.scene.leave();
      }
      if (inspektor) ctx.wizard.state.inspector = inspektor;
      ctx.wizard.state.companyId = inspektor?.companyId || admin?.companyId;
      // as Message.TextMessage
      if (!isRealPinflValidate(ctx.message.text)) {
        ctx.replyWithPhoto(
          "https://scontent.fbhk1-4.fna.fbcdn.net/v/t39.30808-6/245114763_1689005674643325_574715679907072430_n.jpg?cstp=mx960x540&ctp=s960x540&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=UuAJ9wX9hRUQ7kNvgFH6cIS&_nc_ht=scontent.fbhk1-4.fna&oh=00_AYBErDlZHdtXHYwOa1n9AicX7rhWP63Hkf8COiCnTKAlUw&oe=669E7F35",
          {
            caption: messages.enterReallyPinfl,
            reply_markup: keyboards.cancelBtn.reply_markup,
          }
        );
        return;
      }

      const existAbonent = await Abonent.findOne({
        pinfl: parseInt(ctx.message.text),
        "shaxsi_tasdiqlandi.confirm": true,
      });
      if (existAbonent) {
        ctx.reply(
          `Ushbu abonentga allaqachon ${existAbonent.licshet} hisob raqami ochilgan`,
          keyboards.mainKeyboard
        );
        ctx.scene.leave();
        return;
      }

      const existRequest = await NewAbonent.findOne({
        "citizen.pnfl": ctx.message.text,
      });
      if (existRequest) {
        ctx.reply(
          "Ushbu fuqaroga kod ochish uchun allaqachon so'rov yuborilgan"
        );
        ctx.scene.leave();
        return;
      }

      const mahallalarButtons = admin
        ? await keyboards.nazoratchigaBiriktirilganMahallalar(
            inspektor?.companyId || admin.companyId
          )
        : await keyboards.nazoratchigaBiriktirilganMahallalar(
            inspektor?.companyId,
            inspektor?.id
          );

      if (!mahallalarButtons) {
        await ctx.reply(
          "Sizga biriktirilgan mahallalar yo'q!",
          keyboards.cancelBtn.resize()
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.mahallalarButtons = mahallalarButtons;

      const birthdate = extractBirthDateString(ctx.message.text);

      const tozaMakonApi = createTozaMakonApi(
        inspektor?.companyId || admin?.companyId
      );
      const citizen = await getCitizen(tozaMakonApi, {
        pinfl: ctx.message.text,
        birthdate,
      });
      console.log(citizen);

      if (!citizen.passport || !citizen.photo) {
        await ctx.reply(
          "Ushbu abonent pasport ma'lumotlari bilan muammo bor. Muddati o'tgan, vafot etgan va hokazo bo'lishi mumkin. Iltimos, xonadonda yashovchi boshqa muhim kishining nomiga ochishga urinib ko'ring",
          keyboards.mainKeyboard
        );
        ctx.scene.leave();
        return;
      }

      ctx.wizard.state.citizen = citizen;

      let houses: string[] = [];
      try {
        houses = await getResidentHousesByPnfl(tozaMakonApi, citizen.pnfl);
      } catch (error) {
        await ctx.reply(
          "Kadastr tizimidan ma'lumotlarni olishda xatolik yuz berdi. Iltimos keyinroq urinib ko'ring"
        );
        ctx.wizard.state.kadastr_baza_not_worked = true;
      }
      await ctx.reply(
        `${citizen.lastName} ${citizen.firstName} ${citizen.patronymic} ${citizen.birthDate}`
      );
      if (!houses) {
        await ctx.reply(
          "Kadastr tizimidan ma'lumotlarni olishda xatolik yuz berdi. Iltimos keyinroq urinib ko'ring"
        );
        ctx.wizard.state.kadastr_baza_not_worked = true;
        ctx.reply(
          "Mahallani tanlang",
          Markup.inlineKeyboard(mahallalarButtons)
        );
        ctx.wizard.selectStep(2);
        return;
      }
      if (houses.length < 1) {
        await ctx.replyWithHTML(
          "Ushbu fuqaroga tegishli xonadon (kadastr) yo'q!\n <b>Diqqat xonadon egasi bo'lmagan shaxsga abonent ochish tavsiya etilmaydi</b>"
        );
        await ctx.reply(
          "Mahallani tanlang",
          Markup.inlineKeyboard(mahallalarButtons)
        );
        ctx.wizard.selectStep(2);
        return;
      }
      if (houses.length == 1) {
        ctx.reply(
          "Mahallani tanlang",
          Markup.inlineKeyboard(mahallalarButtons)
        );
        ctx.wizard.state.abonentCadastr = houses[0];
        ctx.wizard.selectStep(2);
        return;
      }
      const housesButtons = houses.map((cadastr) => [
        Markup.button.callback(cadastr, "cadastr_" + cadastr),
      ]);
      ctx.reply(
        "Xonadonni kadastr raqamini tanlang",
        Markup.inlineKeyboard(housesButtons)
      );
      ctx.wizard.next();
    } catch (error: any) {
      ctx.reply(
        "Kutilmagan xatolik yuz berdi " + error?.response?.data?.message,
        keyboards.cancelBtn.resize()
      );
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;
      const data = ctx.callbackQuery.data.split("_");
      if (data[0] !== "cadastr") {
        throw "400 bad request. Cadastr raqami tanlanmadi";
      }
      ctx.wizard.state.abonentCadastr = data[1];
      await ctx.reply(
        "Mahallani tanlang",
        Markup.inlineKeyboard(ctx.wizard.state.mahallalarButtons)
      );
      await ctx.deleteMessage();
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Kutilmagan xatolik yuz berdi", keyboards.cancelBtn.resize());
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      // mahallani o'zgaruvchiga saqlash
      if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;
      const [key, mahallaId] = ctx.callbackQuery.data.split("_");
      if (key !== "mahalla") {
        throw "status: 400 mahalla tanlanmadi";
      }
      const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.companyId);
      await ctx.deleteMessage();
      const mahalla = await Mahalla.findOne({ id: mahallaId });
      if (!mahalla) {
        throw "status: 400 mahalla topilmadi";
      }
      ctx.wizard.state.mahalla = mahalla;
      // tanlangan mahallaga doir qishloqlarni olish
      let streets = await getStreetsByMahallaId(tozaMakonApi, mahalla.id);
      if (streets.length == 1) {
        ctx.wizard.state.street = streets[0];
        ctx.reply(
          "Yashovchi sonini tanlang yoki kiriting",
          Markup.keyboard([
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
          ])
        );
        ctx.wizard.selectStep(4);
        return;
      }
      streets = streets.sort((a, b) => a.name.localeCompare(b.name));
      ctx.wizard.state.streets = streets;
      const streetButtons = streets.map((item) => [
        Markup.button.callback(item.name, "street_" + item.id),
      ]);
      ctx.reply(
        "Ko'cha yoki qishloqni tanlang",
        Markup.inlineKeyboard(streetButtons)
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Kutilmagan xatolik yuz berdi", keyboards.cancelBtn.resize());
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      //ko'cha yoki qishloqni statega olish
      if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;
      const [key, streetId] = ctx.callbackQuery.data.split("_");
      if (key !== "street") {
        throw "400 bad request";
      }
      await ctx.deleteMessage();
      ctx.wizard.state.street = ctx.wizard.state.streets?.find(
        (s) => s.id === parseInt(streetId)
      );
      // yashovchi soni kiritish keyboardini jo'natish
      ctx.reply(
        "Yashovchi sonini tanlang yoki kiriting",
        Markup.keyboard([
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
        ])
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Kutilmagan xatolik yuz berdi", keyboards.cancelBtn.resize());
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      // yashovchi sonini o'zgaruvchiga saqlash
      if (!ctx.message || !("text" in ctx.message)) return;
      if (!ctx.message)
        return ctx.reply(
          "Yashovchi sonini tanlang yoki kiriting",
          Markup.keyboard([
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
          ])
        );
      if (isNaN(Number(ctx.message.text)))
        return ctx.reply(
          "Yashovchi sonini raqamda kiritish kerak",
          keyboards.cancelBtn.resize()
        );
      if (parseInt(ctx.message.text) > 15)
        return ctx.reply(
          "Yashovchi soni 15 dan yuqori bo'lishi mumkin emas. Iltimos tekshib ko'ring"
        );

      ctx.wizard.state.inhabitantCount = parseInt(ctx.message.text);
      await ctx.reply("Abonent elektr kodini kiriting", keyboards.cancelBtn);
      return ctx.wizard.next();
    } catch (error: any) {
      ctx.reply(
        error.response?.data?.message || "Kutilmagan xatolik yuz berdi"
      );
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (!ctx.message || !("text" in ctx.message)) return;
      if (isNaN(Number(ctx.message.text))) {
        ctx.reply(
          "Error: ETK kod to'g'ri kiritilmadi",
          keyboards.cancelBtn.resize()
        );
        return;
      }
      const existingAbonent = await Abonent.findOne({
        companyId: ctx.wizard.state.companyId,
        "ekt_kod_tasdiqlandi.confirm": true,
        energy_licshet: ctx.message.text,
      });
      if (existingAbonent)
        return ctx.reply(
          `Ushbu elekt kodi allaqachon ${existingAbonent.licshet} hisob raqamli abonentga biriktirilgan`
        );
      const findedETKAbonents = (await EtkAbonent.find({
        accountNumber: ctx.message.text,
        companyId: ctx.wizard.state.companyId,
      }).lean()) as {
        caotoNumber: string;
        accountNumber: string;
        companyId: number;
        customerName: string;
      }[];
      if (!findedETKAbonents[0]) {
        for (let caoto of caotoNames.filter(
          (c) => c.companyId == ctx.wizard.state.companyId
        )) {
          const electrAbonentDetails = await getElectricResidentDetails({
            accountNumber: ctx.message.text,
            region: caoto.region,
            caoto: caoto.caoto,
          });

          if (!electrAbonentDetails) continue;
          findedETKAbonents.push({
            caotoNumber: electrAbonentDetails.subRegion,
            accountNumber: electrAbonentDetails.account,
            companyId: caoto.companyId,
            customerName: electrAbonentDetails.fio,
          });
        }
      }

      if (findedETKAbonents.length === 0) {
        await ctx.reply(
          "Siz kiritgan ETK kod bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.cancelBtn
        );
        return;
      }

      const etk_abonent = findedETKAbonents[0];
      if (findedETKAbonents.length === 1) {
        await ctx.replyWithHTML(
          `Abonent: <code>${etk_abonent.customerName}</code> \nUshbu abonentga shu hisob raqamni rostdan ham kiritaymi?`,
          createInlineKeyboard([
            [
              ["Xa 👌", "yes"],
              ["Yo'q 🙅‍♂️", "no"],
            ],
          ])
        );
        ctx.wizard.state.etk_abonent = etk_abonent;
        ctx.wizard.selectStep(7);
        return;
      }

      const buttons: InlineKeyboardButton[] = [];
      findedETKAbonents.forEach((abonent) => {
        const caoto = caotoNames.find(
          (c) => c.caoto == Number(abonent.caotoNumber)
        );
        if (caoto)
          buttons.push(
            Markup.button.callback(caoto.title, abonent.caotoNumber)
          );
      });
      ctx.reply("Hududni tanlang", Markup.inlineKeyboard(buttons));
      ctx.wizard.state.findedETKAbonents = findedETKAbonents;
      ctx.wizard.next();
    } catch (error: any) {
      ctx.reply("Error: " + error?.message);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      // caotolar ichidan tanlash
      if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;
      const caoto = ctx.callbackQuery.data;
      const etk_abonent = ctx.wizard.state.findedETKAbonents?.find(
        (abonent) => abonent.caotoNumber == caoto
      );
      if (!etk_abonent) {
        ctx.reply("Error: ETK abonent topilmadi", keyboards.cancelBtn.resize());
        return;
      }
      ctx.wizard.state.etk_abonent = etk_abonent;
      await ctx.deleteMessage();
      await ctx.replyWithHTML(
        `Abonent: <code>${etk_abonent.customerName}</code> \nUshbu abonentga shu hisob raqamni rostdan ham kiritaymi?`,
        createInlineKeyboard([
          [
            ["Xa 👌", "yes"],
            ["Yo'q 🙅‍♂️", "no"],
          ],
        ])
      );
      ctx.wizard.next();
    } catch (error: any) {
      ctx.reply("Error: " + error?.message);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;
      if (ctx.callbackQuery.data === "yes") {
        await ctx.replyWithHTML(
          `
          Abonent: <code>${ctx.wizard.state.citizen?.lastName} ${ctx.wizard.state.citizen?.firstName} ${ctx.wizard.state.citizen?.patronymic}</code> \n
          Kadastr: <code>${ctx.wizard.state.abonentCadastr}</code> \n
          Mahalla: <code>${ctx.wizard.state.mahalla?.name}</code> \n
          Ko'cha: <code>${ctx.wizard.state.street?.name}</code> \n
          Yashovchilar soni: <code>${ctx.wizard.state.inhabitantCount}</code> \n
          ETK hisob raqami: <code>${ctx.wizard.state.etk_abonent?.accountNumber}</code> \n
          ETK abonent: <code>${ctx.wizard.state.etk_abonent?.customerName}</code> \n
          Barcha ma'lumotlar to'g'rimi?
          `,
          keyboards.yesOrNo
        );
        ctx.wizard.next();
      } else if (ctx.callbackQuery.data === "no") {
        await ctx.reply(
          "Yana bir bor tekshirib ko'rib, elektr kodini kiriting",
          keyboards.cancelBtn.resize()
        );
        ctx.wizard.selectStep(5);
      }
      await ctx.deleteMessage();
    } catch (error: any) {
      ctx.reply("Error: " + error.message);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;
      if (ctx.callbackQuery.data === "yes") {
        const etk_abonent = ctx.wizard.state.etk_abonent;
        await NewAbonent.create({
          abonent_name: `${ctx.wizard.state.citizen?.lastName} ${ctx.wizard.state.citizen?.firstName} ${ctx.wizard.state.citizen?.patronymic}`,
          nazoratchi_id: ctx.wizard.state.inspector?.id,
          senderId: ctx.from?.id,
          mahallaId: ctx.wizard.state.mahalla?.id,
          mahallaName: ctx.wizard.state.mahalla?.name,
          streetId: ctx.wizard.state.street?.id,
          streetName: ctx.wizard.state.street?.name,
          citizen: ctx.wizard.state.citizen,
          cadastr: ctx.wizard.state.abonentCadastr,
          inhabitant_cnt: Number(ctx.wizard.state.inhabitantCount),
          etkCustomerCode: etk_abonent?.accountNumber,
          etkCaoto: etk_abonent?.caotoNumber,
          companyId: ctx.wizard.state.companyId,
          kadastr_baza_not_worked: ctx.wizard.state.kadastr_baza_not_worked,
        });
        await ctx.reply(
          `Yangi abonent yaratish uchun ariza yuborildi. Abonent: ${ctx.wizard.state.citizen?.lastName} ${ctx.wizard.state.citizen?.firstName} ${ctx.wizard.state.citizen?.patronymic}`,
          keyboards.mainKeyboard
        );
        const users = await Admin.find({
          companyId: ctx.wizard.state.companyId,
          roles: "billing",
        });
        users.forEach(async (user) => {
          await Notification.create({
            message: "Yangi abonent ochish bo'yicha ariza qabul qilindi",
            type: "info",
            sender: {
              id: "system",
            },
            receiver: {
              id: user._id,
            },
          });
          if (usersMapSocket[user.id]) {
            io.to(usersMapSocket[user.id]).emit("notification", {
              message: "Yangi abonent ochish bo'yicha ariza qabul qilindi",
              type: "info",
              sender: {
                id: "system",
              },
              receiver: {
                id: user._id,
              },
            });
          }
        });

        ctx.scene.leave();
        await ctx.deleteMessage();
      } else if (ctx.callbackQuery.data === "no") {
        await ctx.reply(
          "Amaliyot bekor qilindi",
          keyboards.mainKeyboard.resize()
        );
        ctx.scene.leave();
        await ctx.deleteMessage();
      }
    } catch (error: any) {
      ctx.reply("Error: " + error.message);
      console.error(error);
    }
  }
);

new_abonent_request_by_pinfl_scene.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Amaliyot bekor qilindi", keyboards.mainKeyboard);
    return ctx.scene.leave();
  }
  next();
});
new_abonent_request_by_pinfl_scene.leave((ctx) =>
  ctx.reply("Yakunlandi", keyboards.mainKeyboard.resize())
);
new_abonent_request_by_pinfl_scene.enter(enterFunc);
