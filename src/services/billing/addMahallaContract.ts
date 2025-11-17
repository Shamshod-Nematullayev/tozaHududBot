import { Axios } from "axios";

interface Payload {
  companyId: number;
  mahallaId: number;
  fileId: string;
}

/**
 * Add a new mahalla contract
 * @param {Axios} tozaMakonApi - TozaMakon API instance
 * @param {Payload} payload - Payload containing companyId, mahallaId, fileId
 * @returns {Promise<number>} - The created mahalla contract id
 */
export async function addMahallaContract(
  tozaMakonApi: Axios,
  payload: Payload
): Promise<number> {
  return (await tozaMakonApi.post("/user-service/mahalla-contracts", payload))
    .data;
}
