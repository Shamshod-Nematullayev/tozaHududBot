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
    ctx.wizard.state.inspector_name = inspektor.name;
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
      // const admin = await Admin.findOne({ user_id: ctx.from?.id });
      // if (!admin) {
      //   ctx.scene.leave();
      //   return await ctx.reply(
      //     `Bu abonent ma'lumoti ${
      //       abonent.ekt_kod_tasdiqlandi.inspector_name ||
      //       abonent.ekt_kod_tasdiqlandi.inspector.name
      //     } tomonidan kiritilib bo'lingan.`
      //   );
      // }
      await ctx.reply(
        `Bu abonent ma'lumoti ${
          abonent.ekt_kod_tasdiqlandi.inspector_name ||
          abonent.ekt_kod_tasdiqlandi.inspector.name
        } tomonidan kiritilib bo'lingan. Baribir kiritmoqchimisiz?`,
        keyboards.yesOrNo
      );
      ctx.wizard.selectStep(5);
      return;
    }
    await ctx.reply(
      `FIO: ${abonent.fio}\nElektr kodini kiriting:`,
      keyboards.cancelBtn.resize()
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    if (!isTextMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
    const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.companyId!);

    // const hetData = await
    const findedETKAbonents: IFindedAbonent[] = await EtkAbonent.find({
      accountNumber: ctx.message.text,
      companyId: ctx.wizard.state.companyId,
    }).lean();
    if (!findedETKAbonents[0]) {
      for (let caoto of caotoNames.filter(
        (c) => c.companyId == ctx.wizard.state.companyId
      )) {
        const etkResultFromPayme = await getElectricResidentDetails({
          accountNumber: ctx.message.text,
          region: caoto.region,
          caoto: caoto.caoto,
        });

        if (!etkResultFromPayme) continue;

        findedETKAbonents.push({
          caotoNumber: String(caoto.caoto),
          accountNumber: ctx.message.text,
          customerName: etkResultFromPayme.fio,
          companyId: ctx.wizard.state.companyId as number,
        });
      }
    }
    if (!findedETKAbonents[0]) {
      ctx.reply(
        "Siz kiritgan ETK kod bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
        keyboards.cancelBtn.resize()
      );
      return;
    }
    if (findedETKAbonents.length > 1) {
      const buttons: any[] = [];
      findedETKAbonents.forEach((abonent) => {
        const caoto = caotoNames.find(
          (c) => c.caoto === Number(abonent.caotoNumber)
        );
        buttons.push(
          Markup.button.callback(caoto?.title as string, abonent.caotoNumber)
        );
      });
      ctx.reply("Hududni tanlang", Markup.inlineKeyboard(buttons));
      ctx.wizard.state.findedETKAbonents = findedETKAbonents;
      ctx.wizard.state.ETK = ctx.message.text;
      ctx.wizard.selectStep(3);
      return;
    }
    const etk_abonent = findedETKAbonents[0];
    if (!etk_abonent) {
      ctx.reply("Bunday elektr kodi topilmadi");
      return;
    }
    await ctx.replyWithHTML(
      `Abonent: <code>${etk_abonent.customerName}</code> \nUshbu abonentga shu hisob raqamni rostdan ham kiritaymi?`,
      createInlineKeyboard([
        [
          ["Xa 👌", "yes"],
          ["Yo'q 🙅‍♂️", "no"],
        ],
      ])
    );
    ctx.wizard.state.ETK = ctx.message.text;
    ctx.wizard.state.etk_abonent = etk_abonent;
    ctx.wizard.next();
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) {
      ctx.reply("OK");
      return ctx.scene.leave();
    }
    switch (ctx.callbackQuery?.data) {
      case "yes":
        const abonent = ctx.wizard.state.abonent as IAbonentDoc;
        const etkAbonent = ctx.wizard.state.etk_abonent;
        await EtkKodRequest.create({
          licshet: abonent.licshet,
          abonent_id: abonent.id,
          etk_kod: ctx.wizard.state.ETK,
          etk_saoto: etkAbonent.caotoNumber,
          inspector_id: ctx.wizard.state.inspector_id,
          update_at: new Date(),
        });
        await ctx.deleteMessage();
        await ctx.replyWithHTML(
          `ETK kod yangilash to'g'risidagi so'rovingiz operatorga yuborildi`,
          keyboards.mainKeyboard.resize()
        );
        return ctx.scene.leave();
      case "no":
        await ctx.deleteMessage();
        ctx.reply("Bekor qilindi.", keyboards.mainKeyboard.resize());
        ctx.scene.leave();
        break;
    }
  },
  (ctx) => {
    if (!isCallbackQueryMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
    const findedETKAbonents = ctx.wizard.state
      .findedETKAbonents as IFindedAbonent[];
    const etk_abonent = findedETKAbonents.find(
      (a) => a.caotoNumber == ctx.callbackQuery.data
    );
    if (!etk_abonent) {
      ctx.reply("Xatolik");
      return ctx.scene.leave();
    }
    ctx.replyWithHTML(
      `Abonent: <code>${etk_abonent.customerName}</code> \nUshbu abonentga shu hisob raqamni rostdan ham kiritaymi?`,
      createInlineKeyboard([
        [
          ["Xa 👌", "yes"],
          ["Yo'q 🙅‍♂️", "no"],
        ],
      ])
    );
    ctx.wizard.state.etk_abonent = etk_abonent;
    ctx.wizard.selectStep(2);
  },
  async (ctx) => {
    if (!isCallbackQueryMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
    if (ctx.callbackQuery.data === "yes") {
      await ctx.deleteMessage();
      await ctx.reply(
        `FIO: ${ctx.wizard.state.abonent?.fio}\nElektr kodini bazaga kiriting:`
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
