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
const { createTozaMakonApi } = require("../../../api/tozaMakon");
const {
  extractBirthDateString,
} = require("../../../helpers/extractBirthDateFromPinfl");

const updateAbonentDatesByPinfl = new Scenes.WizardScene(
  "update_abonent_date_by_pinfil",
  async (ctx) => {
    try {
      ctx.wizard.state.reUpdating = false;
      const inspektor = await Nazoratchi.findOne({
        telegram_id: ctx.from.id,
        activ: true,
      });
      if (!inspektor) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
        );
        return ctx.scene.leave();
      }
      const company = await Company.findOne({ id: inspektor.companyId });
      const now = new Date();
      if (!company.active || company.activeExpiresDate < now) {
        await ctx.reply(
          "Dastur faoliyati vaqtincha cheklangan. \nIltimos, xizmatlardan foydalanishni davom ettirish uchun to‘lovni amalga oshiring."
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
      const abonents = await Abonent.find({
        licshet: new RegExp(ctx.message.text),
        companyId: inspektor.companyId,
      });
      if (abonents.length !== 1) {
        return ctx.reply(
          "Siz kiritgan hisob raqami bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.cancelBtn.resize()
        );
      }

      const abonent = abonents[0];
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
        if (
          customDates.message ==
          "Hozirda baza ishlamayapti, keyinroq boshqatdan urinib ko'ring"
        ) {
          const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.companyId);
          const birthdate = extractBirthDateString(ctx.message.text);
          const citizen = (
            await tozaMakonApi.get("/user-service/citizens", {
              params: {
                pinfl: ctx.message.text,
                birthdate,
              },
            })
          ).data;
          if (citizen) {
            customDates.success = true;
            customDates.last_name = citizen.lastName;
            customDates.first_name = citizen.firstName;
            customDates.middle_name = citizen.patronymic;
            customDates.birth_date = citizen.birthDate;
            customDates.isFromTozaMakon = true;
            customDates.passport_serial = citizen.passport.slice(0, 2);
            customDates.passport_number = citizen.passport.slice(2);
            customDates.photo = (
              await tozaMakonApi.get("/file-service/buckets/download", {
                params: {
                  file: citizen.photo,
                },
                responseType: "arraybuffer",
              })
            ).data;
          }
        } else {
          return ctx.reply(customDates.message, keyboards.cancelBtn.resize());
        }
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
      const buffer = customDates.isFromTozaMakon
        ? customDates.photo
        : Buffer.from(customDates.photo, "base64");
      await ctx.replyWithPhoto(
        { source: buffer },
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
          const buffer = customDates.isFromTozaMakon
            ? customDates.photo
            : Buffer.from(customDates.photo, "base64");
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
            { source: buffer },
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
          break;
        case "no":
          ctx.deleteMessage();
          await ctx.reply("Bekor qilindi. Demak PINFL raqami noto'g'ri ekan");
          ctx.scene.leave();
          break;
      }
    } catch (error) {
      ctx.reply("Xatolik kuzatildi, " + error.message, keyboards.cancelBtn);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message?.text) {
        ctx.reply("OK", keyboards.mainKeyboard.resize());
        ctx.scene.leave();
      }
      if (ctx.callbackQuery?.data) {
        try {
          await ctx.deleteMessage();
        } catch (error) {}
      }
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
    }
  }
);

updateAbonentDatesByPinfl.enter((ctx) => {
  ctx.reply(`Abonent shaxsiy raqamini kiriting`, keyboards.cancelBtn);
});

updateAbonentDatesByPinfl.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.mainKeyboard);
    return ctx.scene.leave();
  } else next();
});

module.exports = { updateAbonentDatesByPinfl };
