import { Axios } from "axios";

/**
 * Akt uchun amount hisoblash (ya'ni avtomatik narx)
 */
export async function calculateAmount(
  tozaMakonApi: Axios,
  params: {
    residentId: number;
    inhabitantCount: number | null;
    kSaldo: number;
  }
): Promise<{
  actType: "CREDIT" | "DEBIT";
  actPackId: number;
  residentId: number;
  amount: number;
  inhabitantCount: number | null;
  amountWithQQS: number;
  amountWithoutQQS: number;
  calcDtoList: null;
}> {
  return (
    await tozaMakonApi.get("/billing-service/acts/calculate-amount", {
      params,
    })
  ).data;
}
