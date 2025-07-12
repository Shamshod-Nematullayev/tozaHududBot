import { Axios } from "axios";
import { IActPack } from "types/billing";

export async function getActPacks(tozaMakonApi: Axios): Promise<IActPack[]> {
  return (await tozaMakonApi.get("/billing-service/act-packs")).data.content;
}
