import { createTozaMakonApi } from '@api/tozaMakon.js';
import { Abonent } from '@models/Abonent.js';
import { Company } from '@models/Company.js';
import { ICustomDataRequestDoc } from '@models/CustomDataRequest.js';
import { Nazoratchi } from '@models/Nazoratchi.js';
import { getCitizen, updateAbonentDetails, searchAbonent } from '@services/billing/index.js';
import { Context } from 'telegraf';
import { tryDeleteOrEditMessage } from './tryDeleteOrEditMessage.js';
import { tryToIdentify } from '@services/billing/tryToIdentify.js';
import { formatDate } from '@services/utils/formatDate.js';

function getPassportGivenDate(docEndDate: string | undefined): Date {
  if (!docEndDate) return new Date();
  const [yil, oy, kun] = docEndDate.split('-').map(Number);
  return new Date(yil - 10, oy - 1, kun);
}

export default async function handleApproveRequest(ctx: Context, req: ICustomDataRequestDoc) {
  // validation and get varibles
  const abonent = await Abonent.findOne({ licshet: req.licshet });
  if (!abonent) return await ctx.answerCbQuery('Abonent topilmadi');
  if (abonent.shaxsi_tasdiqlandi && abonent.shaxsi_tasdiqlandi.confirm && !req.reUpdating) {
    return await ctx.answerCbQuery("Bu abonent ma'lumoti kiritilib bo'lingan");
  }
  const inspector = await Nazoratchi.findById(req.inspector_id);
  if (!inspector) return await ctx.answerCbQuery('Nazoratchi topilmadi');
  const company = await Company.findOne({ id: req.companyId });
  if (!company) return await ctx.answerCbQuery('Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!');
  const tozaMakonApi = createTozaMakonApi(req.companyId);

  //   ma'lumotlarni tayyorlash
  // const [yil, oy, kun] = req.data.birth_date.split("-");
  const citizen = await getCitizen(tozaMakonApi, {
    passport: req.data.passport_serial + req.data.passport_number,
    birthdate: req.data.birth_date,
    pinfl: req.data.pinfl,
  });

  //   billingga yangilov so'rovini yuborish
  const passportGivenDate = getPassportGivenDate(req.data.details?.doc_end_date);
  await updateAbonentDetails(tozaMakonApi, abonent.id, {
    citizen: {
      birthDate: req.data.birth_date,
      firstName: req.data.first_name,
      foreignCitizen: citizen.foreignCitizen || false,
      lastName: req.data.last_name,
      email: citizen.email || null,
      inn: citizen.inn || null,
      pnfl: req.data.pinfl,
      patronymic: req.data.middle_name,
      passport: req.data.passport_serial + req.data.passport_number,
      passportGivenDate: formatDate(passportGivenDate),
      passportIssuer: req.data.details?.division || 'IIB',
      passportExpireDate: req.data.details?.doc_end_date || formatDate(new Date()),
      photo: citizen.photo || null,
    },
    description: `${inspector.id} ${inspector.name} ma'lumotiga asosan o'zgartirildi.`,
  });

  // identifikatsiyadan o'tkazish
  let resident = (
    await searchAbonent(tozaMakonApi, {
      accountNumber: abonent.licshet,
      companyId: abonent.companyId,
      districtId: company.districtId,
      size: 10,
    })
  ).content[0];
  if (!resident.identified)
    try {
      tryToIdentify(tozaMakonApi, resident, abonent.companyId);
    } catch (error) {}

  //   mongodb ma'lumotlar bazada yangilanish
  await abonent.updateOne({
    $set: {
      fio: `${req.data.last_name} ${req.data.first_name} ${req.data.middle_name}`,
      description: `${inspector.id} ${inspector.name} ma'lumotiga asosan o'zgartirildi.`,
      passport_number: `${req.data.passport_serial}${req.data.passport_number}`,
      pinfl: req.data.pinfl,
      shaxsi_tasdiqlandi: {
        confirm: true,
        inspector: { name: inspector.name, _id: inspector._id },
        inspector_id: inspector.id,
        inspector_name: inspector.name,
        updated_at: new Date(),
      },
    },
    $push: {
      shaxsi_tasdiqlandi_history: {
        ...abonent.shaxsi_tasdiqlandi,
        fullName: abonent.fio,
        pinfl: abonent.pinfl,
        inspector: {
          _id: abonent.shaxsi_tasdiqlandi?.inspector_id,
          name: abonent.shaxsi_tasdiqlandi?.inspector_name,
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
    `Tabriklaymiz 🥳🥳 Siz yuborgan pasport ma'lumot qabul qilindi. <b>${req.licshet}</b> \nPasport: ${
      req.data.last_name
    } ${req.data.first_name} ${req.data.middle_name} ${
      req.data.birth_date
    }\n 1 ballni qo'lga kiritdingiz. \n Jami to'plagan ballaringiz: <b>${
      Number(inspector.shaxs_tasdiqlash_ball) + 1
    }</b>`,
    { parse_mode: 'HTML' }
  );
  //   adminga amaliyot tugagani haqida xabar yuborish status: 200
  await ctx.answerCbQuery("✅ Ma'lumot qabul qilindi.");
}
