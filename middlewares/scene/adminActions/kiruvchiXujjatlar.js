const { Scenes, Markup } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { SudBildirishnoma } = require("../../../models/SudBildirishnoma");
const isCancel = require("../../smallFunctions/isCancel");

const addNotification = new Scenes.WizardScene(
  "income_document",
  async (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    if (!ctx.message.document) {
      return ctx.reply(
        messages.notFile,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
    }
    ctx.wizard.state.file_id = ctx.message.document.file_id;
    const inspectors = require("../../../lib/nazoratchilar.json");
    const buttonsArray = [];
    inspectors.forEach((ins) => {
      buttonsArray.push([Markup.button.callback(ins.name, ins.id)]);
    });
    buttonsArray.push([Markup.button.callback("Boshqa", "boshqa")]);

    ctx.reply(
      messages.chooseInspektor,
      Markup.inlineKeyboard(buttonsArray).oneTime()
    );
    ctx.wizard.next();
  },
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      const inspectors = require("../../../lib/nazoratchilar.json");
      ctx.wizard.state.inspector = inspectors.filter(
        (ins) => ctx.update.callback_query.data == ins.id
      )[0];
      ctx.wizard.state.mahallalar = [];
      ctx.editMessageText(
        messages.enterMahalla,
        keyboards[ctx.session.til].mahallalar
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Xatolik", keyboards[ctx.session.til].cancelBtn.resize());
    }
  },
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (ctx.message && ctx.message.text == "tayyor") {
        ctx.reply(
          messages.enterDate,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
        return ctx.wizard.next();
      } else {
        const mahallalar = require("../../../lib/mahallalar.json");
        ctx.wizard.state.mahallalar.push(
          mahallalar.filter(
            (mfy) => ctx.update.callback_query.data.split("_")[1] == mfy.id
          )[0]
        );
        ctx.reply(messages.isDone, Markup.keyboard(["tayyor"]).resize());
      }
    } catch (error) {
      ctx.reply("Xatolik");
      console.log(error);
    }
  },
  (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    if (ctx.message && ctx.message.text.split(".").length != 3) {
      return ctx.reply(
        messages.enterDate,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
    }
    const date = ctx.message.text.split(".");
    ctx.wizard.state.date = {
      day: date[0],
      month: date[1],
      year: date[2],
    };
    ctx.reply(
      messages.enterAbonents,
      keyboards[ctx.session.til].cancelBtn.resize()
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    let arr = [];
    ctx.message.text.split("\n").forEach((txt) => {
      if (txt != "") arr.push(...txt.split(" "));
    });
    ctx.wizard.state.abonents = arr;
    const documents = await SudBildirishnoma.find();
    let doc_num = documents[documents.length - 1].doc_num + 1;
    const newDocument = new SudBildirishnoma({
      user: ctx.from,
      ...ctx.wizard.state,
      doc_num,
    });
    await newDocument.save();
    ctx.replyWithHTML(`✅\n№ <code>${doc_num}</code>`);
    ctx.scene.leave();
  }
);

addNotification.enter((ctx) => {
  ctx.reply(
    messages.enterDocument,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});

addNotification.leave((ctx) => {
  ctx.reply(
    messages.heyAdmin,
    keyboards[ctx.session.til].adminKeyboard.resize()
  );
});

module.exports = { addNotification };
