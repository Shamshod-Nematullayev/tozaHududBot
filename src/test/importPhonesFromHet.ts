import { createTozaMakonApi } from "@api/tozaMakon.js";
import { chunkArray } from "@helpers/chunkArray.js";
import { changePhone } from "@services/billing/changePhone.js";
import { getDataFromHET } from "@services/billing/getDataFromHET.js";

export async function importPhonesFromHET(
  companyId: number,
  residents: {
    residentId: number;
    caotoNumber: string | number;
    etkKod: string | number;
  }[]
) {
  const tozaMakonApi = createTozaMakonApi(companyId);
  const chunks = chunkArray(residents, 20);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Processing chunk ${i + 1} of ${chunks.length}`);
    await Promise.all(
      chunk.map(async (resident) => {
        const data = await getDataFromHET(tozaMakonApi, {
          coato: resident.caotoNumber.toString(),
          personalAccount: resident.etkKod.toString(),
        });
        if ("code" in data) return console.log("Error", data);
        if (!data.phone) return console.log("Phone not found", resident);
        await changePhone(tozaMakonApi, {
          phoneNumber: data.phone.slice(3),
          residentId: resident.residentId,
        });
      })
    );
  }
}
