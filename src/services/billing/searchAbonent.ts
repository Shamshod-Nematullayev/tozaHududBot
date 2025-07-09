import { Axios } from "axios";
import { AbonentSearchQuery, IAbonent } from "types/billing";

export async function searchAbonent(
  tozaMakonApi: Axios,
  query: AbonentSearchQuery
): Promise<IAbonent[]> {
  return (
    await tozaMakonApi.get("/user-service/residents", {
      params: query,
    })
  ).data.content;
}
