import { Axios } from "axios";
import { CheckingResults } from "./validationInputData.js";
import { getAbonentById } from "@services/billing/index.js";
import { createWarningLetterPDF } from "../../utils/createWarningLetterPDF.js";
import { createPdfMail } from "@services/hybrydPost/createPdfMail.js";
import { HybridMail } from "@models/HybridMail.js";
import { Ctx } from "./index.js";
import { chunkArray } from "@helpers/chunkArray.js";

export default async function (
  tozaMakonApi: Axios,
  hybridPochtaApi: Axios,
  hybridParams: {
    Region: string;
    Area: string;
  },
  checkingResults: CheckingResults[],
  companyId: number,
  ctx: Ctx,
  statusMessageId: number
) {
  let counter = 0;
  const chunks = chunkArray(checkingResults, 10);
  for (const chunk of chunks) {
    const promises = chunk.map(async (abonent) => {
      const abonentDetails = await getAbonentById(
        tozaMakonApi,
        abonent.residentId
      );
      const base64Batch = await createWarningLetterPDF(
        abonentDetails,
        companyId
      );
      const newMail = await createPdfMail(hybridPochtaApi, {
        Address: `${abonentDetails.mahallaName}, ${abonentDetails.streetName}`,
        Receiver: abonentDetails.fullName,
        Document64: base64Batch,
        Region: hybridParams.Region, //viloyat
        Area: hybridParams.Area, // tuman
      });

      const newMailOnDB = await HybridMail.create({
        licshet: abonent.accountNumber,
        type: "ogohlantirish_by_tg_bot",
        hybridMailId: newMail.Id,
        createdOn: new Date(),
        receiver: abonentDetails.fullName,
        warning_date_billing: new Date(),
        companyId: ctx.wizard.state.admin?.companyId,
        residentId: abonent.residentId,
        mahallaId: abonentDetails.mahallaId,
      });
      ctx.wizard.state.mails?.push({
        hybridMailId: newMail.Id,
        _id: newMailOnDB._id.toString(),
        licshet: abonentDetails.accountNumber,
        residentId: abonent.residentId,
        createdOn: new Date(),
        isCharged: false,
        isDeleted: false,
        isSent: false,
        receiver: abonentDetails.fullName,
        isSavedBilling: false,
        warning_amount: abonentDetails.balance.kSaldo,
        type: "ogohlantirish_by_tg_bot",
        abonent_deleted: false,
        mahallaId: abonentDetails.mahallaId,
        companyId: ctx.wizard.state.admin?.companyId as number,
        SentOn: newMail.SentOn,
      });
      counter++;
    });
    await Promise.all(promises);
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      statusMessageId,
      undefined,
      `Ogohlantirish xatlari yaratilmoqda ${counter} / ${checkingResults.length}`
    );
  }
}
