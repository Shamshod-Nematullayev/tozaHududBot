import { Scenes } from 'telegraf';

import { keyboards } from '@lib/keyboards.js';

import { messages } from '@lib/messages.js';

import { MultiplyRequest } from '@models/MultiplyRequest.js';

import isCancel from '../../smallFunctions/isCancel.js';
import { Abonent } from '@models/Abonent.js';

import { createTozaMakonApi } from '@api/tozaMakon.js';

import { Nazoratchi } from '@models/Nazoratchi.js';
import { Company } from '@models/Company.js';
import { ErrorTypes } from '@bot/utils/errorHandler.js';
import { isTextMessage } from '../utils/validator.js';
import { WizardWithState } from '@bot/helpers/WizardWithState.js';
interface AbonentState {
  id: number;
  fio: string;
  mahalla_name: string;
  mfy_id: string | number;
  companyId: number;
  accountNumber: string;
}
interface MyWizardState {
  abonent?: AbonentState;
  inhabitantCount?: number;
}
type Ctx = WizardWithState<MyWizardState>;

export const multiplyLivingsScene = new Scenes.WizardScene<Ctx>(
  'multiply_livings',
  async (ctx) => {
    if (!isTextMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
    // validate
    const inspector = await Nazoratchi.findOne({
      activ: true,
      telegram_id: ctx.from?.id,
    });
    if (!inspector) {
      ctx.scene.leave();
      throw ErrorTypes.NO_ACCESS;
    }
    const company = await Company.findOne({ id: inspector.companyId });
    if (!company) throw 'Company not found';
    // main logic
    let abonents = await Abonent.find({
      licshet: new RegExp(ctx.message.text),
      companyId: company?.id,
    });
    if (abonents.length !== 1) {
      return ctx.reply("Siz kiritgan hisob raqami bo'yicha abonent ma'lumoti topilmadi. Tekshirib qaytadan kiriting");
    }
    const abonent = abonents[0];
    const request = await MultiplyRequest.findOne({
      KOD: ctx.message.text,
      companyId: company.id,
    });
    if (request) {
      return ctx.reply(`Ushbu abonent yashovchi sonini ko'paytirish uchun allaqachon so'rov yuborilgan   `);
    }
    ctx.wizard.state.abonent = {
      id: abonent.id,
      fio: abonent.fio,
      mahalla_name: abonent.mahalla_name || '',
      mfy_id: abonent.mahallas_id || '',
      companyId: abonent.companyId,
      accountNumber: abonent.licshet,
    };
    ctx.replyWithHTML(
      `<b>${abonent.fio}</b> ${abonent.mahalla_name} MFY\n` + messages.enterYashovchiSoni,
      keyboards.cancelBtn.resize()
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    const abonent = ctx.wizard.state.abonent as AbonentState;
    const tozaMakonApi = createTozaMakonApi(abonent.companyId);
    if (!isTextMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
    const abonentData = (await tozaMakonApi.get('/user-service/residents/' + abonent.id)).data;
    if (abonentData.house?.inhabitantCnt >= parseInt(ctx.message.text))
      return ctx.reply('yashovchi soni joriy holatdan koʻra katta emas!');

    ctx.wizard.state.inhabitantCount = parseInt(ctx.message.text);
    await MultiplyRequest.create({
      date: Date.now(),
      from: ctx.from,
      abonentId: abonent.id,
      mahallaId: abonent.mfy_id,
      fio: abonent.fio,
      mahallaName: abonent.mahalla_name,
      companyId: abonent.companyId,
      KOD: abonent.accountNumber,
      YASHOVCHILAR: ctx.wizard.state.inhabitantCount,
    });
    await ctx.reply(messages.accepted);
    ctx.scene.leave();
  }
);
multiplyLivingsScene.enter((ctx) => {
  ctx.reply(messages.enterAbonentKod, keyboards.cancelBtn.resize());
});
multiplyLivingsScene.on('text', (ctx, next) => {
  if (!isTextMessage(ctx)) throw ErrorTypes.BAD_REQUEST;
  if (isCancel(ctx.message?.text)) {
    ctx.scene.leave();
    return;
  }
  return next();
});
multiplyLivingsScene.leave((ctx) => {
  ctx.reply(messages.startGreeting, keyboards.mainKeyboard.resize());
});
