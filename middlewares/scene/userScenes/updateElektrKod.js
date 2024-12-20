const { Scenes, Markup } = require("telegraf");
const { keyboards, createInlineKeyboard } = require("../../../lib/keyboards");
const { Abonent } = require("../../../models/Abonent");
const { Nazoratchi } = require("../../../models/Nazoratchi");
const { changeAbonentDates } = require("../../../requires");
const isCancel = require("../../smallFunctions/isCancel");
const { EtkKodRequest } = require("../../../models/EtkKodRequest");
const { tozaMakonApi } = require("../../../api/tozaMakon");

const caotoNames = [
  {
    title: "Qoradaryo TETK",
    caoto: 18214,
  },
  {
    title: "Xatirchi TETK",
    caoto: 12345, // to'g'ri variant qo'yiladi
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
          keyboards.lotin.cancelBtn.resize()
        );

      if (isNaN(ctx.message.text) || ctx.message.text.length !== 12) {
        return ctx.reply(
          "Litsavoy kod to'g'ri kiritilmadi",
          keyboards.lotin.cancelBtn.resize()
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
          keyboards.lotin.cancelBtn.resize()
        );
        return;
      }
      // =======================VAQTINCHA BILLING ISHLAGUNCHA
      const etkReq = await EtkKodRequest.findOne({
        licshet: ctx.wizard.state.KOD,
      });
      if (abonent.ekt_kod_tasdiqlandi?.confirm) {
        return ctx.reply(
          "Bu abonent ma'lumoti kiritilib bo'lingan",
          keyboards.lotin.cancelBtn.resize()
        );
      }
      await ctx.reply(
        `FIO: ${abonent.fio}\nElektr kodini bazaga kiriting:`,
        keyboards.lotin.cancelBtn.resize()
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
      if (isNaN(ctx.message.text)) {
        ctx.reply(
          "Error: ETK kod to'g'ri kiritilmadi",
          keyboards.lotin.cancelBtn.resize()
        );
        return;
      }
      const etk_abonents = require("../../../lib/etk_baza.json");
      const findedETKAbonents = etk_abonents.filter((a) => {
        return a.CUSTOMER_CODE == ctx.message.text;
      });
      if (!findedETKAbonents.length < 0) {
        ctx.reply(
          "Siz kiritgan ETK kod bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.lotin.cancelBtn.resize()
        );
        return;
      }
      if (findedETKAbonents.length > 1) {
        const buttons = [];
        findedETKAbonents.forEach((abonent) => {
          const caoto = caotoNames.find((c) => c.caoto == abonent.CAOTO);
          buttons.push([Markup.button.callback(caoto.title, abonent.caoto)]);
        });
        ctx.reply("Hududni tanlang", Markup.inlineKeyboard(buttons));
        ctx.wizard.state.findedETKAbonents = findedETKAbonents;
        ctx.wizard.state.ETK = ctx.message.text;
        ctx.wizard.selectStep(3);
        return;
      }
      const etk_abonent = findedETKAbonents[0];
      ctx.replyWithHTML(
        `Abonent: <code>${etk_abonent.CUSTOMER_NAME}</code> \nTelefon: <b>${etk_abonent.MOBILE_PHONE}</b>Ushbu abonentga shu hisob raqamni rostdan ham kiritaymi?`,
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
          etk_saoto: etkAbonent.CAOTO,
          phone: ctx.wizard.state.etk_abonent.MOBILE_PHONE,
          inspector_id: ctx.wizard.state.inspector_id,
          update_at: new Date(),
        });
        await tozaMakonApi.patch("/user-service/residents/" + abonent.id, {
          electricityAccountNumber: ctx.wizard.state.ETK,
          electricityCoato: etkAbonent.CAOTO,
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
        ctx.editMessageText(ctx.callbackQuery.message.text);
        ctx.replyWithHTML(
          `ETK kod qabul qilindi`,
          keyboards.lotin.mainKeyboard.resize()
        );
        return ctx.scene.leave();
      case "no":
        ctx.deleteMessage();
        ctx.reply("Bekor qilindi.", keyboards.lotin.mainKeyboard.resize());
        ctx.scene.leave();
        break;
    }
  },
  (ctx) => {
    try {
      const findedETKAbonents = ctx.wizard.state.findedETKAbonents;
      const etk_abonent = findedETKAbonents.find(
        (a) => a.CAOTO == ctx.update.callback_query.data
      );
      if (!etk_abonent) {
        ctx.reply("Xatolik");
        return ctx.scene.leave();
      }
      ctx.replyWithHTML(
        `Abonent: <code>${etk_abonent.CUSTOMER_NAME}</code> \nTelefon: <b>${etk_abonent.MOBILE_PHONE}</b>Ushbu abonentga shu hisob raqamni rostdan ham kiritaymi?`,
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
  }
);

updateElektrKod.enter(async (ctx) => {
  await ctx.reply("Abonent litsavoy kodini kiriting:");
});
updateElektrKod.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.lotin.mainKeyboard.resize());
    return ctx.scene.leave();
  } else next();
});

module.exports = { updateElektrKod };
