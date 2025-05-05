const { WizardScene } = require("telegraf/scenes");
const { Abonent, keyboards, htmlPDF, fs } = require("../../../requires");
const ejs = require("ejs");
const { createTozaMakonApi } = require("../../../api/tozaMakon");
const puppeter = require("puppeteer");

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

      const tozaMakonApi = createTozaMakonApi(abonent.companyId);
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
      const browser = await puppeter.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const buffer = await page.pdf({
        format: "A4",
        printBackground: true,
      });
      await page.close();

      await ctx.replyWithDocument({
        source: Buffer.from(buffer),
        filename: ctx.message.text + ".pdf",
      });

      ctx.scene.leave();
    } catch (error) {
      console.error(error);
      ctx.reply("Xatolik kuzatildi");
    }
  }
);

module.exports = getAbonentCard;
