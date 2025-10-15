import { Axios } from "axios";

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

/**
 * Creates a batch of court warnings for the given resident IDs and warning basis.
 * Returns a promise that resolves to the generated batch of court warnings as an array buffer.
 *
 * @param {Axios} tozaMakonApi - The Axios instance to use for the API request.
 * @param {Object} params - Parameters for the API request.
 * @param {string} params.lang - The language of the court warnings.
 * @param {boolean} params.oneWarningInOnePage - Whether to generate one warning per page or not.
 * @param {number} params.residentId - The ID of the resident for which to generate the court warnings.
 * @param {string} params.warningBasis - The basis of the court warnings.
 * @param {Date} params.warningDate - The date of the court warnings.
 * @returns {Promise<Buffer>} A promise that resolves to the generated batch of court warnings as an array buffer.
 */
export async function createCourtWarningBatch(
  tozaMakonApi: Axios,
  params: {
    lang: string;
    oneWarningInOnePage: boolean;
    residentId: number | number[];
    warningBasis: string;
    warningDate: Date;
  }
): Promise<Buffer> {
  return (
    await tozaMakonApi.post(
      "/user-service/court-warnings/batch",
      {
        ...params,
        residentIds: Array.isArray(params.residentId)
          ? params.residentId
          : [params.residentId],
        lang: params.lang,
        warningDate: formatDate(params.warningDate),
      },
      { responseType: "arraybuffer" }
    )
  ).data;
}
