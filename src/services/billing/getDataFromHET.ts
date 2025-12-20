import { Axios } from "axios";

interface Payload {
  coato: string;
  personalAccount: string;
}

interface HETErrorResponse {
  code: "ACCOUNT.NOT.FOUND";
  message: string;
  time: string;
}

interface HETSuccessResponse {
  address: string;
  cadastralNumber: string;
  coatoCode: string;
  fullName: string;
  inn: string;
  mahallaName: string;
  pasportNumber: string;
  personalAccount: string;
  phone: string;
  pinfl: string;
}

type HETResponse = HETErrorResponse | HETSuccessResponse;

export async function getDataFromHET(
  tozaMakonApi: Axios,
  payload: Payload
): Promise<HETResponse> {
  const response = await tozaMakonApi.get(
    "/user-service/het/consumers/by-personal-account",
    {
      params: payload,
    }
  );
  return response.data;
}
