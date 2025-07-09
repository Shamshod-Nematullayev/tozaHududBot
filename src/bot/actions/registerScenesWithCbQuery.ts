import { Nazoratchi } from "@models/Nazoratchi";
import { Composer } from "telegraf";
import { MyContext } from "types/botContext";

const composer = new Composer<MyContext>();

// Entering to scene by inline buttons
const actions = [
  "GUVOHNOMA_KIRITISH",
  "multiply_livings",
  "update_abonent_date_by_pinfil",
  "connect_phone_number",
  "changeAbonentStreet",
  "createTarget",
];

actions.forEach((action) => {
  composer.action(action, async (ctx) => {
    try {
      const nazoratchi = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      if (!nazoratchi) {
        return await ctx.reply(
          "Ushbu amaliyotni bajarish uchun yetarli huquqqa ega emassiz"
        );
      }
      ctx.scene.enter(action);
      await ctx.deleteMessage();
    } catch (error) {}
  });
});

export default composer;
