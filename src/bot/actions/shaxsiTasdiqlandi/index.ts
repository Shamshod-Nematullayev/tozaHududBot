import { Composer } from "telegraf";
import { CustomDataRequest } from "@models/CustomDataRequest.js";
import { Nazoratchi } from "@models/Nazoratchi.js";
import { Company } from "@models/Company.js";
import { Admin } from "@models/Admin.js";
import handleApproveRequest from "./handlers/handleApproveRequest.js";
import handleRejectRequest from "./handlers/handleRejectRequest.js";

const composer = new Composer();

composer.action(/shaxsitasdiqlandi_/g, async (ctx) => {
  try {
    // kerakli ma'lumotlarni tayyorlash
    if (!("data" in ctx.callbackQuery)) return;

    const [_, _id, tasdiqlandi] = ctx.callbackQuery.data.split("_");
    const req = await CustomDataRequest.findById(_id);
    if (!req) {
      await ctx.answerCbQuery("Shaxsini tasdiqlash so'rovi bazada topilmadi");
      return await ctx.deleteMessage();
    }
    const admin = await Admin.findOne({
      user_id: ctx.from.id,
      companyId: req.companyId,
    });
    if (!admin)
      return await ctx.answerCbQuery(
        "Amaliyotni bajarish uchun yetarli huquqga ega emassiz"
      );
    const company = await Company.findOne({ id: req.companyId });
    const now = new Date();
    const inspector = await Nazoratchi.findById(req.inspector_id);
    if (!inspector) return await ctx.answerCbQuery("Nazoratchi topilmadi");
    if (!company)
      return await ctx.answerCbQuery(
        "Siz ushbu amaliyotni bajarish uchun yetarli huquqga ega emassiz!"
      );
    if (!company.active || company.activeExpiresDate < now) {
      return await ctx.answerCbQuery(
        "Dastur faoliyati vaqtincha cheklangan. \nIltimos, xizmatlardan foydalanishni davom ettirish uchun to‘lovni amalga oshiring."
      );
    }

    if (tasdiqlandi === "true") {
      // Tasdiqlangan bo'lsa
      await handleApproveRequest(ctx, req);
    } else {
      await handleRejectRequest(ctx, req);
    }
  } catch (error: any) {
    // Bekor qilingan bo'lsa
    try {
      console.log(error);
      await ctx.answerCbQuery(
        error?.response?.data?.message || "Xatolik kuzatildi"
      );
    } catch (error) {
      console.error(error);
    }
  }
});

export default composer;
