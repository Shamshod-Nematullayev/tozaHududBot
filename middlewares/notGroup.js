const { bot } = require("../core/bot");
const { Admin } = require("../models/Admin");
const { MultiplyRequest } = require("../models/MultiplyRequest");
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
  if (ctx.chat.id < 0 && !ctx.update.callback_query) {
    try {
      const admin = await Admin.findOne({ user_id: ctx.from.id });

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
    }
  } else {
    next();
  }
});
