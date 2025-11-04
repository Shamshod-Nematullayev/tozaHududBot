import { Abonent } from "@models/Abonent.js";
import { Axios } from "axios";
import { Citizen } from "types/billing.js";
import { identificationAbonent } from "./identificationAbonent.js";

export interface CreateAbonentPayload {
  citizen: Citizen;
  mahallaId: number | string;
  mahallaName: string;
  streetId: number | string;
  nazoratchiName: string;
  nazoratchiId: number;
  nazoratchiMongoId: string;
  companyId: number;
  etkCustomerCode?: string | null;
  etkCaoto?: string | null;
  cadastr?: string | null;
  inhabitant_cnt: number;
  nSaldo?: number;
  isCreditor?: boolean;
}

export async function createAbonent(
  tozaMakonApi: Axios,
  payload: CreateAbonentPayload
): Promise<{ abonentId: number; accountNumber: string }> {
  const generatedAccountNumber = (
    await tozaMakonApi.get(
      `/user-service/residents/account-numbers/generate?residentType=INDIVIDUAL&mahallaId=${payload.mahallaId}`
    )
  ).data;
  const abonentId = (
    await tozaMakonApi.post("/user-service/residents", {
      accountNumber: generatedAccountNumber,
      active: true,
      citizen: payload.citizen,
      companyId: payload.companyId,
      contractDate: null,
      contractNumber: null,
      description: `${payload.nazoratchiName} tomonidan yangi abonent ochish uchun ariza qabul qilindi`,
      electricityAccountNumber: payload.etkCustomerCode,
      electricityCoato: payload.etkCaoto,
      homePhone: null,
      house: {
        cadastralNumber: payload.cadastr,
        flatNumber: null,
        homeIndex: null,
        homeNumber: 0,
        inhabitantCnt: payload.inhabitant_cnt,
        temporaryCadastralNumber: null,
        type: "HOUSE",
      },
      isCreditor: payload.isCreditor || false,
      mahallaId: payload.mahallaId,
      nSaldo: payload.nSaldo || 0,
      residentType: "INDIVIDUAL",
      streetId: payload.streetId,
    })
  ).data;
  Abonent.create({
    createdAt: new Date(),
    fio: `${payload.citizen.lastName} ${payload.citizen.firstName} ${
      payload.citizen.patronymic || ""
    }`.trim(),
    licshet: generatedAccountNumber,
    mahallas_id: payload.mahallaId,
    prescribed_cnt: payload.inhabitant_cnt,
    id: abonentId,
    kadastr_number: payload.cadastr,
    pinfl: payload.citizen.pnfl,
    mahalla_name: payload.mahallaName,
    passport_number: payload.citizen.passport,
    streets_id: payload.streetId,
    shaxsi_tasdiqlandi: {
      confirm: true,
      inspector: {
        _id: payload.nazoratchiMongoId,
        name: payload.nazoratchiName,
      },
      inspector_id: payload.nazoratchiId,
      inspector_name: payload.nazoratchiName,
      updated_at: new Date(),
    },
    ekt_kod_tasdiqlandi: {
      confirm: true,
      inspector: {
        _id: payload.nazoratchiMongoId,
        name: payload.nazoratchiName,
      },
      inspector_id: payload.nazoratchiId,
      inspector_name: payload.nazoratchiName,
      updated_at: new Date(),
    },
    companyId: payload.companyId,
  });
  identificationAbonent(tozaMakonApi, abonentId, true);
  return {
    abonentId,
    accountNumber: generatedAccountNumber,
  };
}
