import { Axios } from "axios";
import { IAct } from "types/billing.js";

interface Payload {
  actPackId: number;
  sort: "id,DESC";
  size: number;
  page: number;
  accountNumber?: string;
  id?: number;
}

interface Response {
  content: IAct[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  number: number;
  size: number;
  empty: boolean;
}

export async function searchActFromPack(
  tozaMakonApi: Axios,
  params: Payload
): Promise<Response> {
  return (await tozaMakonApi.get("/billing-service/acts", { params })).data;
}
