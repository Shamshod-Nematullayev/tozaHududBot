const { WizardScene } = require("telegraf/scenes");
const isCancel = require("../../smallFunctions/isCancel");
const { Abonent } = require("../../../models/Abonent");
const { keyboards, createInlineKeyboard } = require("../../../lib/keyboards");
const { Nazoratchi } = require("../../../models/Nazoratchi");
const { Mahalla } = require("../../../models/Mahalla");
const { Target } = require("../../../models/TargetAbonent");

const createTargetScene = new WizardScene(
  "createTarget",
  (ctx) => {
    ctx.reply("To'lov qilishdan bosh tortgan abonent hisob raqamini kiriting!");
    return ctx.wizard.next();
  },
  async (ctx) => {
    try {
      const text = ctx.message.text;
      if (isNaN(text) || text.length < 6)
        return ctx.reply("Faqat raqam kiriting");
      const abonents = await Abonent.find({ licshet: new RegExp(text) }).limit(
        2
      );
      if (abonents.length > 1) {
        return ctx.reply(
          "Siz kiritgan qiymatga mos bir nechta abonent topildi. Iltimos hisob raqamni aniqroq kiriting"
        );
      }
      const abonent = abonents[0];
      const exists = await Target.findOne({ accountNumber: abonent.licshet });
      if (exists)
        return ctx.reply(
          "Ushbu abonent allaqachon majburiy undiriluvchilar ro'yxatiga qo'shilgan"
        );
      const inspector = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      const mahalla = await Mahalla.findOne({
        "biriktirilganNazoratchi.inspactor_id": inspector.id,
        id: abonent.mahallas_id,
      });
      if (!mahalla) {
        return ctx.reply(`Siz ushbu mahalla aholi nazoratchisi emassiz!`);
      }
      if (!abonent.shaxsi_tasdiqlandi || !abonent.shaxsi_tasdiqlandi.confirm) {
        ctx.scene.leave();
        return ctx.reply(
          "Ushbu abonent shaxsiga aniqlik kiritilmaganligi sababli uni majburiy undiruvga qaratish mumkin emas. Avval shaxsini tasdiqlang!",
          keyboards.mainKeyboard
        );
      }
      ctx.reply(
        `${abonent.fio}\n Majburiy undiruvga qaratmoqchimisiz?`,
        keyboards.yesOrNo
      );
      ctx.wizard.state.abonent = {
        licshet: abonent.licshet,
        id: abonent.id,
        mahalla_id: abonent.mahallas_id,
      };
      ctx.wizard.inspector = {
        id: inspector.id,
        name: inspector.name,
      };
      ctx.wizard.state.request = "tasdiqlash";
      ctx.wizard.next();
    } catch (err) {
      ctx.reply("xatolik createTarget.js");
      console.error(err);
    }
  },
  async (ctx) => {
    try {
      const abonent = ctx.wizard.state.abonent;
      const inspector = ctx.wizard.state.inspector;
      if (ctx.wizard.state.request === "tasdiqlash") {
        switch (ctx.update.callback_query.data) {
          case "no":
            ctx.reply("Bekor qilindi", keyboards.mainKeyboard);
            ctx.scene.leave();
            break;
          case "yes":
            await Target.create({
              abonent_id: abonent.id,
              accountNumber: abonent.licshet,
              mahalla_id: abonent.mahalla_id,
              inspector_id: inspector.id,
              inspector_name: inspector.name,
            });
            ctx.wizard.state.request = "yana kiritasizmi";
            ctx.reply(
              "Abonent ro'yxatga muvaffaqqiyatli qo'shildi. Yana kiritasizmi?",
              keyboards.yesOrNo
            );
        }
      }
      if (ctx.wizard.state.request === "yana kiritasizmi") {
        switch (ctx.update.callback_query.data) {
          case "no":
            ctx.reply("Asosiy menyu", keyboards.mainKeyboard);
            ctx.scene.leave();
            break;
          case "yes":
            ctx.wizard.selectStep(0);
        }
      }
    } catch (error) {
      ctx.reply("xatolik createTarget.js");
      console.error(err);
    }
  }
);

createTargetScene.on("message", (ctx, next) => {
  try {
    if (isCancel(ctx.message.text)) {
      ctx.reply("Bekor qilindi");
      return ctx.scene.leave();
    }
    next();
  } catch (error) {
    ctx.reply("Xatolik");
    console.error(error);
  }
});

module.exports = { createTargetScene };
