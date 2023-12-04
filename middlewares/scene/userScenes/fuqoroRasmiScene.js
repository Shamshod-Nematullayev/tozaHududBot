const { Scenes, Markup } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Picture } = require("../../../models/Picture");
const isCancel = require("../../smallFunctions/isCancel");

const fuqoroRasmiScene = new Scenes.WizardScene(
  "fuqoro_rasmini_kiritish",
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
      const rasm = await Picture.findOne({
        kod: ctx.message.text,
        confirm: true,
      });
      if (rasm) return ctx.reply(`Bu abonentga avval rasm biriktirilgan`);
      ctx.wizard.state.KOD = parseInt(ctx.message.text);
      ctx.reply(
        messages.enterPicture,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
      ctx.wizard.next();
    } catch (error) {
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (!ctx.message.photo || ctx.message.photo.length < 1) {
        return ctx.reply(messages.enterPicture);
      } else {
        ctx.wizard.state.PICTURE_ID =
          ctx.message.photo[ctx.message.photo.length - 1].file_id;
        ctx.wizard.next();
        const newPhoto = new Picture({
          user_id: ctx.from.id,
          photo_file_id:
            ctx.message.photo[ctx.message.photo.length - 1].file_id,
          kod: ctx.wizard.state.KOD,
          type: "FUQORO_RASMI",
          createdAt: Date.now(),
        });
        await newPhoto.save().then((res) => {
          ctx.telegram
            .sendPhoto(process.env.CHANNEL, res.photo_file_id, {
              caption: `Fuqoro rasmi #rasm \n\n<code>${res.kod}</code>\n<a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
              reply_markup: Markup.inlineKeyboard([
                [
                  Markup.button.url(
                    "Tasdiqlash ✅",
                    `https://t.me/${ctx.botInfo.username}/?start=${
                      "picture_accept_" + res._id
                    }`
                  ),
                ],
                [
                  Markup.button.url(
                    "Bekor qilish ❌",
                    `https://t.me/${ctx.botInfo.username}/?start=${
                      "picture_unaccept_" + res._id
                    }`
                  ),
                ],
              ]).oneTime().reply_markup,
              parse_mode: "HTML",
            })
            .then(async (msg) => {
              ctx.reply(messages.accepted);
              await newPhoto.updateOne({
                $set: { messageIdChannel: msg.message_id },
              });
              ctx.scene.leave();
            });
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
);
fuqoroRasmiScene.enter((ctx) => {
  ctx.reply(
    messages.enterAbonentKod,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});
fuqoroRasmiScene.leave((ctx) => {
  ctx.reply(
    messages.startGreeting,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});

module.exports = { fuqoroRasmiScene };
