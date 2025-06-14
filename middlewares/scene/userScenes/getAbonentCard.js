const { WizardScene } = require("telegraf/scenes");
const os = require("os");
const path = require("path");
const {
  Abonent,
  keyboards,
  htmlPDF,
  fs,
  Nazoratchi,
} = require("../../../requires");
const ejs = require("ejs");
const { createTozaMakonApi } = require("../../../api/tozaMakon");
const puppeter = require("puppeteer");
const isCancel = require("../../smallFunctions/isCancel");

const getAbonentCard = new WizardScene(
  "getAbonentCard",
  async (ctx) => {
    try {
      await ctx.reply("Abonent hisob raqamini kiriting", keyboards.cancelBtn);
      return ctx.wizard.next();
    } catch (error) {
      console.error(error);
    }
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
      let optionsByOs = {};
      if (os.platform() === "win32") {
        optionsByOs = {
          args: [],
          executablePath:
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        };
      } else {
        optionsByOs = {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          userDataDir: path.join(os.tmpdir(), "puppeteer"),
          executablePath: "/usr/bin/chromium-browser",
        };
      }
      const browser = await puppeter.launch({
        headless: true,
        ...optionsByOs,
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

getAbonentCard.on("text", async (ctx, next) => {
  if (isCancel(ctx?.message?.text)) {
    ctx.reply("Amaliyot bekor qilindi", keyboards.mainKeyboard);
    return ctx.scene.leave();
  }
  next();
});

module.exports = getAbonentCard;
