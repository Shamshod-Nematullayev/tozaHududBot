import { Axios } from "axios";
import { IPdfMail } from "types/hybrid.js";

export async function getOneHybridMail(
  hybridPochtaApi: Axios,
  id: string | number
): Promise<IPdfMail> {
  return (await hybridPochtaApi.get("/mail/" + id)).data;
}
