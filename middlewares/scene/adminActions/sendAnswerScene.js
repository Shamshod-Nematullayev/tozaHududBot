const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Abonent } = require("../../../models/YangiAbonent");
const isCancel = require("../../smallFunctions/isCancel");
const qaysiMahalla = require("../../smallFunctions/qaysiMahalla");

const sendAnswerScene = new Scenes.WizardScene(
  "answer_to_inspector",
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) {
        ctx.reply(
          messages.ogohlantirishKiriting,
          keyboards[ctx.session.til].adminAnswerKeyboard.resize()
        );
        return ctx.wizard.next();
      } else if (ctx.message && ctx.message.text == "Chiqish") {
        return ctx.scene.leave();
      }
      await Abonent.findByIdAndUpdate(ctx.session.abonent_id, {
        $set: { kod: ctx.message.text },
      })
        .then((res) => {
          ctx.telegram
            .sendMessage(
              res.user.id,
              `Siz yuborgan abonentga kod ochildi.\n <b>${
                res.data.FISH
              }</b>  ${qaysiMahalla(res.data.MFY_ID)} \n \n <code>${
                ctx.message.text
              }</code>`,
              {
                parse_mode: "HTML",
              }
            )
            .then(() => {
              ctx.reply(messages.sended).then(async () => {
                const state = res.data;
                await ctx.telegram.editMessageText(
                  process.env.CHANNEL,
                  res.messageIdChannel,
                  0,
                  `<a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>\n` +
                    `status: |✅BAJARILDI✅|\n` +
                    `<b>${state.FISH}</b>\n` +
                    `mahalla: ${qaysiMahalla(state.MFY_ID)}\n` +
                    `kod: <code>${ctx.message.text}</code> \npowered by <a href="https://t.me/oliy_ong">Oliy_Ong</a>`,
                  {
                    reply_markup: null,
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                  }
                );
                await ctx.telegram.forwardMessage(
                  process.env.NAZORATCHILAR_GURUPPASI,
                  process.env.CHANNEL,
                  res.messageIdChannel
                );
                ctx.scene.leave();
              });
            });
        })
        .catch(() => {
          ctx.reply(
            messages.kodOchilmadi,
            keyboards[ctx.session.til].cancelBtn.resize()
          );
        });
    } catch (error) {
      console.log(error);
    }
  },
  async (ctx) => {
    if (ctx.message && ctx.message.text == "Chiqish") {
      return ctx.scene.leave();
    }
    await Abonent.findByIdAndUpdate(ctx.session.abonent_id, {
      $set: { isCancel: true },
    })
      .then((res) => {
        ctx.reply(messages.sended);
        ctx.telegram
          .sendMessage(
            res.user.id,
            `Siz yuborgan abonent bekor qilindi ⛔️\n <b>${
              res.data.FISH
            }</b>  ${qaysiMahalla(res.data.MFY_ID)} \n \n Asos:  ${
              ctx.message.text
            }`,
            {
              parse_mode: "HTML",
            }
          )
          .then(() => {
            const state = res.data;
            ctx.telegram
              .editMessageText(
                process.env.CHANNEL,
                res.messageIdChannel,
                0,
                `<a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>\n` +
                  `<a href="https://t.me/${res.user.username}">${res.user.nikName}</a> tizimga kiritgan \nstatus: |⛔️BEKOR QILINDI⛔️|\n` +
                  `<b>${state.FISH}</b>\n` +
                  `mahalla: ${qaysiMahalla(state.MFY_ID)}\n` +
                  `\npowered by <a href="https://t.me/oliy_ong">Oliy_Ong</a>`,
                {
                  reply_markup: null,
                  parse_mode: "HTML",
                  disable_web_page_preview: true,
                }
              )
              .then(() => {
                return ctx.scene.leave();
              });
          });
      })
      .catch((err) => {
        return ctx.reply(messages.errorOccured);
      });
  }
);

sendAnswerScene.enter((ctx) => {
  ctx.reply(
    messages.enterAbonentKod,
    keyboards[ctx.session.til].adminAnswerKeyboard.resize()
  );
});

sendAnswerScene.leave((ctx) => {
  ctx.reply(
    messages[ctx.session.til ? ctx.session.til : "lotin"].heyAdmin,
    keyboards[
      ctx.session.til ? ctx.session.til : "lotin"
    ].adminKeyboard.resize()
  );
});

module.exports = sendAnswerScene;
