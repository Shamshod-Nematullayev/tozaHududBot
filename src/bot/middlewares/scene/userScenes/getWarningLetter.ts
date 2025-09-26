import { Scenes } from "telegraf";

import { keyboards } from "@lib/keyboards.js";

import { createTozaMakonApi } from "@api/tozaMakon.js";

import isCancel from "../../smallFunctions/isCancel.js";
import { isValidAccountNumber } from "../utils/validator.js";
import { getAbonentAndInspector } from "../utils/getAbonentAndInspector.js";
import { getAbonentById } from "@services/billing/index.js";
import { MyContext } from "types/botContext.js";
import { createCourtWarningBatch } from "@services/court/createCourtWarningBatch.js";

export const getWarningLetter = new Scenes.WizardScene<MyContext>(
  "getWarningLetter",
  (ctx) => {
    ctx.reply("Abonent hisob raqamini kiriting", keyboards.cancelBtn);
    ctx.wizard.next();
  },
  async (ctx) => {
    // 1. validation
    if (
      !ctx.message ||
      !("text" in ctx.message) ||
      !isValidAccountNumber(ctx.message.text) ||
      !ctx.from
    )
      return ctx.reply(
        "Abonent hisob raqamini to'g'ri kiriting",
        keyboards.cancelBtn
      );

    // 2. get abonent and check access
    const { abonent } = await getAbonentAndInspector(
      ctx.from.id,
      ctx.message.text
    );

    // 3. generate warning letter
    const tozaMakonApi = createTozaMakonApi(abonent.companyId);
    const abonentKSaldo = (await getAbonentById(tozaMakonApi, abonent.id))
      .balance.kSaldo;
    if (abonentKSaldo < 100000) {
      ctx.scene.leave();
      return ctx.reply(
        "Abonentning qarzdorligi 100.000 so'mdan kichik bo'lganligi uchun bekor qilindi",
        keyboards.mainKeyboard.resize()
      );
    }
    const batch = await createCourtWarningBatch(tozaMakonApi, {
      lang: "UZ-CYRL",
      oneWarningInOnePage: false,
      residentId: abonent.id,
      warningBasis: `${abonentKSaldo.toLocaleString()} so'm qarzdor`,
      warningDate: new Date(),
    });
    // 4. send response
    await ctx.replyWithDocument({
      source: batch,
      filename: ctx.message.text + ".pdf",
    });

    // ctx.scene.leave();
  }
);

getWarningLetter.on("text", async (ctx, next) => {
  if (isCancel(ctx?.message?.text)) {
    ctx.reply("Amaliyot bekor qilindi", keyboards.mainKeyboard);
    return ctx.scene.leave();
  }
  return next();
});
