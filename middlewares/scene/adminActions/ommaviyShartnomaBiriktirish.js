const { Scenes, Markup } = require("telegraf");
const { Mahalla } = require("../../../models/Mahalla");
const { createInlineKeyboard, keyboards } = require("../../../lib/keyboards");
const isCancel = require("../../smallFunctions/isCancel");

const ommaviyShartnomaBiriktirish = new Scenes.WizardScene(
  "ommaviy_shartnoma_biriktirish",
  async (ctx) => {
    ctx.wizard.state.file_id = ctx.message.document.file_id;
    ctx.wizard.state.filename = ctx.message.document.file_name;
    const mahallalar = await Mahalla.find();

    // Create a sorted copy of mahallalar
    const sortedMahallalar = mahallalar.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const buttons = sortedMahallalar.map((mfy) => [
      Markup.button.callback(mfy.name, mfy.id),
    ]);
    await ctx.reply("Mahallani tanlang", {
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup,
    });
    ctx.wizard.next();
  },
  async (ctx) => {
    await ctx.deleteMessage();
    const mahalla = await Mahalla.findOne({ id: ctx.callbackQuery.data });
    await mahalla.updateOne({
      $set: {
        ommaviy_shartnoma: {
          filename: ctx.wizard.state.filename,
          file_id: ctx.wizard.state.file_id,
        },
      },
    });
    await ctx.reply(
      "Muvaffaqqiyatli biriktirildi. Yana biriktiramizmi?",
      createInlineKeyboard([[["Xa", "xa"]], [["Yo'q", "yoq"]]])
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    try {
      if (ctx.message?.text) {
        ctx.reply("OK", keyboards.adminKeyboard.resize());
        ctx.scene.leave();
      }
      if (ctx.callbackQuery?.data) ctx.deleteMessage();
      switch (ctx.callbackQuery?.data) {
        case "xa":
          ctx.reply("Shartnoma faylini yuboring. PDF formatida!");
          ctx.wizard.selectStep(0);
          break;
        case "yoq":
          await ctx.deleteMessage();
          ctx.reply("OK", keyboards.adminKeyboard.resize());
          ctx.scene.leave();
          break;
      }
    } catch (error) {
      console.log("ommaviy shartnoma ulash scene scene 3");
      throw error;
    }
  }
);

ommaviyShartnomaBiriktirish.on("text", (ctx) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi");
    return ctx.scene.leave();
  }
});
ommaviyShartnomaBiriktirish.enter((ctx) =>
  ctx.reply("Shartnoma faylini yuboring. PDF formatida!")
);

module.exports = { ommaviyShartnomaBiriktirish };
