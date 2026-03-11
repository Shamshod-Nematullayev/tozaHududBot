import { Axios } from 'axios';

interface ResponseRow {
  accrual: number;
  cashAmount: number;
  emoneyAmount: number;
  god: number;
  id: number;
  income: number;
  ksaldo: number;
  mes: number;
  munisAmount: number;
  period: string;
  q1031Amount: number;
  residentId: number;
}

export async function getIncomeStatistics(tozaMakonApi: Axios, residentId: number): Promise<ResponseRow[]> {
  return (await tozaMakonApi.get(`/billing-service/resident-balances/${residentId}/income-statistics`)).data;
}
