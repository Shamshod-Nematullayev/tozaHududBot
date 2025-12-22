import { Axios, AxiosError } from "axios";

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
  try {
    const response = await tozaMakonApi.get(
      "/user-service/het/consumers/by-personal-account",
      {
        params: payload,
      }
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<HETErrorResponse>;

    if (axiosError.response?.data) {
      // 400 bo‘lsa ham backend qaytargan datani olish
      return axiosError.response.data;
    }

    // Agar umuman response bo‘lmasa (network error va h.k.)
    throw error;
  }
}
