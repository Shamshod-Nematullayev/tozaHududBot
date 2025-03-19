const { Scenes, Markup } = require("telegraf");
const { keyboards, createInlineKeyboard } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Bildirishnoma } = require("../../../models/SudBildirishnoma");
const isCancel = require("../../smallFunctions/isCancel");
const { Nazoratchi } = require("../../../requires");

const addNotification = new Scenes.WizardScene(
  "add_notification",
  async (ctx) => {
    try {
      // Bekor qilish tugmasini tekshirish
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      // Yuborilgan xabar faylmi tekshirish
      if (!ctx.message.document) {
        return ctx.reply(messages.notFile, keyboards.cancelBtn.resize());
      }

      ctx.wizard.state.file_id = ctx.message.document.file_id;
      ctx.wizard.state.file_name = ctx.message.document.file_name;

      // Inspektorni tanlash tugmasi
      let inspectors = await Nazoratchi.find();
      inspectors = inspectors.sort((a, b) => a.name.localeCompare(b.name));
      const buttonsArray = [];
      inspectors.forEach((ins) => {
        buttonsArray.push([Markup.button.callback(ins.name, ins.id)]);
      });
      await ctx.reply(
        messages.chooseInspektor,
        Markup.inlineKeyboard(buttonsArray).oneTime()
      );
      ctx.wizard.next();
    } catch (error) {
      console.error(error);
      ctx.reply("Xatolik kuzatildi").catch();
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      ctx.wizard.state.inspector = await Nazoratchi.findOne({
        id: ctx.update.callback_query.data,
      });
      ctx.wizard.state.mahallalar = [];
      await ctx.editMessageText(messages.enterMahalla, keyboards.mahallalar);
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Xatolik", keyboards.cancelBtn.resize());
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();

      const mahallalar = require("../../../lib/mahallalar.json");
      ctx.wizard.state.mahallalar.push(
        mahallalar.filter(
          (mfy) => ctx.update.callback_query.data.split("_")[1] == mfy.id
        )[0]
      );
      await ctx.deleteMessage();
      await ctx.reply(messages.enterDate, keyboards.cancelBtn.resize());
      return ctx.wizard.next();
    } catch (error) {
      ctx.reply("Xatolik");
      console.log(error);
    }
  },
  (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    if (ctx.message && ctx.message.text.split(".").length != 3) {
      return ctx.reply(messages.enterDate, keyboards.cancelBtn.resize());
    }
    const date = ctx.message.text.split(".");
    ctx.wizard.state.date = {
      day: date[0],
      month: date[1],
      year: date[2],
    };
    ctx.reply(messages.enterAbonents, keyboards.cancelBtn.resize());
    ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();

    // Split the string into an array
    const arr = ctx.message.text.trim().split(/\s+/);

    const documents = await Bildirishnoma.find({ type: "sudga_chiqoring" });
    let doc_num = documents[documents.length - 1].doc_num + 1;
    const newDocument = await Bildirishnoma.create({
      user: ctx.from,
      type: "sudga_chiqoring",
      ...ctx.wizard.state,
      doc_num,
      mahallaId: ctx.wizard.state.mahallalar[0].id,
    });
    await ctx.replyWithHTML(`✅\n№ <code>${doc_num}</code>`);
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
        return ctx.scene.leave();
      }
      switch (ctx.callbackQuery?.data) {
        case "xa":
          const documents = await Bildirishnoma.find({
            type: "sudga_chiqoring",
          });
          let doc_num = documents[documents.length - 1].doc_num + 1;
          await ctx.replyWithHTML(
            messages.enterNotificationFile + `\n<code>${doc_num}</code>`,
            keyboards.cancelBtn.resize()
          );
          ctx.wizard.selectStep(0);
          break;
        case "yoq":
          await ctx.deleteMessage();
          ctx.reply("OK", keyboards.adminKeyboard.resize());
          ctx.scene.leave();
          break;
      }
    } catch (error) {
      console.error("add notification scene 3");
      throw error;
    }
  }
);

addNotification.enter(async (ctx) => {
  const documents = await Bildirishnoma.find({ type: "sudga_chiqoring" });
  let doc_num = documents[documents.length - 1].doc_num + 1;
  ctx.replyWithHTML(
    messages.enterNotificationFile + `\n<code>${doc_num}</code>`,
    keyboards.cancelBtn.resize()
  );
});

addNotification.leave((ctx) => {
  ctx.reply(messages.heyAdmin, keyboards.adminKeyboard.resize());
});

module.exports = { addNotification };
