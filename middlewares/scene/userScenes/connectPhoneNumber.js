const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const isCancel = require("../../smallFunctions/isCancel");
const { Abonent } = require("../../../models/Abonent");
const { Nazoratchi } = require("../../../requires");
const { createTozaMakonApi } = require("../../../api/tozaMakon");

const connectPhoneNumber = new Scenes.WizardScene(
  "connect_phone_number",
  async (ctx) => {
    try {
      if (isNaN(ctx.message?.text))
        return ctx.reply(
          messages.enterOnlyNumber,
          keyboards.cancelBtn.resize()
        );
      if (ctx.message.text.length != 12)
        return ctx.reply(
          messages.enterFullNamber,
          keyboards.cancelBtn.resize()
        );

      const inspektor = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      if (!inspektor) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.inspector_id = inspektor.id;
      ctx.wizard.state.inspector_name = inspektor.name;
      ctx.wizard.state.companyId = inspektor.companyId;

      const abonent = await Abonent.findOne({
        licshet: ctx.message.text,
        companyId: inspektor.companyId,
      });
      if (!abonent) {
        await ctx.reply(messages.abonentNotFound);
        return ctx.scene.leave();
      }
      ctx.wizard.state.accountNumber = ctx.message.text;
      ctx.wizard.state.abonent_id = abonent.id;
      ctx.wizard.state.fio = abonent.fio;
      ctx.wizard.state.mahalla_name = abonent.mahalla_name;

      if (!abonent.shaxsi_tasdiqlandi?.confirm) {
        await ctx.reply(
          "🛑 Ushbu abonent shaxsi tasdiqlanmagan, avval shaxsini tasdiqlang! 🛑"
        );
        return ctx.scene.leave();
      }

      if (abonent.phone_tasdiqlandi?.confirm) {
        ctx.wizard.selectStep(2);
        return ctx.reply(
          `🛑 Ushbu hisob raqamiga ${abonent.phone_tasdiqlandi.inspector_name} tomonidan allaqachon telefon raqami biriktirilgan <b>${abonent.phone}</b>. Baribir o'zgartirmoqchimisiz?`,
          keyboards.yesOrNo
        );
      }
      ctx.wizard.state.accountNumber = ctx.message.text;
      ctx.wizard.state.abonent_id = abonent.id;
      await ctx.replyWithHTML(
        `<b>${abonent.fio}</b> ${abonent.mahalla_name} MFY\n` +
          `Telefon raqamini kiriting misol: 992852536`,
        keyboards.cancelBtn.resize()
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply(`Xatolik kuzatildi`, keyboards.cancelBtn);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message.text.length != 9 || isNaN(ctx.message.text)) {
        return ctx.reply(
          `Telefon raqam noto'g'ri formatda yuborildi. misol: 992852536`
        );
      }
      const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.companyId);
      const abonentDatas = (
        await tozaMakonApi.get(
          `/user-service/residents/${ctx.wizard.state.abonent_id}?include=translates`
        )
      ).data;
      await tozaMakonApi.put(
        "/user-service/residents/" + ctx.wizard.state.abonent_id,
        {
          ...abonentDatas,
          description: `${ctx.wizard.state.inspector_name} ma'lumotiga asosan telefon raqami kiritildi.`,
          citizen: {
            ...abonentDatas.citizen,
            phone: ctx.message.text,
          },
          house: {
            ...abonentDatas.house,
            cadastralNumber: abonentDatas.house.cadastralNumber
              ? abonentDatas.house.cadastralNumber
              : "00:00:00:00:00:0000:0000",
          },
        }
      );
      await Abonent.updateOne(
        {
          licshet: ctx.wizard.state.accountNumber,
          companyId: ctx.wizard.state.companyId,
        },
        {
          $set: {
            phone: ctx.message.text,
            phone_tasdiqlandi: {
              confirm: true,
              inspector_id: ctx.wizard.state.inspector_id,
              inspector_name: ctx.wizard.state.inspector_name,
              updated_at: new Date(),
            },
          },
        }
      );
      await ctx.reply(`Muvaffaqqiyatli bajarildi ✅`);
      return ctx.scene.leave();
    } catch (error) {
      ctx.reply(`Xatolik kuzatildi`, keyboards.cancelBtn);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.callbackQuery.data === "yes") {
        await ctx.deleteMessage();
        ctx.wizard.selectStep(1);
        return await ctx.replyWithHTML(
          `<b>${ctx.wizard.state.fio}</b> ${ctx.wizard.state.mahalla_name}\n` +
            `Telefon raqamini kiriting misol: 992852536`,
          keyboards.cancelBtn.resize()
        );
      } else if (ctx.callbackQuery.data === "no") {
        await ctx.deleteMessage();
      }
      ctx.scene.leave();
    } catch (error) {
      ctx.reply(`Xatolik kuzatildi`, keyboards.cancelBtn);
      console.error(error);
    }
  }
);

connectPhoneNumber.on("text", async (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    await ctx.reply("Bekor qilindi");
    ctx.scene.leave();
    return;
  }
  next();
});
connectPhoneNumber.enter((ctx) => {
  ctx.reply(`Abonent listavoy kodini kiriting`, keyboards.cancelBtn.resize());
});
connectPhoneNumber.leave((ctx) => {
  ctx.reply(messages.startGreeting, keyboards.mainKeyboard.resize());
});

module.exports = { connectPhoneNumber };
