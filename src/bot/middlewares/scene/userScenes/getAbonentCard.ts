import { WizardScene } from "telegraf/scenes";

import os from "os";
import path from "path";
import { Abonent } from "@models/Abonent.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { keyboards } from "@lib/keyboards.js";
import fs from "fs";
import ejs from "ejs";
import { createTozaMakonApi } from "@api/tozaMakon.js";

import puppeter from "puppeteer";
import isCancel from "../../smallFunctions/isCancel.js";
import { isTextMessage } from "../utils/validator.js";
import { MyContext } from "types/botContext.js";
import { createPdfFromHtml } from "@helpers/createPdfFromHtml.js";
import axios from "axios";
import { readQrFromBase64 } from "@helpers/readQrFromBase64.js";

export const getAbonentCard = new WizardScene(
  "getAbonentCard",
  async (ctx) => {
    try {
      await ctx.reply("Abonent hisob raqamini kiriting", keyboards.cancelBtn);
      return ctx.wizard.next();
    } catch (error) {
      console.error(error);
    }
  },
  async (ctx: MyContext) => {
    try {
      if (!isTextMessage(ctx)) {
        await ctx.reply("Faqat matn yuboring, iltimos.");
        return;
      }
      const text = ctx.message.text;

      const inspector = await Nazoratchi.findOne({ telegram_id: ctx.from?.id });
      if (!inspector) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!",
          keyboards.mainKeyboard
        );
        return ctx.scene.leave();
      }
      const abonents = await Abonent.find({
        licshet: new RegExp(text),
        companyId: inspector.companyId,
      });
      if (abonents.length !== 1)
        return ctx.reply("Abonent topilmadi", keyboards.cancelBtn);
      const abonent = abonents[0];
      const tozaMakonApi = createTozaMakonApi(abonent.companyId);
      const data = (
        await tozaMakonApi(
          `/user-service/residents/${abonent.id}/print-card?lang=UZ`
        )
      ).data;
      const qrData = await readQrFromBase64(data.qrCodeImage);
      const abonentCard = (
        await axios.get(qrData as string, { responseType: "arraybuffer" })
      ).data;

      await ctx.replyWithDocument({
        source: Buffer.from(abonentCard),
        filename: `abonent_card_${abonent.licshet}.pdf`,
      });

      ctx.scene.leave();
    } catch (error) {
      console.error(error);
      ctx.reply("Xatolik kuzatildi");
    }
  }
);

getAbonentCard.on("text", async (ctx, next) => {
  if (isCancel(ctx?.message?.text)) {
    ctx.reply("Amaliyot bekor qilindi", keyboards.mainKeyboard);
    return ctx.scene.leave();
  }
  return next();
});
