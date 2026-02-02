import { Axios } from "axios";

interface Payload {
  mobile_phone: number; //998991234567
  message: string;
  from: 4546;
  callback_url: string; //Это необязательное поле, которое используется для автоматического получения смс-статуса с сервера. Укажите URL-адрес обратного вызова, по которому вы будете получать данные POST в следующем формате: {"request_id": "UUID", "message_id": "4385062", "user_sms_id": "vash_ID_zdes", "country": "UZ", "phone_number": "998991234567", "sms_count": "1", "status" : "DELIVRD", "status_date": "2021-04-02 00:39:36"}.
}

export async function sendSms(
  eskiz: Axios,
  payload: Payload
): Promise<Response> {
  return (await eskiz.post("/message/sms/send", payload)).data;
}
