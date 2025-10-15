import { createTozaMakonApi } from "@api/tozaMakon.js";
import { createCourtWarningBatch } from "@services/court/createCourtWarningBatch.js";
import fs from "fs";

export async function getOXLettersInOnePDF(
  abonentIds: number[],
  companyId: number
) {
  const tozaMakonApi = createTozaMakonApi(companyId);
  const pdfBuffer = await createCourtWarningBatch(tozaMakonApi, {
    lang: "UZ-CYRL",
    residentId: abonentIds,
    oneWarningInOnePage: false,
    warningBasis: "Ogohlantirish xati",
    warningDate: new Date(),
  });

  fs.writeFileSync("./test.pdf", pdfBuffer);
}
