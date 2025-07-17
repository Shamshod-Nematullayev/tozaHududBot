import { Axios } from "axios";
import { AbonentSearchQuery, IAbonent } from "types/billing";

export async function searchAbonent(
  tozaMakonApi: Axios,
  query: AbonentSearchQuery,
  withMetaData?: boolean
): Promise<{ content: IAbonent[]; totalPages: number; totalElements: number }> {
  const data = (
    await tozaMakonApi.get("/user-service/residents", {
      params: query,
    })
  ).data;

  return data;
}
