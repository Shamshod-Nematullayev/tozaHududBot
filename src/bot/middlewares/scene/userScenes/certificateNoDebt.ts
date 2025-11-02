import { createTozaMakonApi } from "@api/tozaMakon.js";
import isCancel from "@bot/middlewares/smallFunctions/isCancel.js";
import { keyboards } from "@lib/keyboards.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { searchAbonent } from "@services/billing/searchAbonent.js";
import { Scenes } from "telegraf";
import { isTextMessage } from "../utils/validator.js";
import { getCertificateNoDebt } from "@services/billing/getCertificateNoDebt.js";
import { scenaNames } from "types/scenes.js";
import axios from "axios";

export const certificateNoDebtScene = new Scenes.WizardScene(
  scenaNames.certificateNoDebtScene,
  async (ctx) => {
    await ctx.reply(
      "Ma'lumotnoma olmoqchi bo'lgan abonentning hisob raqamini kiriting:",
      keyboards.cancelBtn
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    if (!isTextMessage(ctx))
      return await ctx.reply(
        "Iltimos, hisob raqamini matn shaklida kiriting:",
        keyboards.cancelBtn
      );
    if (isCancel(ctx.message.text)) {
      ctx.scene.leave();
      return await ctx.reply("Bekor qilindi", keyboards.mainKeyboard);
    }
    const accountNumber = ctx.message.text.trim();

    //  kirituvchi xodimni tekshirish
    const nazoratchi = await Nazoratchi.findOne({ telegram_id: ctx.from?.id });
    if (!nazoratchi) {
      ctx.scene.leave();
      return await ctx.reply(
        "Siz bunday huquqga ega emassiz",
        keyboards.mainKeyboard
      );
    }
    // hisob raqamining to'g'riligini tekshirish
    if (!/^\d{6,12}$/.test(accountNumber)) {
      return await ctx.reply(
        "Hisob raqami 6-12 raqamdan iborat bo'lishi kerak",
        keyboards.cancelBtn
      );
    }

    // hisob raqami to'g'ri bo'lsa, keyingi amallarni bajarish

    const tozaMakonApi = createTozaMakonApi(nazoratchi.companyId);
    const abonent = await searchAbonent(tozaMakonApi, {
      accountNumber,
      companyId: nazoratchi.companyId,
    });

    if (abonent.content.length !== 1) {
      return await ctx.reply(
        "Bunday hisob raqamli abonent topilmadi",
        keyboards.cancelBtn
      );
    }

    const resident = abonent.content[0];

    const details = await getCertificateNoDebt(tozaMakonApi, resident.id);

    if ("message" in details) {
      return await ctx.reply(details.message, keyboards.cancelBtn);
    }

    const pdf = (
      await axios.get(
        "https://api.tozamakon.eco/download/" + details.publicUrl,
        { responseType: "arraybuffer" }
      )
    ).data;

    await ctx.replyWithDocument({
      source: Buffer.from(pdf),
      filename: `ma'lumotnoma_${accountNumber}.pdf`,
    });
  }
);
