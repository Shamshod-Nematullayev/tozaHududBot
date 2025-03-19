const { WizardScene } = require("telegraf/scenes");
const { Abonent } = require("../../../models/Abonent");

const uploadWarningTozamakon = new WizardScene(
  "uploadWarningTozamakon",
  async (ctx) => {
    try {
      const accountNumbers = ctx.message.text.split(/\s+/);
      for (const accountNumber of accountNumbers) {
        const abonent = await Abonent.findOne({ licshet: accountNumber });
        if (!abonent) {
          await ctx.reply(
            `Hisob raqamiga ${accountNumber} abonent mavjud emas.`
          );
          continue;
        }
      }
    } catch (error) {
      console.error(error);
      await ctx.reply("Xatolik kuzatildi");
    }
  }
);
