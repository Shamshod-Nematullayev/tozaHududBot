const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Guvohnoma } = require("../../../models/Guvohnoma");
const isCancel = require("../../smallFunctions/isCancel");

const cancelGuvohnoma = new Scenes.WizardScene(
  "cancel_guvohnoma",

  async (ctx) => {
    if (isCancel(ctx.message.text)) {
      return ctx.scene.leave();
    }
    ctx.reply(messages.sended);
    const res = await Guvohnoma.findById(ctx.session.guvohnoma_id);
    ctx.telegram
      .sendPhoto(
        res.user.id,
        res.file_id,
        {
          caption:
            "Siz yuborgan guvohnoma bekor qilindi. Asos: \n " +
            ctx.message.text,
        },
        {
          parse_mode: "HTML",
        }
      )
      .then(() => {
        res.updateOne({
          $set: {
            reply_comment: ctx.message.text,
          },
        });
        ctx.telegram
          .editMessageCaption(
            process.env.CHANNEL,
            res.messageIdChannel,
            0,
            `<b>guvohnoma№_${res.document_number}</b> <a href="https://t.me/${res.user.username}">${res.user.fullname}</a>\n` +
              `<a href="https://t.me/${res.user.username}">${res.user.fullname}</a> tizimga kiritgan \nstatus: |⛔️BEKOR QILINDI⛔️|\n #game_over ` +
              `<code    >${res.kod}</code>\n` +
              `Asos: <i>${ctx.message.text}</i>` +
              `\npowered by <a href="https://t.me/oliy_ong">Oliy_Ong</a>`,
            {
              reply_markup: null,
              parse_mode: "HTML",
              disable_web_page_preview: true,
            }
          )
          .then(async () => {
            await res.updateOne({
              $set: {
                holat: "BEKOR_QILINDI",
                reply_comment: ctx.message.text,
              },
            });
            return ctx.scene.leave();
          });
      });
  }
);

cancelGuvohnoma.enter((ctx) => {
  ctx.reply(
    messages.ogohlantirishKiriting,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});

cancelGuvohnoma.leave((ctx) => {
  ctx.reply(
    messages.heyAdmin,
    keyboards[
      ctx.session.til ? ctx.session.til : "lotin"
    ].adminKeyboard.resize()
  );
});

module.exports = cancelGuvohnoma;
