import { Axios } from "axios";
import { IAutomobile } from "types/billing.js";

interface IResponse {
  content: IAutomobile[];
  totalElements: number;
  number: number;
  size: number;
}

interface Payload {
  companyId: number;
  size?: number;
  page?: number;
}

export async function getCarsFromTozamakon(
  tozaMakonApi: Axios,
  payload: Payload
): Promise<IResponse> {
  return (
    await tozaMakonApi.get("/user-service/gps/automobiles", { params: payload })
  ).data;
}
