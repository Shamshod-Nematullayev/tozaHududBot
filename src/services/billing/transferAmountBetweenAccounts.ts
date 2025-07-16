import { Axios } from "axios";
import { calculateKSaldo } from "./calculateKSaldo.js";
import { createAct } from "./createAct.js";

export async function transferAmountBetweenAccounts(
  tozaMakonApi: Axios,
  {
    amount,
    residentFrom,
    residentTo,
    actPackId,
    fileId,
    descriptionPrefix = "",
  }: {
    amount: number;
    residentFrom: number;
    residentTo: number;
    actPackId: number;
    fileId: string;
    descriptionPrefix?: string;
  }
) {
  const date = new Date();

  // DEBIT akt (soxta hisobdan pul chiqarish)
  const debitKSaldo = await calculateKSaldo(tozaMakonApi, {
    amount,
    residentId: residentFrom,
    actPackId,
    actType: "DEBIT",
  });

  await createAct(tozaMakonApi, {
    actPackId,
    actType: "DEBIT",
    amount,
    amountWithQQS: 0,
    amountWithoutQQS: amount,
    description: `${descriptionPrefix}dan pul chiqarish`,
    endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    fileId,
    kSaldo: debitKSaldo,
    residentId: residentFrom,
    inhabitantCount: null,
  });

  // CREDIT akt (asosiy hisobga pul kirim qilish)
  const creditKSaldo = await calculateKSaldo(tozaMakonApi, {
    amount,
    residentId: residentTo,
    actPackId,
    actType: "CREDIT",
  });

  await createAct(tozaMakonApi, {
    actPackId,
    actType: "CREDIT",
    amount,
    amountWithQQS: 0,
    amountWithoutQQS: amount,
    description: `${descriptionPrefix}ga pul kirim qilish`,
    endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    fileId,
    kSaldo: creditKSaldo,
    residentId: residentTo,
    inhabitantCount: null,
  });
}
