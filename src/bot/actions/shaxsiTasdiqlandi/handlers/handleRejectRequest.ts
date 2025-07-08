import { Company } from "@models/Company";
import {
  CustomDataRequest,
  ICustomDataRequestDoc,
} from "@models/CustomDataRequest";
import { Nazoratchi } from "@models/Nazoratchi";
import { Context } from "telegraf";

export default async function handleRejectRequest(
  ctx: Context,
  req: ICustomDataRequestDoc
) {
  const company = await Company.findOne({ id: req.companyId });
  if (!company) return ctx.answerCbQuery("Kompaniya topilmadi!");
  const inspector = await Nazoratchi.findById(req.inspector_id);
  if (!inspector) return ctx.answerCbQuery("Nazoratchi topilmadi");
  // so'rovni o'chirib yuborish
  await CustomDataRequest.findByIdAndDelete(req._id);
  // nazoratchiga xabar yuborish
  await ctx.telegram.sendMessage(
    req.user.id,
    `Siz yuborgan pasport ma'lumot bekor qilindi. <b>${req.licshet}</b> \nPasport: ${req.data.last_name} ${req.data.first_name} ${req.data.middle_name} ${req.data.birth_date}`,
    { parse_mode: "HTML" }
  );

  // o'chirish, o'chirish ishlamasa
  if (ctx.callbackQuery?.message) {
    ctx.telegram
      .deleteMessage(
        company.CHANNEL_ID_SHAXSI_TASDIQLANDI,
        ctx.callbackQuery.message.message_id
      )
      .catch(() => {
        ctx.deleteMessage().catch(() => {
          // telegram kanaldagi xabarni o'zgartirish
          ctx.editMessageCaption(
            `KOD: ${req.licshet}\nFIO: ${req.data.last_name} ${req.data.first_name} ${req.data.middle_name} ${req.data.birth_date}\nInspector: <a href="https://t.me/${req.user.username}">${inspector.name}</a>\nBekor qilindi: <a href="https://t.me/${ctx.from?.username}">${ctx.from?.first_name}</a>`,
            { parse_mode: "HTML" }
          );
        });
      });
  }
}
