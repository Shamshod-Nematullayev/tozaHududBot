import { Axios } from "axios";

/**
 * Akt yaratish
 */
export async function createAct(
  tozaMakonApi: Axios,
  payload: {
    actPackId: number;
    actType: string;
    amount: number;
    amountWithQQS: number;
    amountWithoutQQS: number;
    description: string;
    endPeriod: string;
    startPeriod: string;
    fileId: string;
    kSaldo: number;
    residentId: number;
  }
) {
  return (await tozaMakonApi.post("/billing-service/acts", payload)).data;
}
