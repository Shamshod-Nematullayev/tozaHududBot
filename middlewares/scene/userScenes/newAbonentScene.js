const { Scenes, Markup } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Abonent } = require("../../../models/YangiAbonent");
const isCancel = require("../../smallFunctions/isCancel");
const isPinfl = require("../../smallFunctions/isPinfl");
const { kirillga } = require("../../smallFunctions/lotinKiril");
const qaysiMahalla = require("../../smallFunctions/qaysiMahalla");

const newAbonentScene = new Scenes.WizardScene(
  "NEW_ABONENT",
  (ctx) => {
    try {
      if (isCancel(ctx.message.text)) return ctx.scene.leave();
      ctx.scene.state.FISH = kirillga(ctx.message.text);
      ctx.reply(
        messages.enterYashovchiSoni,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
      ctx.wizard.next();
    } catch (error) {
      console.log(error);
    }
  },
  (ctx) => {
    try {
      if (isCancel(ctx.message.text)) return ctx.scene.leave();
      if (isNaN(ctx.message.text)) {
        ctx.reply(
          messages.enterYashovchiSoni,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      } else {
        ctx.scene.state.YASHOVCHILAR = parseInt(ctx.message.text);
        ctx.reply(
          messages.enterMahalla,
          keyboards[ctx.session.til].mahallalar.oneTime()
        );
        ctx.wizard.next();
      }
    } catch (error) {
      console.log(error);
    }
  },
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      const mfy_id = ctx.update.callback_query.data.split("_")[1];
      ctx.scene.state.MFY_ID = mfy_id;
      ctx.deleteMessage();
      ctx.reply(messages.enterKocha);
      ctx.wizard.next();
    } catch (error) {
      console.log(error);
    }
  },
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      ctx.scene.state.HUDUD = ctx.message.text;
      ctx.reply(messages.enterPasport1);
      ctx.wizard.next();
    } catch (error) {
      console.log(error);
    }
  },
  (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      ctx.scene.state.PASSPORT = ctx.message.text;
      ctx.reply(messages.enterPasport2, keyboards.lotin.cancelBtn.resize());
      ctx.wizard.next();
    } catch (error) {
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (isPinfl(ctx.message.text)) {
        ctx.scene.state.PINFIL = ctx.message.text;
        const state = ctx.scene.state;
        const newAbonent = new Abonent({
          user: {
            id: ctx.from.id,
            username: ctx.from.username,
            nikName: ctx.from.first_name,
          },
          data: state,
          kod: null,
        });
        const abonent = await newAbonent.save();
        ctx.telegram
          .sendMessage(
            process.env.CHANNEL,
            `<a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>\n` +
              `status: |YANGI|\n` +
              `<code>${state.FISH}</code>\n` +
              `yashovchilar_soni: ${state.YASHOVCHILAR}\n` +
              `mahalla: <code>${qaysiMahalla(state.MFY_ID)}</code> \n` +
              `qishloq: ${state.HUDUD}\n` +
              `pasport ma'lumotlari: <code>${state.PASSPORT}</code>\n` +
              `<code>${state.PINFIL}</code>\n\n` +
              `powered by <a href="https://t.me/oliy_ong">Oliy_Ong</a>`,
            {
              parse_mode: "HTML",
              reply_markup: Markup.inlineKeyboard([
                Markup.button.url(
                  "Kod ochish",
                  `https://t.me/${ctx.botInfo.username}?start=${newAbonent._id}`
                ),
              ]).reply_markup,
              disable_web_page_preview: true,
            }
          )
          .then(async (res) => {
            await Abonent.findByIdAndUpdate(abonent._id, {
              $set: { messageIdChannel: res.message_id },
            });
          });
        ctx.reply(messages.accepted);

        ctx.scene.leave();
      } else {
        ctx.replyWithPhoto(
          "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DZjJS0SoXq6A&psig=AOvVaw1IOqLHD3CndpvLm1vqLwHJ&ust=1679216266118000&source=images&cd=vfe&ved=0CBAQjRxqFwoTCPDp6ZqO5f0CFQAAAAAdAAAAABAE",
          {
            caption: messages.enterReallyPinfl,
            reply_markup: keyboards.lotin.cancelBtn.resize().reply_markup,
          }
        );
      }
    } catch (error) {
      console.log(error);
    }
  }
);
newAbonentScene.enter((ctx) => {
  ctx.reply(
    messages.enterFISH,

    keyboards[ctx.session.til].cancelBtn.resize()
  );
});

newAbonentScene.leave((ctx) => {
  ctx.reply(
    messages.startGreeting,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});
module.exports = newAbonentScene;
