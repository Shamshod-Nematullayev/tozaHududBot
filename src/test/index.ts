import { createTozaMakonApi } from "@api/tozaMakon.js";
import {
  identificationAbonent,
  searchAbonent,
} from "@services/billing/index.js";
import fs from "fs";
export async function idenAllAbonents() {
  const tozaMakonApi = createTozaMakonApi(1144);
  const abonents = await searchAbonent(tozaMakonApi, {
    identified: false,
    companyId: 1144,
    size: 300,
  });

  let done = 0;
  let error = 0;
  let counter = abonents.content.length;
  const errors: { accountNumber: string; message: string }[] = [];
  for (const abonent of abonents.content) {
    console.log(counter);
    counter--;
    try {
      await identificationAbonent(tozaMakonApi, abonent.id, true);
      done++;
    } catch (err: any) {
      error++;
      errors.push({
        accountNumber: abonent.accountNumber,
        message: err.response?.data?.message,
      });
    }
  }
  fs.writeFileSync("./errors.txt", JSON.stringify(errors));
  console.log("All abonents", abonents.content.length);
  console.log("Done", done);
  console.log("Error", error);
}
