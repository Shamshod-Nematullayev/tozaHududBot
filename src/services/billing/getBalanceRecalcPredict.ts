import { Axios } from 'axios';

interface Response {
  currentBalanceAmount: number;
  currentTariffId: number;
  currentTariffRate: number;
  inhabitantCount: number;
  predictedBalanceAmount: number;
  predictedPeriod: string;
  balancePredictItems: {
    accrualAmount: number;
    balanceAmount: number;
    inhabitantCount: number;
    period: string;
    tariffId: number;
    tariffRate: number;
  }[];
}

export async function getBalanceRecalcPredict(
  tozaMakonApi: Axios,
  params: { residentId: number; period: string }
): Promise<Response[]> {
  return (await tozaMakonApi.get(`/billing-service/balance-recalc/predict`, { params })).data;
}
