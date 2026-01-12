import { Scenes, Markup } from "telegraf";

import { keyboards, createInlineKeyboard } from "@lib/keyboards.js";

import { Abonent, IAbonent, IAbonentDoc } from "@models/Abonent.js";

import { Nazoratchi } from "@models/Nazoratchi.js";

import isCancel from "../../smallFunctions/isCancel.js";
import { EtkKodRequest } from "@models/EtkKodRequest.js";

import { createTozaMakonApi } from "@api/tozaMakon.js";

import { EtkAbonent } from "@models/EtkAbonent.js";

import { caotoNames } from "../../../../constants.js";
import { getElectricResidentDetails } from "@services/payme.js";
import { WizardWithState } from "@bot/helpers/WizardWithState.js";
import { isCallbackQueryMessage, isTextMessage } from "../utils/validator.js";
import { ErrorTypes } from "@bot/utils/errorHandler.js";
import { Admin } from "@models/Admin.js";
import { getDataFromHET } from "@services/billing/getDataFromHET.js";
import { searchAbonent } from "@services/billing/searchAbonent.js";
import { Company } from "@models/Company.js";

interface MyWizardState {
  accountNumber?: string;
  region?: number;
  caoto?: number;
  inspector_id?: number;
  inspector_name?: string;
  companyId?: number;
  abonent?: IAbonentDoc;
  findedETKAbonents?: any[];
  ETK?: string;
  PHONE?: string;
  ADDRESS?: string;
  FIO?: string;
  etk_abonent?: any;
}
type Ctx = WizardWithState<MyWizardState>;

interface IFindedAbonent {
  caotoNumber: string;
  accountNumber: string;
  customerName: string;
  companyId: number;
}

export const updateElektrKod = new Scenes.WizardScene<Ctx>(
  "updateElektrKod",
  async (ctx) => {
    await ctx.reply("Abonent chiqindi kodini kiriting:");
    return ctx.wizard.next();
  },
  async (ctx) => {
    // bad request errors
    if (!isTextMessage(ctx)) throw ErrorTypes.BAD_REQUEST;

    const inspektor = await Nazoratchi.findOne({
      telegram_id: ctx.from?.id,
      activ: true,
    });
    if (!inspektor) {
      ctx.scene.leave();
      throw ErrorTypes.NO_ACCESS;
    }
    ctx.wizard.state.inspector_id = inspektor.id;
    ctx.wizard.state.inspector_name = inspektor?.name;
    ctx.wizard.state.companyId = inspektor.companyId;

    ctx.wizard.state.accountNumber = ctx.message.text;
    let abonents = await Abonent.find({
      licshet: new RegExp(ctx.wizard.state.accountNumber),
      companyId: ctx.wizard.state.companyId,
    }).lean();
    if (abonents.length !== 1) throw ErrorTypes.NOT_FOUND;

    const abonent = abonents[0];
    ctx.wizard.state.abonent = abonent as IAbonentDoc;
    if (!abonent) {
      ctx.reply(
        "Siz kiritgan chiqindi kod bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
        keyboards.cancelBtn.resize()
      );
      return;
    }

    if (abonent.ekt_kod_tasdiqlandi?.confirm) {
      await ctx.reply(
        `Bu abonent ma'lumoti ${
          abonent.ekt_kod_tasdiqlandi.inspector_name ||
          abonent.ekt_kod_tasdiqlandi.inspector?.name
        } tomonidan kiritilib bo'lingan. Baribir kiritmoqchimisiz?`,
        keyboards.yesOrNo
      );
      ctx.wizard.selectStep(5);
      return;
    }
    // Shu yerda caotolar ro'yxati chiqishi kerak;
    const caotoNamesCompany = caotoNames.filter(
      (c) => c.companyId == ctx.wizard.state.companyId
    );

    if (caotoNamesCompany.length === 0) {
      return ctx.reply("Bu tashkilot uchun caoto raqamlari berilmagan");
    }
    if (caotoNamesCompany.length === 1) {
      ctx.wizard.state.region = caotoNamesCompany[0].region;
      ctx.wizard.state.caoto = caotoNamesCompany[0].caoto;
      return await ctx.reply(
        `FIO: ${abonent.fio}\nElektr kodini kiriting:`,
        keyboards.cancelBtn.resize()
      );
    }

    await ctx.reply(
      "FIO: ${abonent.fio}\nHududni tanlang",
      Markup.inlineKeyboard([
        ...caotoNamesCompany.map((c) => [
          Markup.button.callback(`${c.title} ${c.caoto}`, c.caoto.toString()),
        ]),
      ])
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
    ctx.deleteMessage();
    ctx.wizard.state.caoto = Number(ctx.callbackQuery.data);
    ctx.wizard.next();
    return await ctx.reply(
      `Abonent elektr kodini kiriting`,
      keyboards.cancelBtn.resize()
    );
  },
  async (ctx) => {
    if (!isTextMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
    if (ctx.message.text.length < 7) throw ErrorTypes.BAD_REQUEST;

    const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.companyId!);
    const existingAbonents = await searchAbonent(tozaMakonApi, {
      companyId: ctx.wizard.state.companyId!,
      electricityAccountNumber: ctx.message.text,
    });

    // warning!
    if (existingAbonents.totalElements > 0)
      await ctx.replyWithHTML(
        `‼️<b>DIQQAT</b>‼️ \n\n Bu hisob raqami allaqachon boshqa abonent${
          existingAbonents.content.length > 1 && "lar"
        } biriktirilgan\n${existingAbonents.content
          .map((a) => a.accountNumber)
          .join(", ")}`
      );

    try {
      const hetData = await getDataFromHET(tozaMakonApi, {
        coato: ctx.wizard.state.caoto?.toString()!,
        personalAccount: ctx.message.text,
      });

      console.log("hetData", hetData);
      if ("code" in hetData) return ctx.reply("Xatolik: " + hetData.message);

      await ctx.replyWithHTML(
        `<code>${hetData.fullName}</code> \nManzil: ${hetData.address}\nTelefon: ${hetData.phone}\nUshbu abonentga shu hisob raqamni rostdan ham kiritaymi?`,
        createInlineKeyboard([
          [
            ["Xa 👌", "yes"],
            ["Yo'q 🙅‍♂️", "no"],
          ],
        ])
      );
      ctx.wizard.state.PHONE = hetData.phone;
      ctx.wizard.state.ETK = ctx.message.text;
      ctx.wizard.state.ADDRESS = hetData.address;
      ctx.wizard.state.FIO = hetData.fullName;
      ctx.wizard.next();
    } catch (error) {}
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) {
      ctx.reply("OK");
      return ctx.scene.leave();
    }
    switch (ctx.callbackQuery?.data) {
      case "yes":
        const abonent = ctx.wizard.state.abonent as IAbonentDoc;
        const state = ctx.wizard.state;
        const req = await EtkKodRequest.create({
          licshet: abonent.licshet,
          abonent_id: abonent.id,
          etk_kod: state.ETK!,
          etk_saoto: state.caoto!,
          inspector_id: state.inspector_id,
          update_at: new Date(),
          companyId: state.companyId,
          phone: state.PHONE,
          address: state.ADDRESS,
          fio: state.FIO,
          billingdaFIO: abonent.fio,
        });
        await ctx.deleteMessage();
        await ctx.replyWithHTML(
          `ETK kod yangilash to'g'risidagi so'rovingiz operatorga yuborildi`,
          keyboards.mainKeyboard.resize()
        );
        const company = await Company.findOne({
          id: ctx.wizard.state.companyId,
        });
        ctx.scene.leave();
        if (!company) return;
        const message = await ctx.telegram.sendMessage(
          company.CHANNEL_ID_SHAXSI_TASDIQLANDI,
          `${ctx.wizard.state.inspector_name} tomonidan\nKOD: ${abonent.licshet}\nFIO: ${abonent.fio} ETK: ${state.ETK} ${state.FIO} \n ${state.ADDRESS}`,
          {
            reply_markup: Markup.inlineKeyboard([
              [
                Markup.button.callback("🚫", "etk_no_" + req._id),
                Markup.button.callback("✅", "etk_yes_" + req._id),
              ],
            ]).reply_markup,
          }
        );

        await req.updateOne({ $set: { channelPostId: message.message_id } });
      case "no":
        await ctx.deleteMessage();
        ctx.reply("Bekor qilindi.", keyboards.mainKeyboard.resize());
        ctx.scene.leave();
        break;
    }
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
    if (ctx.callbackQuery.data === "yes") {
      await ctx.deleteMessage();
      // Shu yerda caotolar ro'yxati chiqishi kerak;
      const caotoNamesCompany = caotoNames.filter(
        (c) => c.companyId == ctx.wizard.state.companyId
      );

      if (caotoNamesCompany.length === 0) {
        return ctx.reply("Bu tashkilot uchun caoto raqamlari berilmagan");
      }
      if (caotoNamesCompany.length === 1) {
        ctx.wizard.state.region = caotoNamesCompany[0].region;
        ctx.wizard.state.caoto = caotoNamesCompany[0].caoto;
        return await ctx.reply(
          `FIO: ${ctx.wizard.state.abonent?.fio}\nElektr kodini kiriting:`,
          keyboards.cancelBtn.resize()
        );
      }

      await ctx.reply(
        `FIO: ${ctx.wizard.state.abonent?.fio}\nHududni tanlang`,
        Markup.inlineKeyboard([
          ...caotoNamesCompany.map((c) => [
            Markup.button.callback(`${c.title} ${c.caoto}`, c.caoto.toString()),
          ]),
        ])
      );
      ctx.wizard.selectStep(2);
      return;
    } else if (ctx.callbackQuery.data === "no") {
      await ctx.deleteMessage();
    }
    await ctx.reply("Asosiy menyu", keyboards.mainKeyboard);
    ctx.scene.leave();
  }
);

updateElektrKod.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.mainKeyboard.resize());
    return ctx.scene.leave();
  }
  return next();
});
