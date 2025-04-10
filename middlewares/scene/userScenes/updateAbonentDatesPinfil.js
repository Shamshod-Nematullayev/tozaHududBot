const { Scenes, Markup } = require("telegraf");
const { Abonent } = require("../../../models/Abonent");
const { Company } = require("../../../models/Company");
const isCancel = require("../../smallFunctions/isCancel");
const { messages } = require("../../../lib/messages");
const { keyboards, createInlineKeyboard } = require("../../../lib/keyboards");
const { find_one_by_pinfil_from_mvd } = require("../../../api/mvd-pinfil");
const isPinfl = require("../../smallFunctions/isPinfl");
const { CustomDataRequest } = require("../../../models/CustomDataRequest");
const { Nazoratchi } = require("../../../models/Nazoratchi");
const fs = require("fs");

const updateAbonentDatesByPinfl = new Scenes.WizardScene(
  "update_abonent_date_by_pinfil",
  async (ctx) => {
    try {
      ctx.wizard.state.reUpdating = false;
      const inspektor = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      if (!inspektor) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.inspector_id = inspektor._id;
      ctx.wizard.state.inspector_name = inspektor.name;
      ctx.wizard.state.companyId = inspektor.companyId;
      if (!ctx.message)
        return ctx.reply(
          "kutilgan ma'lumot kiritilmadi",
          keyboards.cancelBtn.resize()
        );
      if (ctx.message && isCancel(ctx.message.text)) {
        ctx.reply("Bekor qilindi");
        return ctx.scene.leave();
      }
      if (isNaN(ctx.message.text))
        return ctx.reply(
          messages.enterOnlyNumber,
          keyboards.cancelBtn.resize()
        );
      if (ctx.message.text.length != 12)
        return ctx.reply(
          messages.enterFullNamber,
          keyboards.cancelBtn.resize()
        );
      console.log(inspektor);
      const abonent = await Abonent.findOne({
        licshet: ctx.message.text,
        companyId: inspektor.companyId,
      });
      if (!abonent) {
        return ctx.reply(
          "Siz kiritgan hisob raqami bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.cancelBtn.resize()
        );
      }
      ctx.wizard.state.abonent = abonent;
      if (abonent.shaxsi_tasdiqlandi && abonent.shaxsi_tasdiqlandi.confirm) {
        ctx.reply(
          `Ushbu abonent ${
            abonent.shaxsi_tasdiqlandi.inspector?.name ||
            abonent.shaxsi_tasdiqlandi.inspector_name
          } tomonidan allaqachon shaxsi tasdiqlangan! Baribir o'zgartirmoqchimisiz?`,
          createInlineKeyboard([
            [
              ["Xa 👌", "yes"],
              ["Yo'q 🙅‍♂️", "no"],
            ],
          ])
        );
        ctx.wizard.selectStep(4);
        return;
      }
      ctx.replyWithHTML(
        `<b>${abonent.fio}</b>\n Pasport pinfil raqamini kiriting`
      );
      ctx.wizard.next();
    } catch (error) {
      console.error(error);
      ctx.reply("Xatolik kuzatildi, " + error.message, keyboards.cancelBtn);
    }
  },
  async (ctx) => {
    // pinfil validatsiyasi
    try {
      if (ctx.message && isCancel(ctx.message.text)) {
        ctx.reply("Bekor qilindi");
        return ctx.scene.leave();
      }
      if (!isPinfl(ctx.message.text)) {
        return ctx.replyWithPhoto(
          "https://scontent.fbhk1-4.fna.fbcdn.net/v/t39.30808-6/245114763_1689005674643325_574715679907072430_n.jpg?cstp=mx960x540&ctp=s960x540&_nc_cat=107&ccb=1-7&_nc_sid=833d8c&_nc_ohc=UuAJ9wX9hRUQ7kNvgFH6cIS&_nc_ht=scontent.fbhk1-4.fna&oh=00_AYBErDlZHdtXHYwOa1n9AicX7rhWP63Hkf8COiCnTKAlUw&oe=669E7F35",
          {
            caption: messages.enterReallyPinfl,
            reply_markup: keyboards.cancelBtn.resize().reply_markup,
          }
        );
      }
      // shaxsiy ma'lumotlarni olish
      const customDates = await find_one_by_pinfil_from_mvd(ctx.message.text);
      if (!customDates.success) {
        return ctx.reply(customDates.message, keyboards.cancelBtn.resize());
      }
      if (customDates.first_name == "" || customDates.success === false) {
        return ctx.reply(
          "Ushbu fuqoroga tegishli ma'lumotlar topilmadi. PINFL to'g'ri kiritilganmikan tekshirib qaytadan kiriting",
          keyboards.cancelBtn.resize().reply_markup
        ); // agarda ma'lumotlar topilmasa
      }
      ctx.wizard.state.pinfl = ctx.message.text;
      ctx.wizard.state.customDates = customDates;
      // nazoratchiga tasdiqlash uchun yuborish
      let filename = "./uploads/" + Date.now() + ".png";
      if (!customDates.photo) {
        filename = "./lib/personicon.png";
      }
      fs.writeFile(filename, customDates.photo, "base64", async (err) => {
        if (err) {
          console.log(customDates);
          throw err;
        }
        ctx.wizard.state.filename = filename;
        await ctx.replyWithPhoto(
          { source: filename },
          {
            caption: `<b>${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}</b> <i>${customDates.birth_date}</i>\n Siz shu kishini nazarda tutyapsizmi?`,
            reply_markup: createInlineKeyboard([
              [
                ["Xa 👌", "yes"],
                ["Yo'q 🙅‍♂️", "no"],
              ],
            ]).reply_markup,
            parse_mode: "HTML",
          }
        );
      });
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Xatolik kuzatildi, " + error.message, keyboards.cancelBtn);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      const customDates = ctx.wizard.state.customDates;
      if (ctx.message?.text)
        return await ctx.replyWithHTML(
          `<b>${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}</b> <i>${customDates.birth_date}</i>\n Siz shu kishini nazarda tutyapsizmi?`,
          createInlineKeyboard([
            [
              ["Xa 👌", "yes"],
              ["Yo'q 🙅‍♂️", "no"],
            ],
          ])
        );
      switch (ctx.callbackQuery?.data) {
        case "yes":
          await ctx.deleteMessage();
          const { ...data } = ctx.wizard.state.customDates;
          delete data.photo;
          const req = await CustomDataRequest.create({
            user: ctx.from,
            data: {
              ...data,
              pinfl: ctx.wizard.state.pinfl,
            },
            inspector_id: ctx.wizard.state.inspector_id,
            licshet: ctx.wizard.state.abonent.licshet,
            reUpdating: ctx.wizard.state.reUpdating,
            companyId: ctx.wizard.state.companyId,
          });
          let filename = ctx.wizard.state.filename;
          fs.writeFile(filename, customDates.photo, "base64", async (err) => {
            if (err) throw err;
            let text = `KOD: ${ctx.wizard.state.abonent.licshet}\nPasport: ${customDates.last_name} ${customDates.first_name} ${customDates.middle_name} ${customDates.birth_date}\nBilling: ${ctx.wizard.state.abonent.fio}\nInspector: <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`;
            if (ctx.wizard.state.reUpdating)
              text =
                "‼️<b>DIQQAT</b>‼️\nUshbu abonent ikkinchi marta shaxsi tasdiqlanmoqda\n" +
                text;

            const company = await Company.findOne({
              id: ctx.wizard.state.companyId,
            });
            await ctx.telegram.sendPhoto(
              company.CHANNEL_ID_SHAXSI_TASDIQLANDI,
              { source: filename },
              {
                caption: text,
                reply_markup: createInlineKeyboard([
                  [
                    ["✅✅", "shaxsitasdiqlandi_" + req._id + "_true"],
                    ["🙅‍♂️🙅‍♂️", "shaxsitasdiqlandi_" + req._id + "_false"],
                  ],
                ]).oneTime().reply_markup,
                parse_mode: "HTML",
              }
            );
            ctx.reply(
              "Rahmat 😇\nMa'lumotlar tizim adminiga o'rganish uchun yuborildi..\n Yana kiritishni hohlaysizmi? 🙂",
              createInlineKeyboard([[["Xa", "xa"]], [["Yo'q", "yoq"]]])
            );

            ctx.wizard.next();
          });
          break;
        case "no":
          await ctx.deleteMessage();
          ctx.reply("Bekor qilindi. Demak PINFL raqami noto'g'ri ekan");
          ctx.scene.leave();
          break;
      }
    } catch (error) {
      ctx.reply("Xatolik kuzatildi, " + error.message, keyboards.cancelBtn);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message?.text) {
        ctx.reply("OK", keyboards.mainKeyboard.resize());
        ctx.scene.leave();
      }
      if (ctx.callbackQuery?.data) await ctx.deleteMessage();
      switch (ctx.callbackQuery?.data) {
        case "xa":
          ctx.reply("Abonent shaxsiy raqamini kiriting!");
          ctx.wizard.selectStep(0);
          break;
        case "yoq":
          ctx.reply("OK", keyboards.mainKeyboard.resize());
          ctx.scene.leave();
          break;
      }
    } catch (error) {
      ctx.reply("Xatolik kuzatildi, " + error.message, keyboards.cancelBtn);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message?.text) {
        ctx.reply("OK", keyboards.mainKeyboard.resize());
        ctx.scene.leave();
      }
      if (ctx.callbackQuery?.data) await ctx.deleteMessage();
      if (ctx.callbackQuery.data === "yes") {
        ctx.wizard.state.reUpdating = true;
        ctx.replyWithHTML(
          `<b>${ctx.wizard.state.abonent.fio}</b>\n Pasport pinfil raqamini kiriting`
        );
        ctx.wizard.selectStep(1);
      } else {
        ctx.reply("OK", keyboards.mainKeyboard.resize());
        ctx.scene.leave();
      }
    } catch (error) {
      ctx.reply("Xatolik kuzatildi, " + error.message, keyboards.cancelBtn);
      console.error(error);
    }
  }
);

updateAbonentDatesByPinfl.enter((ctx) => {
  ctx.reply(`Abonent shaxsiy raqamini kiriting`);
});

updateAbonentDatesByPinfl.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.mainKeyboard);
    return ctx.scene.leave();
  } else next();
});

module.exports = { updateAbonentDatesByPinfl };
