const { bot } = require("../core/bot");
const { messages } = require("../lib/messages");
const { Admin } = require("../models/Admin");
const { Guvohnoma } = require("../models/Guvohnoma");
const { MultiplyRequest } = require("../models/MultiplyRequest");
const { Counter } = require("../models/Counter");
const { Mahalla } = require("../models/Mahalla");

// bot.telegram.se
bot.use(async (ctx, next) => {
  if (
    ctx.message &&
    ctx.message.text === process.env.ADD_TG_GROUP_TOKEN &&
    process.env.ADD_TG_GROUP_TOKEN &&
    ctx.chat.id < 0
  ) {
    process.env.ADD_TG_GROUP_TOKEN = "";
    await Mahalla.findOneAndUpdate(
      { id: process.env.CURRENT_MFY_ID },
      {
        $push: {
          groups: {
            title: ctx.chat.title,
            id: ctx.chat.id,
          },
        },
      }
    ).then(() => {
      ctx.telegram.sendMessage(process.env.ADMIN_ID, `Telegram guruhi ulandi`);
    });
  }
  if (ctx.chat.id < 0) {
    try {
      const admin = await Admin.findOne({ user_id: ctx.from.id });
      if (
        ctx.update.callback_query &&
        ctx.update.callback_query.data == "ulim_guvohnomasini_qabul_qilish" &&
        admin
      ) {
        const file_id =
          ctx.callbackQuery.message.reply_markup.inline_keyboard[1][0].url
            .split("=")[1]
            .split("_")[1];
        await Counter.findOne({ name: "ulim_guvohnoma_document_number" }).then(
          async (counter) => {
            await Guvohnoma.findByIdAndUpdate(file_id, {
              $set: {
                holat: "QABUL_QILINDI",
                document_number: counter.value + 1,
              },
            }).then(async (guvohnoma) => {
              await counter.updateOne({
                $set: {
                  value: counter.value + 1,
                  last_update: Date.now(),
                },
              });
              ctx
                .editMessageCaption(
                  `<b>guvohnoma№_${
                    counter.value + 1
                  }</b> <a href="https://t.me/${guvohnoma.user.username}">${
                    guvohnoma.user.fullname
                  }</a>\n` +
                    `status: |<b> 🟡QABUL_QILINDI🟡 </b>|        #game_over\n` +
                    `<code>${guvohnoma.kod}</code>\n` +
                    `<i>${guvohnoma.comment}</i>\n` +
                    `✅✅✅ by <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
                  { parse_mode: "HTML", disable_web_page_preview: true }
                )
                .then(() => {
                  ctx.telegram
                    .sendPhoto(guvohnoma.user.id, guvohnoma.file_id, {
                      caption: `Siz yuborgan O'lim guvohnomasi operator tomonidan qabul qilindi. Tez orada sizga natijasini yetkazamiz\n\n№ <code>${
                        counter.value + 1
                      }</code>`,
                      parse_mode: "HTML",
                    })
                    .then(() => {
                      return ctx.answerCbQuery(messages.lotin.sended);
                    });
                });
            });
          }
        );
        return;
      }
      if (ctx.update.callback_query) {
        const doneCb = ctx.update.callback_query.data.match(/done_\w+/g)[0];

        if (doneCb && admin) {
          const req = await MultiplyRequest.findById(doneCb.split("_")[1]);
          await req
            .updateOne({
              $set: {
                confirm: true,
              },
            })
            .then(() => {
              ctx.telegram
                .sendMessage(
                  req.from.id,
                  `<code>${req.KOD}</code>\n ${req.YASHOVCHILAR} kishi \n ✅✅ Tasdiqlandi`,
                  { parse_mode: "HTML" }
                )
                .then(() => {
                  // ctx.answerCbQuery(messages.lotin.sended);
                  ctx.editMessageText(
                    `#yashovchisoni by <a href="https://t.me/${req.from.username}">${req.from.first_name}</a>\n<code>${req.KOD}</code>\n${req.YASHOVCHILAR} kishi \n✅✅✅ by <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
                    { parse_mode: "HTML", disable_web_page_preview: true }
                  );
                  ctx.telegram.forwardMessage(
                    process.env.NAZORATCHILAR_GURUPPASI,
                    process.env.CHANNEL,
                    ctx.callbackQuery.message.message_id
                  );
                });
            });
        }
      }
    } catch (error) {
      // Agar asliddin aka tushumni tashlasa

      console.log(error);
      if (
        ctx.message.from.id == 1694346147 ||
        (ctx.message.from.id == 955276498 && ctx.message.photo[1].file_id)
      ) {
        ctx.forwardMessage(process.env.NAZORATCHILAR_GURUPPASI);
      }
    }
  } else {
    next();
  }
});
