import { Axios } from 'axios';

interface Params {
  residentId: number;
  periodFrom: string;
  periodTo: string;
  lang?: string;
}

interface AbonentCard {
  accountNumber: string;
  address: null | string;
  balanceDtoList: Array<{
    accrual: number;
    actAmount: number;
    additionalAccrual: number;
    cashAmount: number;
    eMoneyAmount: number;
    frozenActAmount: number;
    frozenDebtSettlement: number;
    frozenKSaldo: number;
    frozenNSaldo: number;
    frozenRevenue: number;
    god: number;
    id: number;
    inhabitantCount: number;
    kSaldo: number;
    kSaldoDt: number;
    kSaldoKt: number;
    mes: string;
    munisAmount: number;
    nSaldo: number;
    nSaldoDt: number;
    nSaldoKt: number;
    organizationId: null | number;
    penaltyFee: number;
    period: string;
    q1031Amount: number;
    residentId: number;
    tariffId: number;
  }>;
  companyAddress: string;
  companyBankAccount: string;
  companyBankMFO: string;
  companyBankName: string;
  companyDirector: string;
  companyEmail: string;
  companyInn: string;
  companyName: string;
  companyPhone: string;
  contractDate: string | null;
  contractNumber: string | null;
  currentKSaldo: number;
  currentPeriod: string;
  districtName: string;
  flatNumber: string | null;
  fullName: string;
  inhabitantCnt: number;
  mahallaName: string;
  phone: string | null;
  qrCodeImage: string;
  streetName: string;
}

export async function getAbonentCardById(tozaMakonApi: Axios, params: Params): Promise<AbonentCard> {
  return (
    await tozaMakonApi.get(`/user-service/residents/${params.residentId}/print-card`, {
      params: { ...params, lang: params.lang || 'UZ' },
    })
  ).data;
}
