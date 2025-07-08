import { Axios } from "axios";
import { calculateKSaldo } from "./calculateKSaldo";
import { createAct } from "./createAct";

export async function createMoneyTransferActs({
  tozaMakonApi,
  fileId,
  actPackId,
  debitor,
  creditors,
}: {
  tozaMakonApi: Axios;
  fileId: string;
  actPackId: number;
  debitor: {
    amount: number;
    residentId: number;
    accountNumber: string;
  };
  creditors: {
    amount: number;
    accountNumber: string;
    residentId: number;
  }[];
}) {
  const date = new Date();
  const createdActs = [];

  // Debitor akt
  const debitKSaldo = await calculateKSaldo(tozaMakonApi, {
    amount: debitor.amount,
    residentId: debitor.residentId,
    actPackId,
    actType: "DEBIT",
  });

  const debitAct = await createAct(tozaMakonApi, {
    actPackId,
    actType: "DEBIT",
    amount: debitor.amount,
    amountWithQQS: debitor.amount,
    amountWithoutQQS: 0,
    kSaldo: debitKSaldo,
    description: `pul ko'chirish ${creditors
      .map((a) => a.accountNumber)
      .join(", ")}larga ${debitor.amount} so'm`,
    fileId,
    endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
    residentId: debitor.residentId,
  });

  createdActs.push(debitAct);

  for (const creditor of creditors) {
    const creditKSaldo = await calculateKSaldo(tozaMakonApi, {
      amount: creditor.amount,
      residentId: creditor.residentId,
      actPackId,
      actType: "CREDIT",
    });

    const creditAct = await createAct(tozaMakonApi, {
      actPackId,
      actType: "CREDIT",
      amount: creditor.amount,
      amountWithQQS: creditor.amount,
      amountWithoutQQS: 0,
      kSaldo: creditKSaldo,
      description: `pul ko'chirish ${debitor.accountNumber} dan ${creditor.amount} so'm`,
      fileId,
      endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
      startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
      residentId: creditor.residentId,
    });

    createdActs.push(creditAct);
  }

  return createdActs; // rollback uchun
}
