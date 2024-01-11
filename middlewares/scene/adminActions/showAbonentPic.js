const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Picture } = require("../../../models/Picture");
const isCancel = require("../../smallFunctions/isCancel");

const showAbonentPic = new Scenes.WizardScene(
  "show_abonent_pic",
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (isNaN(ctx.message.text))
        return ctx.reply(
          messages.enterOnlyNumber,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      if (ctx.message.text.length != 12)
        return ctx.reply(
          messages.enterFullNamber,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      const pictures = await Picture.find({ kod: ctx.message.text });
      if (pictures.length > 0) {
        pictures.forEach((pic) => {
          ctx.replyWithPhoto(pic.photo_file_id, {
            caption: `Yana abonent kodini kiriting`,
          });
        });
      } else
        ctx.reply(
          messages.notFoundData,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
    } catch (error) {
      console.log(error);
    }
  }
);

showAbonentPic.enter((ctx) => {
  ctx.reply(
    messages.enterAbonentKod,
    keyboards[ctx.session.til].adminAnswerKeyboard.resize()
  );
});

showAbonentPic.leave((ctx) => {
  ctx.reply(
    messages.heyAdmin,
    keyboards[
      ctx.session.til ? ctx.session.til : "lotin"
    ].adminKeyboard.resize()
  );
});

module.exports = { showAbonentPic };
