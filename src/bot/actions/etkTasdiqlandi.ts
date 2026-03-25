import { createTozaMakonApi } from '@api/tozaMakon.js';
import { Abonent } from '@models/Abonent.js';
import { Company } from '@models/Company.js';
import { EtkKodRequest } from '@models/EtkKodRequest.js';
import { Nazoratchi } from '@models/Nazoratchi.js';
import { identificationAbonent } from '@services/billing/identificationAbonent.js';
import { updateAbonentDetails } from '@services/billing/updateAbonentDetails.js';
import { updateHetAccountNumber } from '@services/billing/updateHetAccountNumber.js';
import { Composer } from 'telegraf';
import { MyContext } from 'types/botContext.js';

const composer = new Composer<MyContext>();

// ================== QABUL QILISH =======================

composer.action(/etk_yes/, async (ctx) => {
  if (!('data' in ctx.callbackQuery)) return;

  const requestId = ctx.callbackQuery.data.split('_')[2];

  const request = await EtkKodRequest.findById(requestId);

  if (!request) return ctx.answerCbQuery("Xatolik: ETK tasdiqlash so'rovi topilmadi");

  const company = await Company.findOne({ id: request.companyId });
  if (!company || company.activeExpiresDate < new Date())
    return ctx.answerCbQuery("Dastur faoliyatini davom ettirish uchun to'lovni amalga oshiring");

  // svet kodini yangilash
  const tozaMakonApi = createTozaMakonApi(company.id);
  await updateHetAccountNumber(tozaMakonApi, {
    electricityAccountNumber: request.etk_kod,
    electricityCoato: request.etk_saoto,
    residentId: request.abonent_id,
  });

  // mongodbga kiritish
  await request.updateOne({
    $set: {
      status: 'tasdiqlandi',
    },
  });

  ctx.telegram.deleteMessage(company.CHANNEL_ID_SHAXSI_TASDIQLANDI, request.channelPostId).catch(() => {
    ctx.editMessageText('#delete');
  });

  await ctx.answerCbQuery('ETK tasdiqlandi');

  const nazoratchi = await Nazoratchi.findOne({ id: request.inspector_id });
  if (!nazoratchi) return ctx.answerCbQuery('Nazoratchi topilmadi');

  await ctx.telegram.sendMessage(
    company.GROUP_ID_NAZORATCHILAR,
    `${nazoratchi.name} sizning <code>${request.licshet}</code> hisob raqamiga kiritilgan ETK hisob raqami tasdiqlandi 👍`,
    { parse_mode: 'HTML' }
  );

  for (const id of nazoratchi.telegram_id) {
    ctx.telegram.sendMessage(
      id,
      `${nazoratchi.name} sizning <code>${request.licshet}</code> hisob raqamiga kiritilgan ETK hisob raqami tasdiqlandi 👍`,
      { parse_mode: 'HTML' }
    );
  }

  // mongodbda abonent ma'lumotini yangilash
  await Abonent.findOneAndUpdate(
    { id: request.abonent_id },
    {
      $set: {
        ekt_kod_tasdiqlandi: {
          confirm: true,
          inspector_id: request.inspector_id,
          inspector_name: nazoratchi.name,
          value: `${request.etk_saoto}-${request.etk_kod}`,
          updated_at: new Date(),
        },
      },
    }
  );
  if (typeof request.phone === 'string')
    await updateAbonentDetails(tozaMakonApi, request.abonent_id, {
      phone: request.phone.slice(3),
    });

  await identificationAbonent(tozaMakonApi, request.abonent_id, true);
});

// ================== BEKOR QILISH =======================

composer.action(/etk_no/, async (ctx) => {
  if (!('data' in ctx.callbackQuery)) return;

  const requestId = ctx.callbackQuery.data.split('_')[2];

  const request = await EtkKodRequest.findById(requestId);

  if (!request) return ctx.answerCbQuery("Xatolik: ETK tasdiqlash so'rovi topilmadi");

  await request.updateOne({
    $set: {
      status: 'bekor_qilindi',
    },
  });

  const company = await Company.findOne({ id: request.companyId });
  if (!company || company.activeExpiresDate < new Date())
    return ctx.answerCbQuery("Dastur faoliyatini davom ettirish uchun to'lovni amalga oshiring");

  ctx.telegram.deleteMessage(company.CHANNEL_ID_SHAXSI_TASDIQLANDI, request.channelPostId).catch(() => {
    ctx.editMessageText('#delete');
  });

  const nazoratchi = await Nazoratchi.findOne({ id: request.inspector_id });
  if (!nazoratchi) return ctx.answerCbQuery('Nazoratchi topilmadi');

  await ctx.telegram.sendMessage(
    company.GROUP_ID_NAZORATCHILAR,
    `${nazoratchi.name} sizning <code>${request.licshet}</code> hisob raqamiga kiritilgan ETK hisob raqami bekor qilindi 👎`,
    { parse_mode: 'HTML' }
  );

  for (const id of nazoratchi.telegram_id) {
    ctx.telegram.sendMessage(
      id,
      `${nazoratchi.name} sizning <code>${request.licshet}</code> hisob raqamiga kiritilgan ETK hisob raqami bekor qilindi 👎`,
      { parse_mode: 'HTML' }
    );
  }
  await ctx.answerCbQuery('ETK bekor qilindi');
});

export default composer;
