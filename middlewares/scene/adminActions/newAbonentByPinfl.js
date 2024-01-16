const { Scenes, Markup } = require("telegraf");
const { find_one_by_pinfil_from_mvd } = require("../../../api/mvd-pinfil");
const fs = require("fs");
const isCancel = require("../../smallFunctions/isCancel");
const isPinfl = require("../../smallFunctions/isPinfl");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { log } = require("console");
const { CleanCitySession } = require("../../../models/CleanCitySession");
const { kirillga } = require("../../smallFunctions/lotinKiril");
const { yangiAbonent } = require("./cleancity/dxsh/yangiAbonent");
const cc = "https://cleancity.uz/";

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
            caption: messages.enterReallyPinfl,
            reply_markup: keyboards.lotin.cancelBtn.resize().reply_markup,
          }
        );
      } else {
        const customDates = await find_one_by_pinfil_from_mvd(ctx.message.text);
        if (customDates.first_name == "" || customDates.success === false) {
          return ctx.reply("Ushbu fuqoroga tegishli ma'lumotlar topilmadi");
        }
        if (customDates.photo != null) {
          fs.writeFile(
            "custom.png",
            customDates.photo,
            "base64",
            async (err) => {
              if (err) throw err;

              await ctx.replyWithPhoto(
                { source: "custom.png" },
                {
                  caption: `${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}`,
                }
              );
              return;
              await ctx.reply(
                "Mahallasini tanlang",
                keyboards.lotin.mahallalar.oneTime()
              );

              ctx.wizard.state.customDates = {
                fullname: kirillga(
                  `${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}`
                ),
                pinfl: ctx.message.text,
                ...customDates,
              };
              ctx.wizard.next();
            }
          );
        } else {
          await ctx.reply(
            `${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}`
          );
          return;
          await ctx.reply(
            "Mahallasini tanlang",
            keyboards.lotin.mahallalar.oneTime()
          );
          ctx.wizard.state.customDates = {
            fullname: kirillga(
              `${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}`
            ),
            pinfl: ctx.message.text,
            ...customDates,
          };
          ctx.wizard.next();
        }
      }
    } catch (error) {
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      const session = await CleanCitySession.findOne({ type: "dxsh" });
      const data = ctx.update.callback_query.data;
      if (data.split("_")[0] != "mahalla") {
        ctx.reply(
          "Mahallani tanlamadingiz",
          keyboards.lotin.cancelBtn.resize()
        );
      } else {
        let streets = await fetch(cc + "ds?DAO=StreetsDAO&ACTION=GETLISTALL", {
          method: "POST",
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: session.cookie,
          },
          body: `mahallas_id=${data.split("_")[1]}`,
        });
        streets = await streets.json();
        streets = streets.rows;
        let keyboardsArray = [];
        for (let i = 0; i < streets.length; i++) {
          const street = streets[i];
          keyboardsArray.push([Markup.button.callback(street.name, street.id)]);
        }
        ctx.deleteMessage();
        await ctx.reply(
          "Ko'chani tanlang",
          Markup.inlineKeyboard(keyboardsArray).oneTime()
        );
        ctx.wizard.state.mfy_id = data.split("_")[1];
        ctx.wizard.next();
      }
    } catch (error) {
      ctx.reply(
        "Kutilgan amal bajarilmadi",
        keyboards.lotin.cancelBtn.resize()
      );
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      ctx.wizard.state.street_id = ctx.update.callback_query.data;
      ctx.deleteMessage();
      ctx.reply(
        "Yashovchi yoki kiriting",
        Markup.keyboard([
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
        ])
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply(
        "Kutilgan amal bajarilmadi",
        keyboards.lotin.cancelBtn.resize()
      );
      console.log(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (isNaN(ctx.message.text))
        return ctx.reply(
          "Yashovchi sonini raqamda kiritish kerak",
          keyboards.lotin.cancelBtn.resize()
        );
      ctx.wizard.state.yashovchilarSoni = parseInt(ctx.message.text);
      const abonent = await yangiAbonent({
        mfy_id: ctx.wizard.state.mfy_id,
        fish: ctx.wizard.state.customDates.fullname,
        street_id: ctx.wizard.state.street_id,
        yashovchi_soni: ctx.message.text,
        kadastr_number: null,
        passport_number: `${ctx.wizard.state.customDates.passport_serial}-${ctx.wizard.state.customDates.passport_number}`,
        pinfl: ctx.wizard.state.customDates.pinfl,
      });

      if (abonent.success) {
        ctx.reply(`Yangi abonent qo'shildi <code>${abonent.litschet}</code>`, {
          parse_mode: "HTML",
        });
      } else {
        ctx.reply(abonent.msg);
      }
      ctx.scene.leave();
    } catch (error) {
      console.log(error);
    }
  }
);
new_abonent_by_pinfl_scene.leave((ctx) =>
  ctx.reply("Bekor qilindi", keyboards.lotin.adminKeyboard.resize())
);
new_abonent_by_pinfl_scene.enter(enterFunc);

module.exports = { new_abonent_by_pinfl_scene };
