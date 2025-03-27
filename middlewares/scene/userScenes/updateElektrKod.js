const { Scenes, Markup } = require("telegraf");
const { keyboards, createInlineKeyboard } = require("../../../lib/keyboards");
const { Abonent } = require("../../../models/Abonent");
const { Nazoratchi } = require("../../../models/Nazoratchi");
const isCancel = require("../../smallFunctions/isCancel");
const { EtkKodRequest } = require("../../../models/EtkKodRequest");
const { tozaMakonApi } = require("../../../api/tozaMakon");
const { EtkAbonent } = require("../../../models/EtkAbonent");
const { default: axios } = require("axios");

const caotoNames = [
  {
    title: "Qoradaryo TETK",
    caoto: 18214,
    region: 18,
  },
  {
    title: "Xatirchi TETK",
    caoto: 12251,
    region: 12,
  },
  {
    title: "Kattaqo'rg'on TETK",
    caoto: 18215,
    region: 18,
  },
];

const updateElektrKod = new Scenes.WizardScene(
  "updateElektrKod",
  async (ctx) => {
    try {
      // bad request errors
      if (!ctx.message)
        return ctx.reply(
          "Kutilgan amal bajarilmadi",
          keyboards.cancelBtn.resize()
        );

      if (isNaN(ctx.message.text) || ctx.message.text.length !== 12) {
        return ctx.reply(
          "Litsavoy kod to'g'ri kiritilmadi",
          keyboards.cancelBtn.resize()
        );
      }
      const inspektor = await Nazoratchi.findOne({ telegram_id: ctx.from.id });
      if (!inspektor) {
        ctx.reply(
          "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.inspector_id = inspektor.id;
      ctx.wizard.state.inspector_name = inspektor.name;

      ctx.wizard.state.KOD = ctx.message.text;
      const abonent = await Abonent.findOne({ licshet: ctx.wizard.state.KOD });
      ctx.wizard.state.abonent = abonent;
      if (!abonent) {
        ctx.reply(
          "Siz kiritgan litsavoy kod bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.cancelBtn.resize()
        );
        return;
      }
      // =======================VAQTINCHA BILLING ISHLAGUNCHA
      await EtkKodRequest.findOne({
        licshet: ctx.wizard.state.KOD,
      });
      if (abonent.ekt_kod_tasdiqlandi?.confirm) {
        await ctx.reply(
          `Bu abonent ma'lumoti ${
            abonent.ekt_kod_tasdiqlandi.inspector_name ||
            abonent.ekt_kod_tasdiqlandi.inspector?.name
          } tomonidan kiritilib bo'lingan. Baribir kiritmoqchimisiz?`,
          keyboards.yesOrNo
        );
        ctx.wizard.selectStep(4);
        return;
      }
      await ctx.reply(
        `FIO: ${abonent.fio}\nElektr kodini bazaga kiriting:`,
        keyboards.cancelBtn.resize()
      );
      ctx.wizard.next();
    } catch (error) {
      (error) => {
        ctx.reply("Error: " + error.message);
        console.error(error);
      };
    }
  },
  async (ctx) => {
    try {
      if (isNaN(ctx.message?.text)) {
        ctx.reply(
          "Error: ETK kod to'g'ri kiritilmadi",
          keyboards.cancelBtn.resize()
        );
        return;
      }
      const findedETKAbonents = await EtkAbonent.find({
        accountNumber: ctx.message.text,
      });
      if (!findedETKAbonents[0]) {
        for (let caoto of caotoNames) {
          const { data } = await axios.post(
            "https://api-e3abced5.payme.uz/api/cheque.create",
            {
              method: "cheque.create",
              params: {
                amount: 50000,
                merchant_id: "5a5dffd8687ee421a5c4b0e6",
                account: {
                  account: ctx.message.text,
                  region: caoto.region,
                  subRegion: caoto.caoto,
                },
              },
            }
          );

          if (!data.error) {
            findedETKAbonents.push({
              caotoNumber: caoto.caoto,
              accountNumber: ctx.message.text,
              customerName: data.result.cheque.account.find(
                (row) => row.name == "fio"
              ).value,
            });
          }
        }
      }
      if (!findedETKAbonents[0]) {
        ctx.reply(
          "Siz kiritgan ETK kod bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.cancelBtn.resize()
        );
        return;
      }
      if (findedETKAbonents.length > 1) {
        const buttons = [];
        findedETKAbonents.forEach((abonent) => {
          const caoto = caotoNames.find((c) => c.caoto == abonent.caotoNumber);
          buttons.push(
            Markup.button.callback(caoto.title, abonent.caotoNumber)
          );
        });
        ctx.reply("Hududni tanlang", Markup.inlineKeyboard(buttons));
        ctx.wizard.state.findedETKAbonents = findedETKAbonents;
        ctx.wizard.state.ETK = ctx.message.text;
        ctx.wizard.selectStep(3);
        return;
      }
      const etk_abonent = findedETKAbonents[0];
      if (!etk_abonent) {
        ctx.reply("Bunday elektr kodi topilmadi");
        return;
      }
      await ctx.replyWithHTML(
        `Abonent: <code>${etk_abonent.customerName}</code> \nUshbu abonentga shu hisob raqamni rostdan ham kiritaymi?`,
        createInlineKeyboard([
          [
            ["Xa 👌", "yes"],
            ["Yo'q 🙅‍♂️", "no"],
          ],
        ])
      );
      ctx.wizard.state.ETK = ctx.message.text;
      ctx.wizard.state.etk_abonent = etk_abonent;
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Error: " + error.message);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (ctx.message?.text) {
        ctx.reply("OK");
        ctx.scene.leave();
      }
      switch (ctx.callbackQuery?.data) {
        case "yes":
          const abonent = ctx.wizard.state.abonent;
          const etkAbonent = ctx.wizard.state.etk_abonent;
          await EtkKodRequest.create({
            licshet: abonent.licshet,
            abonent_id: abonent.id,
            etk_kod: ctx.wizard.state.ETK,
            etk_saoto: etkAbonent.caotoNumber,
            inspector_id: ctx.wizard.state.inspector_id,
            update_at: new Date(),
          });
          await tozaMakonApi.patch("/user-service/residents/" + abonent.id, {
            electricityAccountNumber: ctx.wizard.state.ETK,
            electricityCoato: etkAbonent.caotoNumber,
            id: abonent.id,
          });
          await Abonent.findByIdAndUpdate(abonent._id, {
            $set: {
              ekt_kod_tasdiqlandi: {
                confirm: true,
                inspector_id: ctx.wizard.state.inspector_id,
                inspector_name: ctx.wizard.state.inspector_name,
                updated_at: new Date(),
              },
              energy_licshet: ctx.wizard.state.ETK,
            },
          });
          await ctx.editMessageText(ctx.callbackQuery.message.text);
          await ctx.replyWithHTML(
            `ETK kod qabul qilindi`,
            keyboards.mainKeyboard.resize()
          );
          return ctx.scene.leave();
        case "no":
          await ctx.deleteMessage();
          ctx.reply("Bekor qilindi.", keyboards.mainKeyboard.resize());
          ctx.scene.leave();
          break;
      }
    } catch (error) {
      ctx.reply("Error: " + error.message);
      console.error(error);
    }
  },
  (ctx) => {
    try {
      const findedETKAbonents = ctx.wizard.state.findedETKAbonents;
      const etk_abonent = findedETKAbonents.find(
        (a) => a.caotoNumber == ctx.update.callback_query.data
      );
      if (!etk_abonent) {
        ctx.reply("Xatolik");
        return ctx.scene.leave();
      }
      ctx.replyWithHTML(
        `Abonent: <code>${etk_abonent.customerName}</code> \nUshbu abonentga shu hisob raqamni rostdan ham kiritaymi?`,
        createInlineKeyboard([
          [
            ["Xa 👌", "yes"],
            ["Yo'q 🙅‍♂️", "no"],
          ],
        ])
      );
      ctx.wizard.state.etk_abonent = etk_abonent;
      ctx.wizard.selectStep(2);
    } catch (error) {
      console.error(error);
      ctx.reply("Error: " + error.message);
    }
  },
  async (ctx) => {
    try {
      if (ctx.callbackQuery.data === "yes") {
        await ctx.deleteMessage();
        await ctx.reply(
          `FIO: ${ctx.wizard.state.abonent.fio}\nElektr kodini bazaga kiriting:`
        );
        ctx.wizard.selectStep(1);
        return;
      } else if (ctx.callbackQuery.data === "no") {
        await ctx.deleteMessage();
      }
      await ctx.reply("Asosiy menyu", keyboards.mainKeyboard);
      ctx.scene.leave();
    } catch (error) {
      console.error(error);
      ctx.reply("Xatolik kuzatildi, " + error.message, keyboards.cancelBtn);
    }
  }
);

updateElektrKod.enter(async (ctx) => {
  await ctx.reply("Abonent litsavoy kodini kiriting:");
});
updateElektrKod.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.mainKeyboard.resize());
    return ctx.scene.leave();
  } else next();
});

module.exports = { updateElektrKod };
