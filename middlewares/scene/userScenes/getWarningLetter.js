const { Scenes } = require("telegraf");
const { keyboards, Nazoratchi, Abonent } = require("../../../requires");
const getAbonentCard = require("./getAbonentCard");
const { createTozaMakonApi } = require("../../../api/tozaMakon");
const isCancel = require("../../smallFunctions/isCancel");

const getWarningLetter = new Scenes.WizardScene(
  "getWarningLetter",
  (ctx) => {
    ctx.reply("Abonent hisob raqamini kiriting", keyboards.cancelBtn);
    ctx.wizard.next();
  },
  async (ctx) => {
    try {
      const text = ctx.message.text;
      if (isNaN(text) || text.length < 12) {
        return ctx.reply(
          "Abonent hisob raqamini to'g'ri kiriting",
          keyboards.cancelBtn
        );
      }
      const inspector = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      if (!inspector) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!",
          keyboards.mainKeyboard
        );
        return ctx.scene.leave();
      }
      const abonent = await Abonent.findOne({
        licshet: text,
        companyId: inspector.companyId,
      });
      if (!abonent) return ctx.reply("Abonent topilmadi");

      const tozaMakonApi = createTozaMakonApi(abonent.companyId);
      const abonentKSaldo = (
        await tozaMakonApi.get(
          `/user-service/residents/${abonent.id}?include=translates&withPhoto=true`
        )
      ).data.balance.kSaldo;
      if (abonentKSaldo < 100000) {
        ctx.scene.leave();
        return ctx.reply(
          "Abonentning qarzdorligi 100.000 so'mdan kichik bo'lganligi uchun bekor qilindi",
          keyboards.mainKeyboard.resize()
        );
      }
      const batch = (
        await tozaMakonApi.post(
          `/user-service/court-warnings/batch`,
          {
            lang: "UZ-CYRL",
            oneWarningInOnePage: false,
            residentIds: [abonent.id],
            warningBasis: `${abonentKSaldo.toLocaleString()} soʻm qarzdor`,
            warningDate: `${new Date().getFullYear()}-${
              new Date().getMonth() < 9
                ? "0" + (new Date().getMonth() + 1)
                : new Date().getMonth() + 1
            }-${new Date().getDate()}`,
          },
          { responseType: "arraybuffer" }
        )
      ).data;

      await ctx.replyWithDocument({
        source: batch,
        filename: ctx.message.text + ".pdf",
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
  next();
});

module.exports = { getWarningLetter };
