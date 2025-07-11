import { Axios } from "axios";
import { IAct } from "types/billing";

interface Act {
  actNumber: string;
  actPackId: number;
  actType: string;
  amount: number;
  amountWithQQS: number;
  amountWithoutQQS: number;
  description: string;
  fileId: string;
  id: number;
  inhabitantCnt: number | null;
  endPeriod?: string;
  startPeriod?: string;
  kSaldo: number;
  residentId: number;
}

export async function updateAct(
  tozaMakonApi: Axios,
  actId: number,
  body: Act
): Promise<IAct> {
  return (await tozaMakonApi.put("/billing-service/acts/" + actId, body)).data;
}
