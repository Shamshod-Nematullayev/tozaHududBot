import { Axios } from "axios";
import { AbonentDetails } from "types/billing";

export async function getAbonentDetails(
  tozaMakonApi: Axios,
  id: number
): Promise<AbonentDetails> {
  return (
    await tozaMakonApi.get(`/user-service/residents/${id}?include=translates`)
  ).data;
}
