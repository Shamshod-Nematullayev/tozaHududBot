import {
  getResidentHousesByPnfl,
  identificationAbonent,
  searchAbonent,
  updateAbonentDetails,
} from "@services/billing";
import { Axios, AxiosError } from "axios";
import { parseDublicateError } from "./dublicateParseResult";
import { AbonentDoc } from "@models/Abonent";
import { ICustomDataRequestDoc } from "@models/CustomDataRequest";

function createAccountNumberGenerator(start = 9000000) {
  let current = start;
  return () => (current++).toString();
}
const getNextAccount = createAccountNumberGenerator();

async function findFreeElectricityAccountNumber(
  tozaMakonApi: Axios,
  companyId: number
): Promise<string> {
  let attempt = 0;
  while (attempt < 1000) {
    const accountNumber = getNextAccount();
    const abonents = (
      await searchAbonent(tozaMakonApi, {
        electricityAccountNumber: accountNumber,
        companyId,
      })
    ).content;
    if (abonents.length === 0) {
      return accountNumber;
    }
    attempt++;
  }
  throw new Error("Bo'sh elektr hisob raqami topilmadi");
}

export async function tryIdentifiedOrReject(
  req: ICustomDataRequestDoc,
  abonent: AbonentDoc,
  tozaMakonApi: Axios
): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    await identificationAbonent(tozaMakonApi, abonent.id, true);
    return { success: true };
  } catch (err) {
    interface ErrorResponseData {
      message: string;
      code: string;
      time: string;
      traceId: string;
    }

    const error = err as AxiosError<ErrorResponseData>;
    const resultErr = parseDublicateError(
      error.response?.data.message || "",
      abonent.accountNumber
    );

    if (
      resultErr.type === "HETDublicate" &&
      !abonent.ekt_kod_tasdiqlandi?.confirm
    ) {
      await updateAbonentDetails(tozaMakonApi, abonent.id, {
        electricityAccountNumber: await findFreeElectricityAccountNumber(
          tozaMakonApi,
          req.companyId
        ),
      });
      await identificationAbonent(tozaMakonApi, abonent.id, true);
      return { success: true };
    }

    if (resultErr.type === "cadastrDublicate") {
      const cadastralNumber = (
        await getResidentHousesByPnfl(tozaMakonApi, req.data.pinfl)
      ).find(Boolean);
      if (cadastralNumber) {
        await updateAbonentDetails(tozaMakonApi, abonent.id, {
          house: { cadastralNumber },
        });
        await identificationAbonent(tozaMakonApi, abonent.id, true);
        return { success: true };
      }
    }

    // boshqa holatlarda
    return {
      success: false,
      errorMessage: error.response?.data.message || "Noma'lum xatolik",
    };
  }
}
