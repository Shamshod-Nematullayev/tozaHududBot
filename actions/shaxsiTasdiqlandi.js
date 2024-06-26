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
      const res = await changeAbonentDates({
        abonent_id: abonent.id,
        abo_data: {
          brith_date: `${kun}.${oy}.${yil}`,
          fio: `${req.data.details.surname_cyrillic} ${req.data.details.name_cyrillic} ${req.data.details.patronym_cyrillic}`,
          description: `${inspector.id} ${inspector.name} ma'lumotiga asosan o'zgartirildi.`,
          //   passport_location: req.data.photo,
          passport_number: `${req.data.passport_serial}-${req.data.passport_number}`,
          passport_expire_date: req.data.details.doc_end_date
            ? `${req.data.details.doc_end_date.split("-")[2]}.${
                req.data.details.doc_end_date.split("-")[1]
              }.${req.data.details.doc_end_date.split("-")[0]}`
            : undefined,
          pinfl: req.data.pinfl,
          passport_location: req.data.details.division,
        },
      });
      if (!res.success) {
        console.log(res);
        return ctx.answerCbQuery(res.msg);
      }
      //   mongodb ma'lumotlar bazada yangilanish
      await abonent.updateOne({
        $set: {
          brith_date: `${kun}.${oy}.${yil}`,
          fio: `${req.data.details.surname_cyrillic} ${req.data.details.name_cyrillic} ${req.data.details.patronym_cyrillic}`,
          description: `${inspector.id} ${inspector.name} ma'lumotiga asosan o'zgartirildi.`,
          photo: req.data.photo,
          passport_number: `${req.data.passport_serial}-${req.data.passport_number}`,
          passport_expire_date: req.data.details.doc_end_date
            ? `${req.data.details.doc_end_date.split("-")[2]}.${
                req.data.details.doc_end_date.split("-")[1]
              }.${req.data.details.doc_end_date.split("-")[0]}`
            : undefined,
          pinfl: req.data.pinfl,
          shaxsi_tasdiqlandi: {
            confirm: true,
            inspector: { name: inspector.name, _id: inspector._id },
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
        `KOD: ${req.licshet}\nFIO: ${req.data.details.surname_cyrillic} ${req.data.details.name_cyrillic} ${req.data.details.patronym_cyrillic} ${req.data.birth_date}\nInspector: <a href="https://t.me/${req.user.username}">${inspector.name}</a>\nTasdiqladi: <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
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
        `KOD: ${req.licshet}\nFIO: ${req.data.details.surname_cyrillic} ${req.data.details.name_cyrillic} ${req.data.details.patronym_cyrillic} ${req.data.birth_date}\nInspector: <a href="https://t.me/${req.user.username}">${inspector.name}</a>\nBekor qilindi: <a href="https://t.me/${ctx.from.username}">${ctx.from.first_name}</a>`,
        { parse_mode: "HTML" }
      );

      await ctx.deleteMessage();
    }
  } catch (error) {
    ctx.answerCbQuery("Xatolik kuzatildi");
    console.error(error);
  }
});

bot.use(composer);
