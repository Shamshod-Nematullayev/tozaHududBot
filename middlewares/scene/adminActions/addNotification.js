const { Scenes, Markup } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { SudBildirishnoma } = require("../../../models/SudBildirishnoma");
const isCancel = require("../../smallFunctions/isCancel");

const addNotification = new Scenes.WizardScene(
  "add_notification",
  async (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    if (!ctx.message.document) {
      return ctx.reply(
        messages.lotin.notFile,
        keyboards.lotin.cancelBtn.resize()
      );
    }
    ctx.wizard.state.file_id = ctx.message.document.file_id;
    const inspectors = require("../../../lib/nazoratchilar.json");
    const buttonsArray = [];
    inspectors.forEach((ins) => {
      buttonsArray.push([Markup.button.callback(ins.name, ins.id)]);
    });
    ctx.reply(
      messages.lotin.chooseInspektor,
      Markup.inlineKeyboard(buttonsArray).reply_markup
    );
    ctx.wizard.next();
  },
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      const inspectors = require("../../../lib/nazoratchilar.json");
      ctx.wizard.state.inspector = inspectors.filter(
        (ins) => ctx.update.callback_query.data == ins.id
      );
      ctx.wizard.state.mahallalar = [];
      ctx.editMessageText(
        messages.lotin.enterMahalla,
        keyboards.lotin.mahallalar.reply_markup
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Xatolik", keyboards.lotin.cancelBtn.resize());
    }
  },
  (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    if (ctx.message && ctx.message.text == "tayyor") {
      ctx.reply(messages.lotin.enterDate, keyboards.lotin.cancelBtn.resize());
      ctx.wizard.next();
    }
    const mahallalar = require("../../../lib/mahallalar.json");
    ctx.wizard.state.mahallalar.push(
      mahallalar.filter(
        (mfy) => ctx.update.callback_query.data.split("_")[1] == mfy.id
      )
    );
    ctx.reply(messages.lotin.isDone, Markup.keyboard(["tayyor"]));
  },
  (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    if (ctx.message && ctx.message.text.split(".").length != 3) {
      return ctx.reply(
        messages.lotin.enterDate,
        keyboards.lotin.cancelBtn.resize()
      );
    }
    const date = ctx.message.text.split(".");
    ctx.wizard.date = {
      day: date[0],
      month: date[1],
      year: date[2],
    };
    ctx.reply(messages.lotin.enterAbonents, keyboards.lotin.cancelBtn.resize());
    ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    ctx.wizard.state.abonents = ctx.message.text.split(" ");
    const newDocument = new SudBildirishnoma({
      ...ctx.wizard.state,
    });
    await newDocument.save();
    ctx.reply(messages.lotin.accepted);
    ctx.wizard.next();
  }
);

addNotification.enter((ctx) => {
  ctx.reply(
    messages[ctx.session.til].enterNotificationFile,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});

addNotification.leave((ctx) => {
  ctx.reply(
    messages[ctx.session.til].heyAdmin,
    keyboards[ctx.session.til].adminKeyboard.resize()
  );
});

module.exports = { addNotification };
