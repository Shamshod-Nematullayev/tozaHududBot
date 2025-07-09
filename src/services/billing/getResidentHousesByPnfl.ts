import { Axios } from "axios";

export async function getResidentHousesByPnfl(
  tozaMakonApi: Axios,
  pnfl: string
): Promise<string[]> {
  return (await tozaMakonApi.get("/user-service/houses/pinfl/" + pnfl)).data
    .cadastr_list;
}
