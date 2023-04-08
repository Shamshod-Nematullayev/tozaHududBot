const { Scenes, Markup } = require("telegraf");
const { keyboards } = require("../../lib/keyboards");
const { messages } = require("../../lib/messages");
const { Guvohnoma } = require("../../models/Guvohnoma");
const isCancel = require("../smallFunctions/isCancel");

const guvohnomaKiritishScene = new Scenes.WizardScene(
  "GUVOHNOMA_KIRITISH",
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (isNaN(ctx.message.text))
        return ctx.reply(
          messages.enterOnlyNumber,
          keyboards.cancelBtn.resize()
        );
      if (ctx.message.text.length != 12)
        return ctx.reply(
          messages.enterFullNamber,
          keyboards.cancelBtn.resize()
        );
      ctx.wizard.state.KOD = parseInt(ctx.message.text);
      ctx.reply(messages.enterPicture, keyboards.cancelBtn.resize());
      ctx.wizard.next();
    } catch (error) {
      console.log(error);
    }
  },
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (!ctx.message.photo || ctx.message.photo.length < 1) {
        return ctx.reply(messages.enterPicture);
      } else {
        ctx.wizard.state.PICTURE_ID =
          ctx.message.photo[ctx.message.photo.length - 1].file_id;
        ctx.reply(messages.enterComment, keyboards.cancelBtn.resize());
        ctx.wizard.next();
      }
    } catch (error) {
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (ctx.message.text.length > 300)
        return ctx.reply(messages.biggierMaxLength);

      const newGuvohonoma = new Guvohnoma({
        kod: ctx.wizard.state.KOD,
        file_id: ctx.wizard.state.PICTURE_ID,
        comment: ctx.message.text,
        user: {
          id: ctx.from.id,
          username: ctx.from.username,
          fullname: ctx.from.last_name
            ? ctx.from.first_name + " " + ctx.from.last_name
            : ctx.from.first_name,
        },
      });
      await newGuvohonoma.save().then((guvohnoma) => {
        ctx.telegram.sendPhoto(process.env.CHANNEL, guvohnoma.file_id, {
          caption:
            `<a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>\n` +
            `status: |YANGI|\n` +
            `<code>${guvohnoma.kod}</code>\n` +
            `<i>${ctx.message.text}</i>\n` +
            `powered by <a href="https://t.me/oliy_ong">Oliy_Ong</a>`,
          reply_markup: Markup.inlineKeyboard([
            Markup.button.url(
              "Ijro etish",
              `https://t.me/${ctx.botInfo.username}/?start=${
                "guvohnoma_" + guvohnoma._id
              }`
            ),
          ]).reply_markup,
          parse_mode: "HTML",
        });
      });
    } catch (error) {
      console.log(error);
    }
  }
);
guvohnomaKiritishScene.enter((ctx) => {
  ctx.reply(messages.enterAbonentKod, keyboards.cancelBtn.resize());
});
guvohnomaKiritishScene.leave((ctx) => {
  ctx.reply(messages.startGreeting, keyboards.mainKeyboard.resize());
});

module.exports = { guvohnomaKiritishScene };
