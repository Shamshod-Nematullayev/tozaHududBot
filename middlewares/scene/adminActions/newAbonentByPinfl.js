const { Scenes } = require("telegraf");
const { find_one_by_pinfil_from_mvd } = require("../../../api/mvd-pinfil");
const fs = require("fs");
const { isCancel } = require("axios");
const isPinfl = require("../../smallFunctions/isPinfl");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { log } = require("console");

const enterFunc = (ctx) => {
  ctx.reply("Fuqoro pinfl raqamini kiriting");
};
const new_abonent_by_pinfl_scene = new Scenes.WizardScene(
  "new_abonent",
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (!isPinfl(ctx.message.text)) {
        ctx.replyWithPhoto(
          "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DZjJS0SoXq6A&psig=AOvVaw1IOqLHD3CndpvLm1vqLwHJ&ust=1679216266118000&source=images&cd=vfe&ved=0CBAQjRxqFwoTCPDp6ZqO5f0CFQAAAAAdAAAAABAE",
          {
            caption: messages[ctx.session.til].enterReallyPinfl,
            reply_markup: keyboards.lotin.cancelBtn.resize().reply_markup,
          }
        );
      } else {
        const customDates = await find_one_by_pinfil_from_mvd(ctx.message.text);
        if (customDates.first_name == "") {
          return ctx.reply("Ushbu fuqoroga tegishli ma'lumotlar topilmadi");
        }
        log(customDates);
        if (customDates.photo != null) {
          fs.writeFile("custom.png", customDates.photo, "base64", (err) => {
            if (err) throw err;

            ctx.replyWithPhoto(
              { source: "custom.png" },
              {
                caption: `${customDates.first_name} ${customDates.last_name} ${customDates.middle_name}`,
              }
            );
          });
        } else {
          ctx.reply(
            `${customDates.first_name} ${customDates.last_name} ${customDates.middle_name}`
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
);
new_abonent_by_pinfl_scene.enter(enterFunc);

module.exports = { new_abonent_by_pinfl_scene };
