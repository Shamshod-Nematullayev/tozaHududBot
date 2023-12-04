const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Guvohnoma } = require("../../../models/Guvohnoma");
const isCancel = require("../../smallFunctions/isCancel");

const confirmGuvohnomaScene = new Scenes.WizardScene(
  "confirm_game_over",
  async (ctx) => {
    try {
      // bekor qilish tugmasimi?
      if (isCancel(ctx.message.text)) return ctx.scene.leave();
      //   Raqam kiritilyaptimi?
      if (isNaN(ctx.message.text))
        return ctx.reply(messages.lotin.enterOnlyNumber);

      const guvohnoma = await Guvohnoma.findOne({
        document_number: ctx.message.text,
      });

      //   Guvohnoma topilmadimi?
      if (!guvohnoma) {
        return ctx.reply(messages.lotin.notFoundData);
      }

      // if (guvohnoma.holat == "BAJARILDI") {
      //   return ctx.reply("Bu xujjat tayyorlangan");
      // }
      //   Adminga javob qaytarish
      ctx.telegram.forwardMessage(
        ctx.chat.id,
        process.env.CHANNEL,
        guvohnoma.messageIdChannel
      );
      ctx.reply(
        "guvohnoma raqamini kiriting",
        keyboards.lotin.adminAnswerKeyboard.resize()
      );

      ctx.wizard.state.guvohnoma = guvohnoma;
      ctx.wizard.next();
    } catch (err) {
      ctx.reply("Xatolik");
      console.log({ message: "complateGuvohnoma.js da xatolik", err });
    }
  },
  async (ctx) => {
    // bekor qilish btn bo'lsa
    if (isCancel(ctx.message.text)) {
      ctx.session.guvohnoma_id = ctx.wizard.state.guvohnoma._id;
      return ctx.scene.enter("cancel_guvohnoma");
    }
    // chiqish btn bo'lsa
    if (ctx.message.text == "Chiqish") return ctx.scene.leave();

    const guvohnoma = await Guvohnoma.findByIdAndUpdate(
      ctx.wizard.state.guvohnoma._id,
      {
        $set: {
          fhdyo_raqami: ctx.message.text,
          holat: "BAJARILDI",
        },
      }
    );
    ctx.telegram
      .editMessageCaption(
        process.env.CHANNEL,
        guvohnoma.messageIdChannel,
        0,
        `<b>guvohnoma№_${guvohnoma.document_number}</b> <a href="https://t.me/${guvohnoma.user.username}">${guvohnoma.user.fullname}</a>\n` +
          `status: |<b> 🟩BAJARILDI🟩 </b>|        #game_over\n` +
          `<code>${guvohnoma.kod}</code>\n` +
          `<i>${guvohnoma.comment}</i>\n` +
          `✅✅✅ by <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
        { parse_mode: "HTML", disable_web_page_preview: true }
      )
      .then((res) => {
        ctx.telegram
          .forwardMessage(
            guvohnoma.user.id,
            process.env.CHANNEL,
            res.message_id
          )
          .then(() => {
            ctx.reply(messages.lotin.sended);
            return ctx.scene.leave();
          });
      });
  }
);

confirmGuvohnomaScene.enter((ctx) => {
  ctx.reply(
    messages.enterGuvohnomaNumber,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});

confirmGuvohnomaScene.leave((ctx) => {
  ctx.reply(
    messages.heyAdmin,
    keyboards[ctx.session.til].adminKeyboard.resize()
  );
});

module.exports = { confirmGuvohnomaScene };
