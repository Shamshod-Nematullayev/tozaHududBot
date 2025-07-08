import { Axios } from "axios";
import { Citizen } from "types/billing";

export async function getCitizen(
  tozaMakonApi: Axios,
  params: {
    passport: string;
    birthDate: string;
    pinfl: string;
  }
): Promise<Citizen> {
  return (
    await tozaMakonApi.get("/user-service/citizens", {
      params,
    })
  ).data;
}
