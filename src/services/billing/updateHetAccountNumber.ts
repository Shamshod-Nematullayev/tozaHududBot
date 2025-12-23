import { Axios } from "axios";

interface Payload {
  electricityAccountNumber: string;
  electricityCoato: string;
  residentId: number;
}

export async function updateHetAccountNumber(
  tozaMakonApi: Axios,
  payload: Payload
) {
  return await tozaMakonApi.patch(
    `/user-service/residents/${payload.residentId}/het-account-number`,
    payload
  );
}
