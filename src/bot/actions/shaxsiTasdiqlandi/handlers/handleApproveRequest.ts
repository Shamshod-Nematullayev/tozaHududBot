import { createTozaMakonApi } from "@api/tozaMakon";
import { Abonent } from "@models/Abonent";
import { Company } from "@models/Company";
import { ICustomDataRequestDoc } from "@models/CustomDataRequest";
import { Nazoratchi } from "@models/Nazoratchi";
import { Context } from "telegraf";

export default async function handleApproveRequest(
  ctx: Context,
  req: ICustomDataRequestDoc
) {
  const abonent = await Abonent.findOne({ licshet: req.licshet });
  if (!abonent) return await ctx.answerCbQuery("Abonent topilmadi");
  const inspector = await Nazoratchi.findById(req.inspector_id);
  if (!inspector) return await ctx.answerCbQuery("Nazoratchi topilmadi");
  const company = await Company.findOne({ id: req.companyId });
  if (!company)
    return await ctx.answerCbQuery(
      "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
    );
  const [yil, oy, kun] = req.data.birth_date.split("-");
  if (
    abonent.shaxsi_tasdiqlandi &&
    abonent.shaxsi_tasdiqlandi.confirm &&
    !req.reUpdating
  ) {
    return await ctx.answerCbQuery("Bu abonent ma'lumoti kiritilib bo'lingan");
  }
  //   billingga yangilov so'rovini yuborish
  const tozaMakonApi = createTozaMakonApi(req.companyId);

  const pasportData = (
    await tozaMakonApi.get("/user-service/citizens", {
      params: {
        passport: req.data.passport_serial + req.data.passport_number,
        pinfl: req.data.pinfl,
      },
    })
  ).data;

  const data = (
    await tozaMakonApi.get(
      `/user-service/residents/${abonent.id}?include=translates`
    )
  ).data;

  // ma'lumotlarni yangilash
  await tozaMakonApi.put("/user-service/residents/" + abonent.id, {
    ...data,
    id: abonent.id,
    accountNumber: abonent.licshet,
    residentType: "INDIVIDUAL",
    homePhone: null,
    description: `${inspector.id} ${inspector.name} ma'lumotiga asosan shaxsi tasdiqlandi o'zgartirildi.`,
    citizen: {
      ...data.citizen,
      ...pasportData,
    },
    house: {
      ...data.house,
      cadastralNumber: data.house.cadastralNumber
        ? data.house.cadastralNumber
        : "00:00:00:00:00:0000:0000",
    },
  });
  // identifikatsiyadan o'tkazish
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
      passport_number: `${req.data.passport_serial}${req.data.passport_number}`,
      pinfl: req.data.pinfl,
      shaxsi_tasdiqlandi: {
        confirm: true,
        inspector: { name: inspector.name, _id: inspector._id },
        updated_at: new Date(),
      },
    },
    $push: {
      shaxsi_tasdiqlandi_history: {
        ...abonent.shaxsi_tasdiqlandi,
        fullName: abonent.fio,
        pinfl: abonent.pinfl,
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
  if (ctx.callbackQuery?.message) {
    const msgId = ctx.callbackQuery.message.message_id;
    ctx.telegram
      .deleteMessage(company.CHANNEL_ID_SHAXSI_TASDIQLANDI, msgId)
      .catch(() => {
        ctx.deleteMessage().catch(() => {
          ctx.telegram.editMessageCaption(
            company.CHANNEL_ID_SHAXSI_TASDIQLANDI,
            msgId,
            "0",
            `#delete KOD: ${req.licshet}\nFIO: ${req.data.last_name} ${req.data.first_name} ${req.data.middle_name} ${req.data.birth_date}\nInspector: <a href="https://t.me/${req.user.username}">${inspector.name}</a>\nTasdiqladi: <a href="https://t.me/${ctx.from?.username}">${ctx.from?.first_name}</a>`,
            { parse_mode: "HTML" }
          );
        });
      });
  }
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
}
