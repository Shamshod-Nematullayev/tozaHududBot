const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");
const { MultiplyRequest } = require("../../../models/MultiplyRequest");
const isCancel = require("../../smallFunctions/isCancel");
const { Abonent } = require("../../../models/Abonent");
const { tozaMakonApi } = require("../../../api/tozaMakon");

const multiplyLivingsScene = new Scenes.WizardScene(
  "multiply_livings",
  async (ctx) => {
    try {
      // validate
      if (ctx.message.text.length != 12)
        return ctx.reply(
          messages.enterFullNamber,
          keyboards[ctx.session.til].cancelBtn.resize()
        );
      // main logic
      const abonent = await Abonent.findOne({ licshet: ctx.message.text });
      if (!abonent) {
        return ctx.reply(messages.abonentNotFound);
      }
      const request = await MultiplyRequest.findOne({ KOD: ctx.message.text });
      if (request) {
        return ctx.reply(
          `Ushbu abonent yashovchi sonini ko'paytirish uchun allaqachon so'rov yuborilgan   `
        );
      }
      // fuqaro arizasi Davr: 10.2021 - 11.2024, Summa: 128108 Davr: 06.2021 - 01.2024, Summa: 92858 Davr: 04.2024 - 07.2024, Summa: 18496 Umumiy yig'indisi: 239462
      ctx.wizard.state.abonent = {
        id: abonent.id,
        fio: abonent.fio,
        mahalla_name: abonent.mahalla_name,
        mfy_id: abonent.mahallas_id,
      };
      ctx.wizard.state.KOD = ctx.message.text;
      ctx.replyWithHTML(
        `<b>${abonent.fio}</b> ${abonent.mahalla_name} MFY\n` +
          messages.enterYashovchiSoni,
        keyboards[ctx.session.til].cancelBtn.resize()
      );
      ctx.wizard.next();
    } catch (error) {
      console.error(error);
      ctx.reply("Xatolik");
    }
  },
  async (ctx) => {
    try {
      const abonentData = (
        await tozaMakonApi.get(
          "/user-service/residents/" + ctx.wizard.state.abonent.id
        )
      ).data;
      if (abonentData.house.inhabitantCnt >= parseInt(ctx.message.text))
        return ctx.reply("yashovchi soni joriy holatdan koʻra katta emas!");

      ctx.scene.state.YASHOVCHILAR = parseInt(ctx.message.text);
      const { abonent, ...states } = ctx.wizard.state;
      const request = new MultiplyRequest({
        ...states,
        date: Date.now(),
        from: ctx.from,
        abonentId: abonent.id,
        mahallaId: abonent.mfy_id,
        fio: abonent.fio,
        mahallaName: abonent.mahalla_name,
      });
      await request.save();
      ctx.reply(messages.accepted);
      ctx.scene.leave();
    } catch (error) {
      console.log(error);
    }
  }
);
multiplyLivingsScene.enter((ctx) => {
  ctx.reply(
    messages.enterAbonentKod,
    keyboards[ctx.session.til].cancelBtn.resize()
  );
});
multiplyLivingsScene.on("text", (ctx, next) => {
  if (isCancel(ctx.message?.text)) {
    ctx.scene.leave();
    return;
  }
  if (isNaN(ctx.message.text)) {
    return ctx.reply(messages.enterYashovchiSoni, keyboards.cancelBtn);
  }
  next();
});
multiplyLivingsScene.leave((ctx) => {
  ctx.reply(
    messages.startGreeting,
    keyboards[ctx.session.til].mainKeyboard.resize()
  );
});

module.exports = { multiplyLivingsScene };
