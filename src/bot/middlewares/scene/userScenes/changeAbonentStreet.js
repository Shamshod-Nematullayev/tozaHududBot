import { Scenes, Markup } from "telegraf";

import { keyboards } from "@lib/keyboards";

import isCancel from "../../smallFunctions/isCancel";
import { Nazoratchi } from "@models/Nazoratchi";

import { Abonent } from "@models/Abonent";

import { Company } from "@models/Company";

import { createTozaMakonApi } from "@api/tozaMakon";

export const changeAbonentStreet = new Scenes.WizardScene(
  "changeAbonentStreet",
  (ctx) => {
    ctx.reply("Abonent shaxsiy hisob raqamini kiriting", keyboards.cancelBtn);
    return ctx.wizard.next();
  },
  async (ctx) => {
    try {
      if (!ctx.message)
        return ctx.reply(
          "Kutilgan amal bajarilmadi",
          keyboards.cancelBtn.resize()
        );

      if (isNaN(ctx.message.text) || ctx.message.text.length !== 12) {
        return ctx.reply(
          "Litsavoy kod to'g'ri kiritilmadi",
          keyboards.cancelBtn.resize()
        );
      }
      const inspektor = await Nazoratchi.findOne({
        telegram_id: ctx.from.id,
        activ: true,
      });
      if (!inspektor) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.inspector_id = inspektor.id;
      ctx.wizard.state.inspector_name = inspektor.name;
      const abonent = await Abonent.findOne({
        licshet: ctx.message.text,
        companyId: inspektor.companyId,
      });
      ctx.wizard.state.abonent = abonent;
      if (!abonent) {
        ctx.reply(
          "Siz kiritgan litsavoy kod bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.cancelBtn.resize()
        );
        return;
      }
      if (abonent.street_tasdiqlandi?.confirm) {
        return ctx.reply(
          "Bu abonent ma'lumoti kiritilib bo'lingan",
          keyboards.cancelBtn.resize()
        );
      }

      const company = await Company.findOne({ id: inspektor.companyId });
      const now = new Date();
      if (!company.active || company.activeExpiresDate < now) {
        await ctx.reply(
          "Dastur faoliyati vaqtincha cheklangan. \nIltimos, xizmatlardan foydalanishni davom ettirish uchun to‘lovni amalga oshiring."
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.companyId = inspektor.companyId;
      const tozaMakonApi = createTozaMakonApi(inspektor.companyId);
      let streets = (
        await tozaMakonApi.get("/user-service/mahallas/streets", {
          params: {
            size: 100,
            mahallaId: abonent.mahallas_id,
            districtId: company.districtId,
          },
        })
      ).data;

      let keyboardsArray = [];
      ctx.wizard.state.streets = streets;
      for (let street of streets) {
        keyboardsArray.push([Markup.button.callback(street.name, street.id)]);
      }
      await ctx.reply(
        "Ko'cha yoki qishloqni tanlang",
        Markup.inlineKeyboard(keyboardsArray).oneTime()
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Xatolik kuzatildi", keyboards.cancelBtn.resize());
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (!ctx.callbackQuery) throw new Error("Ko'cha tanlanishi kutilgan edi");
      const street = ctx.wizard.state.streets.find(
        (street) => street.id == ctx.callbackQuery.data
      );
      if (!street) {
        ctx.reply(
          "Xatolik kuzatildi " + new Error("Ko'cha topilmadi"),
          keyboards.cancelBtn.resize()
        );
        return ctx.scene.leave();
      }
      const abonent = ctx.wizard.state.abonent;
      const tozaMakonApi = createTozaMakonApi(abonent.companyId);
      const prevData = (
        await tozaMakonApi.get(
          "/user-service/residents/" + abonent.id + "?include=translates"
        )
      ).data;
      await tozaMakonApi.put("/user-service/residents/" + abonent.id, {
        ...prevData,
        description: `${ctx.wizard.state.inspector_name} ma'lumotiga asosan ko'cha/qishloq ma'lumoti o'zgartirildi.`,
        streetId: street.id,
      });

      await Abonent.findByIdAndUpdate(abonent._id, {
        $set: {
          street_tasdiqlandi: {
            confirm: true,
            inspector_id: ctx.wizard.state.inspector_id,
            inspector_name: ctx.wizard.state.inspector_name,
          },
          streets_id: Number(street.id),
          streets_name: street.name,
        },
      });
      await ctx.deleteMessage();
      ctx.reply(
        "Ko'cha/qishloq muvaffaqqiyatli kiritildi",
        keyboards.mainKeyboard.resize()
      );
      ctx.scene.leave();
    } catch (error) {
      ctx.reply(
        "Xatolik kuzatildi " + error.response?.data?.message ||
          error.message ||
          error,
        keyboards.cancelBtn.resize()
      );
      console.error(error);
    }
  }
);

changeAbonentStreet.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.mainKeyboard);
    return ctx.scene.leave();
  }
  next();
});
