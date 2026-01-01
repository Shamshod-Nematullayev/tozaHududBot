import { Axios } from "axios";

interface BlockedResponse {
  blockDate: string;
  blockStatus: "BLOCK";
  warningCreatedAt: string | null;
  warningStatus: string | null;
  warningDebt: number | null;
  blockDebt: number;
}

export async function getHetWarningReportByResident(
  tozaMakonApi: Axios,
  residentId: number
): Promise<BlockedResponse | undefined> {
  return (
    await tozaMakonApi.get(`/report-service/het-warning-report/${residentId}`)
  ).data;
}
