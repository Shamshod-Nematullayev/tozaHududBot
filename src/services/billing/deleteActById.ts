import { Axios } from "axios";

export async function deleteActById(tozaMakonApi: Axios, actId: number) {
  return await tozaMakonApi.delete("/billing-service/acts/" + actId);
}
