import { Axios } from "axios";

interface IMahallaRow {
  bankAmount: number;
  cashAmount: number;
  emoneyAmount: number;
  id: number;
  individualAccrualSum: number;
  individualPaidCount: number;
  individualRecoveredAmount: number;
  individualTotalAmount: number;
  inhabitantCount: number;
  legalAccrual: number;
  legalTotalAmount: number;
  munisAmount: number;
  name: string;
  organizationsCount: number;
  q1031Amount: number;
  terminalAmount: number;
  totalAccrual: number;
  totalAmount: number;
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
 * @param {string} [params.period] - The report period in 'MM.YYYY' format.
 * @returns {Promise<IMahallaRow[]>} A promise that resolves to the report data.
 */
export async function getReportsPaymentpartnersIncomes(
  tozaMakonApi: Axios,
  params?: {
    companyId: number;
    regionId: number;
    districtId: number;
    dateFrom: string;
    dateTo: string;
    period: string;
  }
): Promise<IMahallaRow[]> {
  return (
    await tozaMakonApi.get("/report-service/reports/v2/mfa-16", {
      params: params,
    })
  ).data;
}
