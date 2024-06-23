const { Scenes } = require("telegraf");
const { OylikRejaBelgilashViloyat } = require("../../../../../constants");
const { Hudud } = require("../../../../../models/Hudud");
const {
  handleTelegramExcel,
} = require("../../../../smallFunctions/handleTelegramExcel");

const set_monthly_plan = new Scenes.WizardScene(
  "set_monthly_plan",
  async (ctx) => {
    const json = await handleTelegramExcel(ctx);
    ctx.wizard.state.json = json;
    ctx.reply(`Necha kunda bajarish kerak?`);
    ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message)
      return ctx.reply(`Necha kunda bajarish kerak? Faqat son kiriting`);
    if (isNaN(ctx.message.text)) return ctx.reply(`Faqat son kiriting`);

    const promises = ctx.wizard.state.json.map(async (row) => {
      return Hudud.updateOne(
        { ID: row.ID },
        {
          $set: {
            monthly_plan: {
              summa: row[" Reja "],
              muxlat: parseInt(ctx.message.text),
            },
          },
        }
      );
    });
    Promise.all(promises).then(() => {
      ctx.reply(`Hammasi muvafaqqiyatli o'tdi. /start`);
      ctx.scene.leave();
    });
  }
);

set_monthly_plan.enter(async (ctx) => {
  ctx.replyWithDocument(OylikRejaBelgilashViloyat, {
    caption: `Belgilanishi kerak bo'lgan summalarni ushbu jadvalga joylashtirib menga yuboring`,
  });
});

module.exports = { set_monthly_plan };
