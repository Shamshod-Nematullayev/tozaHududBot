import { Axios } from "axios";

/**
 * Akt uchun kSaldo hisoblash
 */
export async function calculateKSaldo(
  tozaMakonApi: Axios,
  params: {
    amount: number;
    residentId: number;
    actPackId: number;
    actType: string;
  }
) {
  return (
    await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
      params,
    })
  ).data;
}
