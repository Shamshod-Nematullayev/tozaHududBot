import { Scenes } from 'telegraf';

import { createInlineKeyboard, keyboards } from '@lib/keyboards.js';

import { messages } from '@lib/messages.js';

import isCancel from '../../smallFunctions/isCancel.js';
import { Abonent } from '@models/Abonent.js';

import { Nazoratchi } from '@models/Nazoratchi.js';

import { createTozaMakonApi } from '@api/tozaMakon.js';
import { updateAbonentDetails } from '@services/billing/updateAbonentDetails.js';
import { WizardWithState } from '@bot/helpers/WizardWithState.js';
import { isCallbackQueryMessage, isTextMessage } from '../utils/validator.js';
import { changePhone } from '@services/billing/changePhone.js';

interface MyWizardState {
  inspector_id?: string;
  inspector_name?: string;
  fio?: string;
  accountNumber?: string;
  abonent_id?: number;
  companyId?: number;
  mahalla_name?: string;
  phone?: string;
}
type Ctx = WizardWithState<MyWizardState>;

export const connectPhoneNumber = new Scenes.WizardScene<Ctx>(
  'connect_phone_number',
  async (ctx) => {
    try {
      if (!isTextMessage(ctx)) return ctx.reply(messages.enterOnlyNumber, keyboards.cancelBtn.resize());
      if (isNaN(Number(ctx.message?.text))) return ctx.reply(messages.enterOnlyNumber, keyboards.cancelBtn.resize());
      if (ctx.message.text.length < 6)
        return ctx.reply("Chiqindi kodi kamida 6 ta raqam bo'lishi kerak", keyboards.cancelBtn.resize());

      const inspektor = await Nazoratchi.findOne({ telegram_id: ctx.from?.id });
      if (!inspektor) {
        ctx.reply('Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!');
        return ctx.scene.leave();
      }
      ctx.wizard.state.inspector_id = inspektor.id;
      ctx.wizard.state.inspector_name = inspektor.name;
      ctx.wizard.state.companyId = inspektor.companyId;

      const abonent = await Abonent.findOne({
        licshet: new RegExp(ctx.message.text),
        companyId: inspektor.companyId,
      });
      if (!abonent) {
        await ctx.reply(messages.abonentNotFound);
        return ctx.scene.leave();
      }
      ctx.wizard.state.accountNumber = ctx.message.text;
      ctx.wizard.state.abonent_id = abonent.id;
      ctx.wizard.state.fio = abonent.fio;
      ctx.wizard.state.mahalla_name = abonent.mahalla_name;

      if (!abonent.shaxsi_tasdiqlandi?.confirm) {
        await ctx.reply('🛑 Ushbu abonent shaxsi tasdiqlanmagan, avval shaxsini tasdiqlang! 🛑');
        return ctx.scene.leave();
      }

      ctx.wizard.state.accountNumber = abonent.licshet;
      ctx.wizard.state.abonent_id = abonent.id;
      if (abonent.phone_tasdiqlandi?.confirm) {
        ctx.wizard.selectStep(2);
        ctx.reply(
          `🛑 Ushbu hisob raqamiga ${abonent.phone_tasdiqlandi.inspector_name} tomonidan allaqachon telefon raqami biriktirilgan <b>${abonent.phone}</b>. Baribir o'zgartirmoqchimisiz?`,
          {
            reply_markup: createInlineKeyboard([
              [['Xa', 'yes']],
              [["Yo'q", 'no']],
              [['Mazkur raqamni qayta biriktirish', 'new']],
            ]).reply_markup,
            parse_mode: 'HTML',
          }
        );
        ctx.wizard.state.phone = abonent.phone;
        return;
      }
      await ctx.replyWithHTML(
        `<b>${abonent.fio}</b> ${abonent.mahalla_name} MFY\n` + `Telefon raqamini kiriting misol: 992852536`,
        keyboards.cancelBtn.resize()
      );
      ctx.wizard.next();
    } catch (error) {
      ctx.reply(`Xatolik kuzatildi`, keyboards.cancelBtn);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (!isTextMessage(ctx))
        return ctx.reply('Telefon raqam noto`g`ri formatda yuborildi. misol: 992852536', keyboards.cancelBtn.resize());
      if (ctx.message.text.length != 9 || isNaN(Number(ctx.message.text))) {
        return ctx.reply(`Telefon raqam noto'g'ri formatda yuborildi. misol: 992852536`);
      }
      if (ctx.message.text.startsWith('33') || ctx.message.text.startsWith('70')) {
        return ctx.reply(`(33 va 70) Humans abonentlari qabul qilinmaydi`);
      }
      const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.companyId as number);
      await changePhone(tozaMakonApi, {
        phoneNumber: ctx.message.text,
        residentId: ctx.wizard.state.abonent_id as number,
      });

      await Abonent.updateOne(
        {
          licshet: ctx.wizard.state.accountNumber,
          companyId: ctx.wizard.state.companyId,
        },
        {
          $set: {
            phone: ctx.message.text,
            phone_tasdiqlandi: {
              confirm: true,
              inspector_id: ctx.wizard.state.inspector_id,
              inspector_name: ctx.wizard.state.inspector_name,
              updated_at: new Date(),
            },
          },
        }
      );
      await ctx.reply(`Muvaffaqqiyatli bajarildi ✅`);
      return ctx.scene.leave();
    } catch (error) {
      ctx.reply(`Xatolik kuzatildi`, keyboards.cancelBtn);
      console.error(error);
    }
  },
  async (ctx) => {
    try {
      if (!isCallbackQueryMessage(ctx)) return;
      if (ctx.callbackQuery.data === 'yes') {
        await ctx.deleteMessage();
        ctx.wizard.selectStep(1);
        return await ctx.replyWithHTML(
          `<b>${ctx.wizard.state.fio}</b> ${ctx.wizard.state.mahalla_name}\n` +
            `Telefon raqamini kiriting misol: 992852536`,
          keyboards.cancelBtn.resize()
        );
      } else if (ctx.callbackQuery.data === 'no') {
        await ctx.deleteMessage();
      } else if (ctx.callbackQuery.data === 'new') {
        await ctx.deleteMessage();
        const tozaMakonApi = createTozaMakonApi(ctx.wizard.state.companyId as number);
        await changePhone(tozaMakonApi, {
          phoneNumber: ctx.wizard.state.phone as string,
          residentId: ctx.wizard.state.abonent_id as number,
        });

        await Abonent.updateOne(
          {
            licshet: ctx.wizard.state.accountNumber,
            companyId: ctx.wizard.state.companyId,
          },
          {
            $set: {
              phone: ctx.wizard.state.phone,
              phone_tasdiqlandi: {
                confirm: true,
                inspector_id: ctx.wizard.state.inspector_id,
                inspector_name: ctx.wizard.state.inspector_name,
                updated_at: new Date(),
              },
            },
          }
        );
        await ctx.reply(`Muvaffaqqiyatli bajarildi ✅`);
      }
      ctx.scene.leave();
    } catch (error) {
      ctx.reply(`Xatolik kuzatildi`, keyboards.cancelBtn);
      console.error(error);
    }
  }
);

connectPhoneNumber.on('text', async (ctx, next) => {
  if (isCancel(ctx.message.text)) {
    await ctx.reply('Bekor qilindi');
    ctx.scene.leave();
    return;
  }
  next();
});
connectPhoneNumber.enter((ctx) => {
  ctx.reply(`Abonent listavoy kodini kiriting`, keyboards.cancelBtn.resize());
});
connectPhoneNumber.leave((ctx) => {
  ctx.reply(messages.startGreeting, keyboards.mainKeyboard.resize());
});
