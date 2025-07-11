import { Axios } from "axios";
import { IAct } from "types/billing";

export async function getResidentActs(
  tozaMakonApi: Axios,
  residentId: number,
  params: {
    page: number;
    size: number;
  } = { page: 0, size: 100 }
): Promise<IAct[]> {
  return (
    await tozaMakonApi.get(`/user-service/residents/${residentId}/acts`, {
      params: {
        ...params,
        residentId,
      },
    })
  ).data.content;
}
