import { ISmsWarning, SmsWarning } from '@models/SmsWarning.js';
import { Axios } from 'axios';
import { Types } from 'mongoose';

interface Payload {
  mobile_phone: number; //998991234567
  message: string;
  from: 4546 | number;
  callback_url: string; //Это необязательное поле, которое используется для автоматического получения смс-статуса с сервера. Укажите URL-адрес обратного вызова, по которому вы будете получать данные POST в следующем формате: {"request_id": "UUID", "message_id": "4385062", "user_sms_id": "vash_ID_zdes", "country": "UZ", "phone_number": "998991234567", "sms_count": "1", "status" : "DELIVRD", "status_date": "2021-04-02 00:39:36"}.
}

interface ResponseEskiz {
  id: string;
  message: string;
  status: string;
}

export async function sendSms(eskiz: Axios, payload: Payload): Promise<ResponseEskiz> {
  return (await eskiz.post('/message/sms/send', payload)).data;
}

interface PayloadSmsWarning {
  accountNumber: string;
  residentId: number;
  debtDate: string;
  debtAmount: number;
  phone: number; //998991234567
  companyPhone: string;
  companyId: number;
}

export async function sendSmsWarning(
  eskiz: Axios,
  { accountNumber, residentId, debtDate, debtAmount, phone, companyPhone, companyId }: PayloadSmsWarning
): Promise<
  ISmsWarning & {
    _id: Types.ObjectId;
  }
> {
  // const message = `Xurmatli abonent, ${accountNumber} chiqindi hisob raqamingizda ${debtDate} holatiga ${debtAmount.toLocaleString()} so'm qarz mavjud. Qarzdorlik 5 kun ichida bartaraf etilmagan taqdirda elektr hisob raqamingizga cheklov o'rnatiladi. Tel: ${companyPhone}`;
  const message = `Sizning telefon raqamingiz ${accountNumber} chiqindi hisob raqamiga sms xabarlari uchun ulandi`;

  const payload: Payload = {
    mobile_phone: phone,
    message,
    from: 4546,
    callback_url: `https://greenzone.uz/api/sms-service/callback-eskiz?secret=${process.env.ESKIZ_LONG_TOKEN}`,
  };
  const sms = await sendSms(eskiz, payload);
  const smsWarning = await SmsWarning.create({
    accountNumber,
    companyId,
    createdAt: new Date(),
    phone,
    messageId: sms.id,
    debtAmount,
    status: 'pending',
    message,
    residentId,
    smsProvider: 'eskiz',
  });

  return smsWarning.toObject();
}
