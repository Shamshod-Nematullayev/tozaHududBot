import { Axios } from "axios";
import { Balance, Citizen, House } from "types/billing";

interface Abonent {
  balance: Balance;
  isFrozen: boolean;
  courtWarningIndicator: string | null;
  id: number;
  accountNumber: string;
  active: boolean;
  citizen: Citizen;
  companyId: number;
  companyName: string;
  contractClosedAt: string | null;
  contractDate: string;
  contractNumber: string | null;
  createdAt: string;
  description: string;
  districtId: number;
  districtName: string;
  electricityAccountNumber: string;
  electricityCoato: string;
  fullName: string;
  homePhone: string | null;
  house: House;
  identified: boolean;
  mahallaId: number;
  mahallaName: string;
  oldAccountNumber: string | null;
  oldAccountNumberChangedAt: string | null;
  parentId: number | null;
  phone: string;
  regionId: number;
  regionName: string;
  residentType: "INDIVIDUAL";
  shirkatId: number | null;
  streetId: number;
  streetName: string;
  zoneId: number | null;
  zoneName: string | null;
}

export async function getAbonentById(
  tozaMakonApi: Axios,
  residentId: number
): Promise<Abonent> {
  return (await tozaMakonApi.get(`/user-service/residents/${residentId}`)).data;
}
