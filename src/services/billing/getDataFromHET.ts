import { Axios } from "axios";

interface Payload {
  coato: string;
  personalAccount: string;
}

interface Response {
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

export async function getDataFromHET(
  tozaMakonApi: Axios,
  params: Payload
): Promise<Response> {
  return (
    await tozaMakonApi.get("/user-service/het/consumers/by-personal-account", {
      params,
    })
  ).data;
}
