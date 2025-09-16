import { Axios } from "axios";
import { AbonentDetails } from "types/billing";
import { getAbonentDetails } from "./getAbonentDetails.js";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function formatCadastrNumber(str: string) {
  const part1 = str.slice(0, 2);
  const part2 = str.slice(2, 4);
  const part3 = str.slice(4, 6);
  const part4 = str.slice(6, 8);
  const part5 = str.slice(8, 10);
  const part6 = str.slice(10, 14);

  // Format qilib qaytaramiz
  return `${part1}:${part2}:${part3}:${part4}:${part5}:${part6}`;
}

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
      ...{
        ...existingDetails.house,
        type: existingDetails.house?.type || "HOUSE",
        homeNumber: existingDetails.house?.homeNumber || "0",
        cadastralNumber:
          existingDetails.house?.cadastralNumber ||
          formatCadastrNumber("14" + existingDetails.accountNumber),
      },
      ...details.house,
    },
    citizen: {
      ...existingDetails.citizen,
      ...details.citizen,
    },
  });
}
