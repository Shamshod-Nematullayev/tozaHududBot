import { Axios } from "axios";

/**
 * Akt uchun amount hisoblash (ya'ni avtomatik narx)
 */
export async function calculateAmount(
  tozaMakonApi: Axios,
  params: {
    amount: number;
    residentId: number;
    actPackId: number;
    actType: string;
  }
) {
  return (
    await tozaMakonApi.get("/billing-service/acts/calculate-amount", {
      params,
    })
  ).data;
}
