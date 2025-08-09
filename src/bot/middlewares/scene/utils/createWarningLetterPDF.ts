import { createTozaMakonApi } from "@api/tozaMakon.js";
import { AbonentDetails } from "types/billing.js";
import { createCourtWarningBatch } from "@services/court/createCourtWarningBatch.js";

export async function createWarningLetterPDF(
  abonentData: AbonentDetails,
  companyId: number
): Promise<string> {
  const now = new Date();
  const tozaMakonApi = createTozaMakonApi(companyId);

  const batch = await createCourtWarningBatch(tozaMakonApi, {
    oneWarningInOnePage: true,
    residentId: abonentData.id,
    warningBasis: `${abonentData.balance.kSaldo.toLocaleString()} soʻm qarzdor`,
    warningDate: now,
    lang: "UZ-CYRL",
  });
  const newBuffer = Buffer.from(batch);

  return newBuffer.toString("base64");
}
