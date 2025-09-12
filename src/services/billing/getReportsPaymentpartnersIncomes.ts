import { Axios } from "axios";

interface IPartner {
  partnerId: number;
  partnerName: string;
  transactionAmount: number;
  transactionCount: number;
}

interface IMahallaRow {
  id: number;
  name: string;
  totalTransactionAmount: number;
  totalTransactionCount: number;
  partnerTransactions: IPartner[];
}

/**
 * Fetches the payment partners' income report from the TozaMakon API.
 *
 * @param {Axios} tozaMakonApi - The Axios instance to use for the API request.
 * @param {Object} [params] - Parameters for the API request.
 * @param {number} [params.companyId] - The ID of the company for which to fetch the report.
 * @param {number} [params.regionId] - The ID of the region for which to fetch the report.
 * @param {number} [params.districtId] - The ID of the district for which to fetch the report.
 * @param {string} [params.fromDate] - The start date of the report period in 'YYYY-MM-DD' format.
 * @param {string} [params.toDate] - The end date of the report period in 'YYYY-MM-DD' format.
 * @returns {Promise<IMahallaRow[]>} A promise that resolves to the report data.
 */
export async function getReportsPaymentpartnersIncomes(
  tozaMakonApi: Axios,
  params?: {
    reportType: "MAHALLA" | "STREET";
    companyId: number;
    regionId: number;
    districtId: number;
    fromDate: string;
    toDate: string;
    page?: number;
    size?: number;
    mahallaId?: number;
  }
): Promise<IMahallaRow[]> {
  return (
    await tozaMakonApi.get(
      "/billing-service/reports/payment-partners/incomes",
      {
        params: params,
      }
    )
  ).data;
}
