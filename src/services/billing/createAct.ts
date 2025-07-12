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

export interface ICreateActResponse {
  id: number;
  actNumber: string;
  actPackId: number;
  residentId: number | null;
  actStatus: "NEW";
  actType: "DEBIT" | "CREDIT";
  amount: number;
  amountWithQQS: number;
  amountWithoutQQS: number;
  fileId: string | null;
  description: string;
  createdAt: string;
  createdBy: number;
  warnedAt: string | null;
  warnedBy: number | null;
  warningConclusion: string | null;
  confirmedAt: string | null;
  confirmedBy: number | null;
  confirmationConclusion: string | null;
  canceledAt: string | null;
  canceledBy: number | null;
  cancellationConclusion: string | null;
}

/**
 * Akt yaratish yaratilgan akt ID si qaytariladi
 */
export async function createAct(
  tozaMakonApi: Axios,
  payload: ICreateActPayload
): Promise<ICreateActResponse> {
  return (await tozaMakonApi.post("/billing-service/acts", payload)).data;
}
