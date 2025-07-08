import { Axios } from "axios";

export async function identificationAbonent(
  tozaMakonApi: Axios,
  residentId: number,
  value: boolean = true
) {
  return await tozaMakonApi.patch("/user-service/residents/identified", {
    identified: value,
    residentIds: [residentId],
  });
}
