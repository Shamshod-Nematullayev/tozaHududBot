const { Scenes, Markup } = require("telegraf");
const { keyboards } = require("../../../requires");
const isCancel = require("../../smallFunctions/isCancel");
const { Nazoratchi } = require("../../../models/Nazoratchi");
const { Abonent } = require("../../../models/Abonent");
const { CleanCitySession } = require("../../../models/CleanCitySession");
const { changeAbonentDates } = require("../../../requires");
const cc = "https://cleancity.uz/";

const changeAbonentStreet = new Scenes.WizardScene(
  "changeAbonentStreet",
  async (ctx) => {
    try {
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
      const abonent = await Abonent.findOne({ licshet: ctx.message.text });
      ctx.wizard.state.abonent = abonent;
      if (!abonent) {
        ctx.reply(
          "Siz kiritgan litsavoy kod bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting",
          keyboards.lotin.cancelBtn.resize()
        );
        return;
      }
      if (abonent.street_tasdiqlandi?.confirm) {
        return ctx.reply(
          "Bu abonent ma'lumoti kiritilib bo'lingan",
          keyboards.lotin.cancelBtn.resize()
        );
      }
      const session = await CleanCitySession.findOne({ type: "dxsh" });
      let streets = await fetch(cc + "ds?DAO=StreetsDAO&ACTION=GETLISTALL", {
        method: "POST",
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: session.cookie,
        },
        body: `mahallas_id=${abonent.mahallas_id}`,
      });
      streets = await streets.json();
      //   if(streets.msg === "Session has expired") return
      streets = streets.rows;
      let keyboardsArray = [];
      ctx.wizard.state.streets = streets;
      for (let i = 0; i < streets.length; i++) {
        const street = streets[i];
        keyboardsArray.push([Markup.button.callback(street.name, street.id)]);
      }
      await ctx.reply(
        "Ko'cha yoki qishloqni tanlang",
        Markup.inlineKeyboard(keyboardsArray).oneTime()
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply("Xatolik kuzatildi", keyboards.lotin.cancelBtn.resize());
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (!ctx.callbackQuery) return ctx.scene.leave();
      const street = ctx.wizard.state.streets.find(
        (street) => street.id == ctx.callbackQuery.data
      );
      if (!street) {
        ctx.reply(
          "Xatolik kuzatildi " + error.message,
          keyboards.lotin.cancelBtn.resize()
        );
        return ctx.scene.leave();
      }
      const abonent = ctx.wizard.state.abonent;
      const res = await changeAbonentDates({
        abonent_id: abonent.id,
        abo_data: {
          description: `${ctx.wizard.state.inspector_id} ${ctx.wizard.state.inspector_name} ma'lumotiga asosan ko'cha/qishloq ma'lumoti o'zgartirildi.`,
          streets_id: street.id,
        },
      });
      if (!res.success) {
        console.error(res);
        return ctx.answerCbQuery(res.msg);
      }

      await Abonent.findByIdAndUpdate(abonent._id, {
        $set: {
          street_tasdiqlandi: {
            confirm: true,
            inspector_id: ctx.wizard.state.inspector_id,
            inspector_name: ctx.wizard.state.inspector_name,
          },
          streets_id: Number(street.id),
          streets_name: street.name,
        },
      });
      await ctx.deleteMessage();
      ctx.reply(
        "Ko'cha/qishloq muvaffaqqiyatli kiritildi",
        keyboards.lotin.mainKeyboard.resize()
      );
      ctx.scene.leave();
    } catch (error) {
      ctx.reply(
        "Xatolik kuzatildi " + error.message,
        keyboards.lotin.cancelBtn.resize()
      );
      console.error(error);
    }
  }
);

changeAbonentStreet.on("text", (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    ctx.reply("Bekor qilindi", keyboards.lotin.mainKeyboard);
    return ctx.scene.leave();
  }
  next();
});

changeAbonentStreet.enter((ctx) => {
  ctx.reply(
    "Abonent litsavoy hisob raqamini kiriting",
    keyboards.lotin.cancelBtn
  );
});

module.exports = { changeAbonentStreet };
