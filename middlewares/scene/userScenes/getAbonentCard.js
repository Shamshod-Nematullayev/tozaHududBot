const { WizardScene } = require("telegraf/scenes");
const { Abonent, keyboards, htmlPDF, fs } = require("../../../requires");
const ejs = require("ejs");
const { tozaMakonApi } = require("../../../api/tozaMakon");

const getAbonentCard = new WizardScene(
  "getAbonentCard",
  async (ctx) => {
    try {
      await ctx.reply("Abonent hisob raqamini kiriting");
      return ctx.wizard.next();
    } catch (error) {
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      const text = ctx.message.text;
      if (isNaN(text) || text.length < 12) {
        ctx.scene.leave();
        return ctx.reply(
          "Abonent hisob raqamini to'g'ri kiriting",
          keyboards.mainKeyboard
        );
      }
      const abonent = await Abonent.findOne({ licshet: text });
      if (!abonent) return ctx.reply("Abonent topilmadi");
      const data = (
        await tozaMakonApi(
          `/user-service/residents/${abonent.id}/print-card?lang=UZ`
        )
      ).data;
      const html = await new Promise((resolve, reject) => {
        ejs.renderFile(
          "./views/abonentKarta.ejs",
          { ...data },
          {},
          (err, str) => {
            if (err) return reject(err);
            resolve(str);
          }
        );
      });
      htmlPDF
        .create(html, {
          format: "A4",
          orientation: "portrait",
        })
        .toBuffer(async (err, buffer) => {
          if (err) throw err;
          await ctx.replyWithDocument({
            source: buffer,
            filename: ctx.message.text + ".pdf",
          });
          ctx.scene.leave();
        });
    } catch (error) {
      console.error(error);
      ctx.reply("Xatolik kuzatildi");
    }
  }
);

module.exports = getAbonentCard;
