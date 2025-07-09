export interface Citizen {
  firstName: string;
  lastName: string;
  foreignCitizen: boolean;
  patronymic: string | null;
  inn: string | null;
  pnfl: string;
  passport: string;
  birthDate: string;
  passportGivenDate: string;
  passportIssuer: string;
  passportExpireDate: string;
  email: string | null;
  photo: string | null;
}

export interface House {
  cadastralNumber: string;
  flatNumber?: number;
  homeIndex?: number;
  homeNumber?: string;
  id: number;
  inhabitantCnt: number;
  latitude?: number;
  longitude?: number;
  miaInhabitantCnt?: null;
  temporaryCadastralNumber?: string;
  type: "HOUSE" | "APARTMENT";
}

export interface Balance {
  period: string;
  kSaldo: number;
  frozenActAmount: number;
  frozenDebtSettlement: number;
  frozenKSaldo: number;
  frozenNSaldo: number;
  frozenRevenue: number;
  rate: string;
  accrual: number;
}

export interface AbonentDetails {
  id: number;
  accountNumber: string;
  residentType: "INDIVIDUAL";
  electricityAccountNumber: string;
  electricityCoato: string;
  companyId: number;
  streetId: number;
  mahallaId: number;
  contractNumber: string | null;
  contractDate: string;
  homePhone: string | null;
  active: boolean;
  description: string | null;
  phone: string | null;
  citizen: Citizen;
  house: House;
}

export interface AbonentSearchQuery {
  accountNumber?: string;
  balanceFrom?: number;
  balanceTo?: number;
  cadastralNumber?: string;
  companyId: number;
  contractNumber?: string;
  districtId?: number;
  electricityAccountNumber?: string;
  flatNumber?: number;
  foreignCitizen?: boolean;
  fullName?: string;
  homeIndex?: number;
  homeNumber?: string;
  identified?: boolean;
  inhabitantCnt?: number;
  mahallaId?: number;
  page?: number;
  passport?: string;
  phone?: string;
  pnfl?: string;
  size?: number;
  sort?: string;
  streetId?: number;
}

export interface IAbonent {
  id: number;
  fullName: string;
  accountNumber: string;
  mahallaId: number;
  mahallaName: string;
  streetId: number;
  streetName: string;
  homeNumber: string | null;
  homeIndex: number | null;
  flatNumber: number | null;
  inhabitantCnt: number;
  miaInhabitantCnt: number | null;
  electricityCoato: string;
  electricityAccountNumber: string;
  inn: string | null;
  pinfl: string;
  passport: string;
  birthDate: string;
  passportGivenDate: string;
  cadastralNumber: string;
  phone: string;
  homePhone: string | null;
  period: string;
  tariffId: number;
  lastPayDate: string;
  lastPaymentType: string;
  lastPaymentAmount: number;
  accrual: number;
  actAmount: number;
  incomes: number;
  contractDate: string | null;
  description: string | null;
  identified: boolean;
  identifiedDate: string;
  isFrozen: boolean;
  courtWarningStatus: string | null;
  bindStatus: string | null;
  mahallaBindStatus: string | null;
  foreignCitizen: boolean;
  deletedAt: string | null;
  deletedBy: string | null;
  nsaldoDt: number;
  nsaldoKt: number;
  ksaldoDt: number;
  ksaldoKt: number;
  nsaldo: number;
  ksaldo: number;
}
