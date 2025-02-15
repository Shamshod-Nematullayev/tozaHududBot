const { tozaMakonApi } = require("../api/tozaMakon");
const {
  Composer,
  bot,
  CustomDataRequest,
  Nazoratchi,
  changeAbonentDates,
  Abonent,
} = require("../requires");

const composer = new Composer();

composer.action(/shaxsitasdiqlandi_/g, async (ctx) => {
  try {
    // kerakli ma'lumotlarni tayyorlash
    const [_, _id, tasdiqlandi] = ctx.callbackQuery.data.split("_");
    const req = await CustomDataRequest.findById(_id);
    const inspector = await Nazoratchi.findById(req.inspector_id);

    // Tasdiqlangan bo'lsa
    if (JSON.parse(tasdiqlandi)) {
      const abonent = await Abonent.findOne({ licshet: req.licshet });
      const [yil, oy, kun] = req.data.birth_date.split("-");
      if (abonent.shaxsi_tasdiqlandi && abonent.shaxsi_tasdiqlandi.confirm) {
        return ctx.answerCbQuery("Bu abonent ma'lumoti kiritilib bo'lingan");
      }
      //   billingga yangilov so'rovini yuborish
      const pasportData = await tozaMakonApi.get("/user-service/citizens", {
        params: {
          passport: req.data.passport_serial + req.data.passport_number,
          pinfl: req.data.pinfl,
          birthdate: req.data.birth_date,
        },
      });
      if (pasportData.data.code) {
        return ctx.answerCbQuery(pasportData.data.message);
      }
      const abonentDatasResponse = await tozaMakonApi.get(
        `/user-service/residents/${abonent.id}?include=translates`
      );
      if (!abonentDatasResponse || abonentDatasResponse.status !== 200) {
        return ctx.answerCbQuery(
          "Abonent dastlabki ma'lumotlarini oliishda xatolik"
        );
      }
      const data = abonentDatasResponse.data;
      const updateResponse = await tozaMakonApi.put(
        "/user-service/residents/" + abonent.id,
        {
          id: abonent.id,
          accountNumber: abonent.licshet,
          residentType: "INDIVIDUAL",
          electricityAccountNumber: data.electricityAccountNumber,
          electricityCoato: data.electricityCoato,
          companyId: data.companyId,
          streetId: data.streetId,
          mahallaId: data.mahallaId,
          contractNumber: data.contractNumber,
          contractDate: data.contractDate,
          homePhone: null,
          active: data.active,
          description: `${inspector.id} ${inspector.name} ma'lumotiga asosan shaxsi tasdiqlandi o'zgartirildi.`,
          citizen: pasportData.data,
          house: {
            ...data.house,
            cadastralNumber: data.house.cadastralNumber
              ? data.house.cadastralNumber
              : "00:00:00:00:00:0000:0000",
          },
        }
      );
      if (!updateResponse || updateResponse.status !== 200) {
        return ctx.answerCbQuery("Ma'lumotlarni yangilashda xatolik");
      }
      await tozaMakonApi.patch("/user-service/residents/identified", {
        identified: true,
        residentIds: [abonent.id],
      });

      //   mongodb ma'lumotlar bazada yangilanish
      await abonent.updateOne({
        $set: {
          brith_date: `${kun}.${oy}.${yil}`,
          fio: `${req.data.last_name} ${req.data.first_name} ${req.data.middle_name}`,
          description: `${inspector.id} ${inspector.name} ma'lumotiga asosan o'zgartirildi.`,
          photo: req.data.photo,
          passport_number: `${req.data.passport_serial}${req.data.passport_number}`,
          passport_expire_date: req.data.details.doc_end_date
            ? `${req.data.details.doc_end_date.split("-")[2]}.${
                req.data.details.doc_end_date.split("-")[1]
              }.${req.data.details.doc_end_date.split("-")[0]}`
            : undefined,
          pinfl: req.data.pinfl,
          shaxsi_tasdiqlandi: {
            confirm: true,
            inspector: { name: inspector.name, _id: inspector._id },
            updated_at: new Date(),
          },
        },
      });
      //   tizimga kiritgan nazoratchiga baho berish
      await inspector.updateOne({
        $set: {
          shaxs_tasdiqlash_ball: Number(inspector.shaxs_tasdiqlash_ball) + 1,
        },
      });
      //   requestni o'chirib yuborish
      await req.deleteOne();
      //   telegram kanaldagi postni yangilash
      await ctx.telegram.editMessageCaption(
        process.env.CHANNEL_ID_SHAXSI_TASDIQLANDI,
        ctx.update.callback_query.message.message_id,
        0,
        `KOD: ${req.licshet}\nFIO: ${req.data.last_name} ${req.data.first_name} ${req.data.middle_name} ${req.data.birth_date}\nInspector: <a href="https://t.me/${req.user.username}">${inspector.name}</a>\nTasdiqladi: <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
        { parse_mode: "HTML" }
      );
      await ctx.deleteMessage();
      //   tizimga kiritgan nazoratchiga javob yo'llash
      await ctx.telegram.sendMessage(
        req.user.id,
        `Tabriklaymiz 🥳🥳 Siz yuborgan pasport ma'lumot qabul qilindi. <b>${
          req.licshet
        }</b> \nPasport: ${req.data.last_name} ${req.data.first_name} ${
          req.data.middle_name
        } ${
          req.data.birth_date
        }\n 1 ballni qo'lga kiritdingiz. \n Jami to'plagan ballaringiz: <b>${
          Number(inspector.shaxs_tasdiqlash_ball) + 1
        }</b>`,
        { parse_mode: "HTML" }
      );
      //   adminga amaliyot tugagani haqida xabar yuborish status: 200
    } else {
      // kiritilgan ma'lumot noto'g'ri deb topilganida
      // so'rovni o'chirib yuborish
      await CustomDataRequest.findByIdAndDelete(_id);
      // nazoratchiga xabar yuborish
      await ctx.telegram.sendMessage(
        req.user.id,
        `Siz yuborgan pasport ma'lumot bekor qilindi. <b>${req.licshet}</b> \nPasport: ${req.data.last_name} ${req.data.first_name} ${req.data.middle_name} ${req.data.birth_date}`
      );
      // telegram kanaldagi xabarni o'zgartirish
      await ctx.editMessageCaption(
        `KOD: ${req.licshet}\nFIO: ${req.data.last_name} ${req.data.first_name} ${req.data.middle_name} ${req.data.birth_date}\nInspector: <a href="https://t.me/${req.user.username}">${inspector.name}</a>\nBekor qilindi: <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
        { parse_mode: "HTML" }
      );

      await ctx.deleteMessage();
    }
  } catch (error) {
    try {
      ctx.answerCbQuery("Xatolik kuzatildi");
    } catch (error) {
      console.error(error);
    }
    console.error(error);
  }
});

bot.use(composer);
