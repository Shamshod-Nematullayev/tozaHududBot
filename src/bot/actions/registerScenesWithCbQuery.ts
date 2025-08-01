import { isAdmin } from "@bot/middlewares/scene/utils/validator.js";
import { messages } from "@lib/messages.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { Composer } from "telegraf";
import { MyContext } from "types/botContext";

const composer = new Composer<MyContext>();

// Entering to scene by inline buttons
const USER_ACTIONS = [
  "GUVOHNOMA_KIRITISH",
  "multiply_livings",
  "update_abonent_date_by_pinfil",
  "connect_phone_number",
  "changeAbonentStreet",
  "createTarget",
];

const ADMIN_ACTIONS = [
  "import_abonents_data",
  "generate_sud_buyruq",
  "connect_mfy_tg_group",
  "generateSavdoSanoatAriza",
  "import_plan_for_inspectors",
  "confirm_game_over",
  "generate_alert_letter",
  "add_notification",
  "shaxsi_tashdiqlandi_bildirish_xati",
  "user_to_inspektor",
  "get_sud_material",
  "ommaviy_shartnoma_biriktirish",
  "generateProkuraturaSudAriza",
  "sudBuyruqlariYaratish",
  "Ogohlantish xati yuborish",
  "upload_execution_to_billing",
];

USER_ACTIONS.forEach((action) => {
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
    } catch (error) {
      console.error(error);
    }
  });
});

ADMIN_ACTIONS.forEach((action) => {
  composer.action(action, async (ctx) => {
    if (!(await isAdmin(ctx.from.id)))
      return ctx.reply(messages.youAreNotAdmin);

    await ctx.deleteMessage();
    ctx.scene.enter(action);
  });
});

export default composer;
