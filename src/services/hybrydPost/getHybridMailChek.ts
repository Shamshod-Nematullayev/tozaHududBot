import { createHybridPochtaApi } from "@api/hybridPochta.js";

export async function getHybridMailChek(
  companyId: number,
  hybridMailId: string | number
) {
  const hybridPochtaApi = createHybridPochtaApi(companyId);
  const mail = (
    await hybridPochtaApi.get("/Receipt", {
      params: { id: hybridMailId },
      responseType: "arraybuffer",
    })
  ).data;
  return Buffer.from(mail);
}
