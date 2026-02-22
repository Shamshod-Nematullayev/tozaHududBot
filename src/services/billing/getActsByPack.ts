import { Axios } from 'axios';

interface Payload {
  actPackId: number;
  sort: string;
  size: number;
  page: number;
  accountNumber?: string;
  id?: number;
}

export interface Act {
  id: number;
  actNumber: string;
  actPackId: number;
  actPackName: string;
  actStatus: 'NEW' | 'CONFIRMED' | 'WARNED' | 'REJECTED';
  actType: 'DEBIT' | 'CREDIT';
  amount: number;
  amountWithQQS: number | null;
  amountWithoutQQS: number | null;
  canceledAt: string | null;
  canceledBy: number | null;
  cancellationConclusion: string | null;
  companyId: number;
  confirmedAt: string | null;
  confirmedBy: number | null;
  createdAt: string;
  createdBy: number;
  currentInhabitantCount: number;
  description: string;
  districtId: number;
  endPeriod: string;
  fileId: string | null;
  oldInhabitantCount: number;
  packType: string;
  regionId: number;
  residentId: number | null;
  startPeriod: string;
  updatedAt: string;
  updatedBy: number;
  warnedAt: string | null;
  warnedBy: number | null;
  warningConclusion: string | null;
}

interface Response {
  content: Act[];
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  number: number;
  size: number;
  empty: boolean;
}

export const getActsByPack = async (tozaMakonApi: Axios, payload: Payload): Promise<Response> => {
  return (await tozaMakonApi.get('/billing-service/acts', { params: payload })).data;
};
