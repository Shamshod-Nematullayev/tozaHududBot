import { EtkKodRequest } from "@models/EtkKodRequest.js";
import { Composer } from "telegraf";
import { MyContext } from "types/botContext.js";

const composer = new Composer<MyContext>();

composer.action(/etk_yes/, (ctx) => {
  if (!("data" in ctx.callbackQuery)) return;
});

composer.action(/etk_no/, async (ctx) => {
  if (!("data" in ctx.callbackQuery)) return;

  const requestId = ctx.callbackQuery.data.split("_")[2];

  const request = await EtkKodRequest.findById(requestId);

  if (!request)
    return ctx.answerCbQuery("Xatolik: ETK tasdiqlash so'rovi topilmadi");

  await request.updateOne({
    $set: {
      status: "bekor_qilindi",
    },
  });
});

export default composer;
