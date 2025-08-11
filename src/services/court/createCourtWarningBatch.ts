import { Axios } from "axios";

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

export async function createCourtWarningBatch(
  tozaMakonApi: Axios,
  params: {
    lang: string;
    oneWarningInOnePage: boolean;
    residentId: number;
    warningBasis: string;
    warningDate: Date;
  }
): Promise<Buffer> {
  return (
    await tozaMakonApi.post(
      "/user-service/court-warnings/batch",
      {
        ...params,
        residentIds: [params.residentId],
        lang: params.lang,
        warningDate: formatDate(params.warningDate),
      },
      { responseType: "arraybuffer" }
    )
  ).data;
}
