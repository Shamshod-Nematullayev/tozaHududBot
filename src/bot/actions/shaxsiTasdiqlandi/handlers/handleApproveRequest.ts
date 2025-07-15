import { createTozaMakonApi } from "@api/tozaMakon";
import { Abonent } from "@models/Abonent";
import { Company } from "@models/Company";
import { ICustomDataRequestDoc } from "@models/CustomDataRequest";
import { Nazoratchi } from "@models/Nazoratchi";
import {
  getCitizen,
  identificationAbonent,
  updateAbonentDetails,
  searchAbonent,
  getResidentHousesByPnfl,
} from "@services/billing";
import { Context } from "telegraf";
import { tryDeleteOrEditMessage } from "./tryDeleteOrEditMessage";
import { Axios, AxiosError } from "axios";
import { parseDublicateError } from "./dublicateParseResult";
import { tryIdentifiedOrReject } from "./tryIdentifiedOrReject";

export default async function handleApproveRequest(
  ctx: Context,
  req: ICustomDataRequestDoc
) {
  // validation and get varibles
  const abonent = await Abonent.findOne({ licshet: req.licshet });
  if (!abonent) return await ctx.answerCbQuery("Abonent topilmadi");
  if (
    abonent.shaxsi_tasdiqlandi &&
    abonent.shaxsi_tasdiqlandi.confirm &&
    !req.reUpdating
  ) {
    return await ctx.answerCbQuery("Bu abonent ma'lumoti kiritilib bo'lingan");
  }
  const inspector = await Nazoratchi.findById(req.inspector_id);
  if (!inspector) return await ctx.answerCbQuery("Nazoratchi topilmadi");
  const company = await Company.findOne({ id: req.companyId });
  if (!company)
    return await ctx.answerCbQuery(
      "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
    );
  const tozaMakonApi = createTozaMakonApi(req.companyId);

  //   ma'lumotlarni tayyorlash
  const [yil, oy, kun] = req.data.birth_date.split("-");
  const citizen = await getCitizen(tozaMakonApi, {
    passport: req.data.passport_serial + req.data.passport_number,
    birthDate: `${yil}-${oy}-${kun}`,
    pinfl: req.data.pinfl,
  });

  //   billingga yangilov so'rovini yuborish
  await updateAbonentDetails(tozaMakonApi, abonent.id, {
    citizen: citizen,
  });

  // identifikatsiyadan o'tkazish
  const result = await tryIdentifiedOrReject(req, abonent, tozaMakonApi);

  if (!result.success) {
    return await ctx.answerCbQuery(
      "Ma'lumotlar yangilandi, ammo identifikatsiya qilib bo'lmadi. Xatolik: " +
        result.errorMessage
    );
  }

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
        inspector: {
          _id: abonent.shaxsi_tasdiqlandi?.inspector?._id,
          name: abonent.shaxsi_tasdiqlandi?.inspector?.name,
        },
      },
    },
  });
  //   tizimga kiritgan nazoratchiga baho berish
  await inspector.updateOne({
    $set: {
      shaxs_tasdiqlash_ball: Number(inspector.shaxs_tasdiqlash_ball) + 1,
    },
  });

  //  kanaldagi xabarni o'chirish
  if (ctx.callbackQuery?.message)
    await tryDeleteOrEditMessage(
      ctx,
      company.CHANNEL_ID_SHAXSI_TASDIQLANDI,
      ctx.callbackQuery.message.message_id,
      `#delete KOD: ${req.licshet}\nFIO: ${req.data.last_name} ${req.data.first_name} ${req.data.middle_name} ${req.data.birth_date}
  Inspector: <a href="https://t.me/${req.user.username}">${inspector.name}</a>
  ⚠️ Bu xabarni Telegram tomonidan avtomatik o‘chirish imkoni bo‘lmadi. Iltimos, admin sifatida qo‘lda o‘chiring.`
    );

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
  await ctx.answerCbQuery("✅ Ma'lumot qabul qilindi.");
}
