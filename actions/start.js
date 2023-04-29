const { bot } = require("../core/bot");
const { Composer } = require("telegraf");
const { messages } = require("../lib/messages");
const { keyboards } = require("../lib/keyboards");
const { Abonent } = require("../models/YangiAbonent");
const { Admin } = require("../models/Admin");
const { Picture } = require("../models/Picture");
const composer = new Composer();

composer.start(async (ctx) => {
  if (ctx.startPayload) {
    if (ctx.startPayload.split("_")[0] == "guvohnoma") {
      return ctx.reply("Hali bir qarorga kelmadim");
    }
    if (ctx.startPayload.split("_")[0] == "picture") {
      const admin = await Admin.findOne({ user_id: ctx.from.id });
      if (admin) {
        const confirm =
          ctx.startPayload.split("_")[1] == "accept"
            ? "TASDIQLANDI"
            : "BEKOR QILINDI";
        const id = ctx.startPayload.split("_")[2];
        const pic = await Picture.findById(id);
        console.log(ctx.update);
        await pic
          .updateOne({
            $set: { confirm },
          })
          .then(() => {
            console.log(pic.messageIdChannel);
            ctx.telegram
              .editMessageCaption(
                process.env.CHANNEL,
                pic.messageIdChannel,
                0,
                `${
                  confirm == "TASDIQLANDI" ? "✅✅✅" : "❌❌❌"
                }\nFuqoro rasmi #rasm \n\n<code>${pic.kod}</code>`,
                { parse_mode: "HTML" }
              )
              .then(() => {
                if (confirm == "TASDIQLANDI") {
                  return ctx.telegram.sendPhoto(
                    pic.user_id,
                    pic.photo_file_id,
                    {
                      caption: messages.lotin.acceptedPicture,
                    }
                  );
                } else {
                  return ctx.telegram.sendPhoto(
                    pic.user_id,
                    pic.photo_file_id,
                    {
                      caption: messages.lotin.canceledPicture,
                    }
                  );
                }
              });
          });
      } else {
        return ctx.reply(
          messages[ctx.session.til].youAreNotAdmin,
          keyboards[ctx.session.til].mainKeyboard.resize()
        );
      }
    } else {
      const abenent = await Abonent.findById(ctx.startPayload)
        .then(async () => {
          const admin = await Admin.findOne({ user_id: ctx.from.id });
          if (admin) {
            ctx.session.abonent_id = ctx.startPayload;
            ctx.scene.enter("answer_to_inspector");
          } else {
            ctx.reply(
              messages[ctx.session.til].youAreNotAdmin,
              keyboards[ctx.session.til].mainKeyboard.resize()
            );
          }
        })
        .catch((err) => {
          console.log(err);
          ctx.reply(messages[ctx.session.til].notFoundData);
        });
    }
  } else {
    const admin = await Admin.findOne({ user_id: ctx.from.id });
    if (admin) {
      // Admin dashboard
      ctx.reply(
        messages[ctx.session.til].heyAdmin,
        keyboards[ctx.session.til].adminKeyboard.resize()
      );
    } else {
      ctx.reply(
        messages[ctx.session.til].startGreeting,
        keyboards[ctx.session.til].mainKeyboard.resize()
      );
    }
  }
});

bot.use(composer.middleware());
