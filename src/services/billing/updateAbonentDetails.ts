import { Axios } from "axios";
import { AbonentDetails } from "types/billing";
import { getAbonentDetails } from "./getAbonentDetails";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export async function updateAbonentDetails(
  tozaMakonApi: Axios,
  residentId: number,
  details: DeepPartial<AbonentDetails>
) {
  const existingDetails = await getAbonentDetails(tozaMakonApi, residentId);

  // ma'lumotlarni yangilash
  return await tozaMakonApi.put("/user-service/residents/" + residentId, {
    ...existingDetails,
    ...details,
    house: {
      ...existingDetails.house,
      ...details.house,
    },
    citizen: {
      ...existingDetails.citizen,
      ...details.citizen,
    },
  });
}
