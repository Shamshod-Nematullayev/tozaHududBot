import { Axios } from "axios";
import { IAct } from "types/billing";

export async function getActInfo(
  tozaMakonApi: Axios,
  actId: number
): Promise<IAct> {
  return (await tozaMakonApi.get("/billing-service/acts/" + actId)).data;
}
