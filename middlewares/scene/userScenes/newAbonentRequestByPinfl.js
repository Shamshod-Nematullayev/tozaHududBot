const { Scenes, Markup } = require("telegraf");
const { find_one_by_pinfil_from_mvd } = require("../../../api/mvd-pinfil");
const fs = require("fs");
const isCancel = require("../../smallFunctions/isCancel");
const isPinfl = require("../../smallFunctions/isPinfl");
const { CleanCitySession } = require("../../../models/CleanCitySession");
const { kirillga } = require("../../smallFunctions/lotinKiril");
const { yangiAbonent } = require("../adminActions/cleancity/dxsh/yangiAbonent");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { Abonent } = require("../../../models/Abonent");
const { Nazoratchi } = require("../../../models/Nazoratchi");
const cc = "https://cleancity.uz/";

const enterFunc = (ctx) => {
  ctx.reply("Fuqoro pinfl raqamini kiriting");
};
const new_abonent_request_by_pinfl_scene = new Scenes.WizardScene(
  "new_abonent_request",
  async (ctx) => {
    try {
      const inspektor = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      if (!inspektor) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.inspektor = inspektor;
      if (ctx.message && isCancel(ctx.message.text)) return ctx.scene.leave();
      if (!isPinfl(ctx.message.text)) {
        ctx.replyWithPhoto(
          "https://scontent.fbhk1-4.fna.fbcdn.net/v/t39.30808-6/245114763_1689005674643325_574715679907072430_n.jpg?cstp=mx960x540&ctp=s960x540&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=UuAJ9wX9hRUQ7kNvgFH6cIS&_nc_ht=scontent.fbhk1-4.fna&oh=00_AYBErDlZHdtXHYwOa1n9AicX7rhWP63Hkf8COiCnTKAlUw&oe=669E7F35",
          {
            caption: messages.enterReallyPinfl,
            reply_markup: keyboards.lotin.cancelBtn.resize().reply_markup,
          }
        );
      } else {
        const abonent = await Abonent.findOne({
          pinfl: parseInt(ctx.message.text),
        });
        if (abonent) {
          if (abonent.mahallas_id != 60364) {
            return ctx.reply(
              `Ushbu abonentga ${abonent.licshet} hisob raqami ochilgan`
            );
          }
        }

        const customDates = await find_one_by_pinfil_from_mvd(ctx.message.text);
        if (!customDates.success) {
          return ctx.reply(
            customDates.message,
            keyboards.lotin.cancelBtn.resize()
          );
        }
        let filename = "fuqoro" + Date.now() + ".png";

        await ctx.reply(
          `${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}`
        );
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
        // if(streets.msg === "Session has expired") return
        streets = streets.rows;
        let keyboardsArray = [];
        for (let i = 0; i < streets.length; i++) {
          const street = streets[i];
          keyboardsArray.push([Markup.button.callback(street.name, street.id)]);
        }
        ctx.deleteMessage();
        console.log(keyboardsArray);
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
        ctx.replyWithHTML(
          `Yangi abonent qo'shildi <code>${abonent.litschet}</code>`
        );
        // await Abonent.create({user: ctx.from, data: })
        await ctx.telegram.sendMessage(
          process.env.NAZORATCHILAR_GURUPPASI,
          `${ctx.wizard.state.inspektor.name} тизимга янги абонент киритди 👍 <code>${abonent.litschet}</code>`,
          { parse_mode: "HTML" }
        );
        ctx.scene.leave();
      } else {
        ctx.reply(abonent.msg);
      }
    } catch (error) {
      console.log(error);
    }
  }
);
new_abonent_request_by_pinfl_scene.leave((ctx) =>
  ctx.reply("Bekor qilindi", keyboards.lotin.mainKeyboard.resize())
);
new_abonent_request_by_pinfl_scene.enter(enterFunc);

module.exports = { new_abonent_request_by_pinfl_scene };
