import { Axios } from "axios";
import { DHJRow } from "types/billing";

export async function getResidentDHJByAbonentId(
  tozaMakonApi: Axios,
  residentId: number,
  params?: {
    page: number;
    size: number;
  }
): Promise<DHJRow[]> {
  return (
    await tozaMakonApi.get(`/billing-service/resident-balances/dhsh`, {
      params: {
        ...params,
        residentId,
      },
    })
  ).data.content;
}
