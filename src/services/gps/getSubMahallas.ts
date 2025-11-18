import { Axios } from "axios";
import { ISubMahalla, PaginatedResponse } from "types/billing.js";

interface Payload {
  districtId: number;
  size: number;
  mahallaId: number;
  page: number;
}

export async function getSubMahallas(
  tozaMakonApi: Axios,
  payload: Payload
): Promise<PaginatedResponse<ISubMahalla>> {
  return (
    await tozaMakonApi.get("/user-service/sub-mahallas", { params: payload })
  ).data;
}
