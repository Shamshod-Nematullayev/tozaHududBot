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
