const { Scenes, Markup } = require("telegraf");
const {
  shaxsiTasdiqlandiBildirishXatiImportExcel,
} = require("../../../constants");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Counter } = require("../../../models/Counter");
const { Bildirishnoma } = require("../../../models/SudBildirishnoma");
const isCancel = require("../../smallFunctions/isCancel");
const fs = require("fs");
const https = require("https");
const excelToJson = require("convert-excel-to-json");
const { Nazoratchi } = require("../../../requires");

const personConfirm = new Scenes.WizardScene(
  "shaxsi_tashdiqlandi_bildirish_xati",
  async (ctx) => {
    // Bekor qilish tugmasini tekshirish
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    // Yuborilgan xabar faylmi tekshirish
    if (!ctx.message.document) {
      return ctx.reply(
        messages.notFile,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
    }

    ctx.wizard.state.file_id = ctx.message.document.file_id;
    ctx.wizard.state.file_name = ctx.message.document.file_name;

    // Inspektorni tanlash tugmasi
    const inspectors = await Nazoratchi.find();
    const buttonsArray = [];
    inspectors.forEach((ins) => {
      buttonsArray.push([Markup.button.callback(ins.name, ins.id)]);
    });
    ctx.reply(
      messages.chooseInspektor,
      Markup.inlineKeyboard(buttonsArray).oneTime()
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      ctx.wizard.state.inspector = await Nazoratchi.findOne({
        id: ctx.update.callback_query.data,
      });
      ctx.wizard.state.mahallalar = [];
      await ctx.editMessageText(
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

      const mahallalar = require("../../../lib/mahallalar.json");

      mahallalar.forEach((mfy) => {
        if (ctx.update.callback_query.data.split("_")[1] == mfy.id)
          ctx.wizard.state.mahalla = mfy.id;
      });
      ctx.deleteMessage();
      ctx.reply(
        messages.enterDate,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
      return ctx.wizard.next();
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
    ctx.replyWithDocument(shaxsiTasdiqlandiBildirishXatiImportExcel, {
      caption: `Abonentlar ma'lumotini na'munadagidek excel shaklida kiriting`,
      reply_markup: keyboards[ctx.session.til].cancelBtn.resize(),
    });
    ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
    if (isCancel(ctx.message.text)) return ctx.scene.leave();
    if (
      ctx.message.document &&
      (ctx.message.document.mime_type ==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        ctx.message.document.mime_type == "application/vnd.ms-excel")
    ) {
      const xlsx = await ctx.telegram.getFileLink(ctx.message.document.file_id);
      const excelFile = fs.createWriteStream("./shaxs_tasdiqlandi.xls");
      ctx.reply(messages.pleaseWait);
      https.get(xlsx.href, (res) => {
        res.pipe(excelFile);
        excelFile.on("finish", async (cb) => {
          excelFile.close(cb);
          const xls = excelToJson({
            sourceFile: "./shaxs_tasdiqlandi.xls",
          });
          const abonents = [];
          for (let i = 0; i < xls[Object.keys(xls)[0]].length; i++) {
            const elem = xls[Object.keys(xls)[0]][i];

            if (i > 1 && elem.B) {
              abonents.push({
                KOD: elem.B,
                PASSPORT: elem.C,
              });
            }
          }
          const counter = await Counter.findOne({
            name: "shaxsi_tashdiqlandi_bildirish_xati",
          });
          await Bildirishnoma.create({
            abonents,
            date: ctx.wizard.state.date,
            file_id: ctx.wizard.state.file_id,
            file_name: ctx.wizard.state.file_id,
            inspector: ctx.wizard.state.inspector,
            mahallalar: [ctx.wizard.state.mahalla],
            type: "shaxsi_tasdiqlandi",
            user: ctx.from,
            doc_num: counter.value + 1,
          });
          await counter.updateOne({ $set: { value: counter.value + 1 } });
          await ctx.reply(
            `<code>${counter.value + 1}</code> raqami bilan saqlandi`,
            { parse_mode: "HTML" }
          );
          return ctx.scene.leave();
        });
      });
    } else {
      ctx.reply(
        messages.notExcelFile,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
    }
  }
);

personConfirm.enter(async (ctx) => {
  const counter = await Counter.findOne({
    name: `shaxsi_tashdiqlandi_bildirish_xati`,
  });
  ctx.replyWithHTML(
    messages.enterNotificationFile + `\n<code>${counter.value + 1}</code>`,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});

personConfirm.leave((ctx) => {
  ctx.reply(
    messages.heyAdmin,
    keyboards[ctx.session.til].adminKeyboard.resize()
  );
});

module.exports = { personConfirm };
