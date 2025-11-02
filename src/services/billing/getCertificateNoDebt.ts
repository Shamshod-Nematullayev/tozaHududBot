import { Axios, AxiosError } from "axios";

interface ResultError {
  traceId: string;
  code: string;
  message: string;
  time: string;
}

interface ResultSuccess {
  bankDetails: string;
  companyAddress: string;
  companyBank: string;
  companyDirector: string;
  companyInn: string;
  companyName: string;
  companyPhone: string;
  createdAt: string;
  currentBalance: number;
  fileId: string;
  flatNumber: string;
  fullName: string;
  homeNumber: string;
  id: number;
  inhabitantCount: number;
  mahallaName: string;
  phone: string;
  publicUrl: string;
  qrCodeImageUrl: string;
  residentAccountNumber: string;
  residentId: number;
  streetName: string;
}

export async function getCertificateNoDebt(
  tozaMakonApi: Axios,
  residentId: number
): Promise<ResultSuccess | ResultError> {
  try {
    const response = (
      await tozaMakonApi.get(
        `/user-service/resident-references/${residentId}/debts`
      )
    ).data;
    return response;
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return {
        traceId: error.response?.data.traceId || "",
        code: error.response?.data?.code || "UNKNOWN_ERROR",
        message: error.response?.data?.message || "An error occurred",
        time: error.response?.data?.time || new Date().toISOString(),
      };
    } else {
      throw error;
    }
  }
}
