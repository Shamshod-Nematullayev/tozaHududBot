import { Axios } from "axios";

export interface ICreateActPayload {
  actPackId: number;
  actType: "DEBIT" | "CREDIT";
  amount: number;
  amountWithQQS: number;
  amountWithoutQQS: number;
  description: string;
  endPeriod: string;
  startPeriod: string;
  fileId: string;
  kSaldo: number;
  residentId: number;
  inhabitantCount: number | null;
}

/**
 * Akt yaratish yaratilgan akt ID si qaytariladi
 */
export async function createAct(
  tozaMakonApi: Axios,
  payload: ICreateActPayload
): Promise<number> {
  return (await tozaMakonApi.post("/billing-service/acts", payload)).data;
}
