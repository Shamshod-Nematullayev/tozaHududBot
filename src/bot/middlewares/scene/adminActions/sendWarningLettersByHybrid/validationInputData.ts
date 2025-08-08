import { Abonent } from "@models/Abonent";
import { HybridMail } from "@models/HybridMail";
import { Ctx } from ".";
import { chunkArray } from "helpers/chunkArray";

interface CheckingResults {
  accountNumber: string;
  message: string;
  ok: boolean;
  residentId: number;
}

export async function validationInputData(
  ctx: Ctx,
  jsonData: any[]
): Promise<CheckingResults[]> {
  const checkingResult: CheckingResults[] = [];

  const message = await ctx.reply(`Tekshilmoqda 0 / ${jsonData.length}`);

  const chunks = chunkArray(jsonData, 10);

  for (const chunk of chunks) {
    chunk.forEach(async (row, i) => {
      const licshet = row[Object.keys(row)[1]];
      if (licshet === undefined) {
        checkingResult.push({
          accountNumber: "",
          message: `hisob raqami topilmadi`,
          ok: false,
          residentId: 0,
        });
        return false;
      }
      const abonent = await Abonent.findOne({
        licshet,
        companyId: ctx.wizard.state.admin?.companyId,
      }).lean();
      if (!abonent) {
        checkingResult.push({
          accountNumber: licshet,
          message: `${licshet} hisob raqamli abonent ma'lumotlar tizim bazasida topilmadi`,
          ok: false,
          residentId: 0,
        });
        return false;
      }
      const now = new Date();
      const oltiOyAvval = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const mail = await HybridMail.findOne({
        licshet,
        warning_date_billing: {
          $gte: oltiOyAvval,
          $lt: now,
        },
      });
      if (mail) {
        checkingResult.push({
          accountNumber: licshet,
          message: `${licshet} hisob raqamiga allaqachon ogohlantirish xati yuborilgan`,
          ok: false,
          residentId: abonent.id,
        });
        return false;
      }
      checkingResult.push({
        accountNumber: licshet,
        message: "",
        ok: true,
        residentId: abonent.id,
      });
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        message.message_id,
        undefined,
        `Tekshirilmoqda ${Math.floor(
          (checkingResult.length / jsonData.length) * 100
        )}%`
      );
    });
  }
  return checkingResult;
}
