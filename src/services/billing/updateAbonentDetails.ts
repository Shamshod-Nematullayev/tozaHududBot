import { Axios } from "axios";
import { AbonentDetails } from "types/billing";
import { getAbonentDetails } from "./getAbonentDetails";

export async function updateAbonentDetails(
  tozaMakonApi: Axios,
  residentId: number,
  details: AbonentDetails | any
) {
  const existingDetails = await getAbonentDetails(tozaMakonApi, residentId);

  // ma'lumotlarni yangilash
  return await tozaMakonApi.put("/user-service/residents/" + residentId, {
    ...existingDetails,
    ...details,
  });
}
