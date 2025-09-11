import { parseError } from "@bot/actions/shaxsiTasdiqlandi/handlers/parseErrorMessage.js";
import { identificationAbonent } from "./identificationAbonent.js";
import { updateAbonentDetails } from "./updateAbonentDetails.js";
import { Abonent } from "@models/Abonent.js";
import { searchAbonent } from "./searchAbonent.js";
import { getAbonentDetails } from "./getAbonentDetails.js";
import { lotinga } from "@bot/middlewares/smallFunctions/lotinKiril.js";
import { Axios } from "axios";
import { IAbonent } from "types/billing.js";
import { caotoNames } from "constants.js";

function getUniqueCadastr(number: string) {
  const str = number.padStart(13, "0"); // 13 ta raqamga to'ldirish
  const parts = [
    str.slice(0, 2), // 10
    str.slice(2, 4), // 51
    str.slice(4, 6), // 20
    str.slice(6, 8), // 50
    str.slice(8, 10), // 01
    str.slice(10, 13), // 023
  ];
  return "14:05:" + parts.join(":");
}

export async function tryToIdentify(
  tozaMakonApi: Axios,
  abonent: IAbonent,
  companyId: number
) {
  console.log(abonent.accountNumber, "trying");
  try {
    // identifikatsiyadan o'tkazishga urinish
    await identificationAbonent(tozaMakonApi, abonent.id, true);
    return true;
  } catch (error: any) {
    // xatolikni tekshirish
    const err = parseError(
      error.response?.data?.message,
      abonent.accountNumber
    );
    // rasm yo'q bo'lsa rasm qo'shish
    if (err.type === "notPhoto") {
      await updateAbonentDetails(tozaMakonApi, abonent.id, {
        citizen: {
          photo:
            "tozamakon/nfs/resident_image/2025/05/20/db71ca6e47c34cc5a834777957f1ff7e32001666060015_ad1545711.jpg",
        },
      });
      // qayta urinish
      return await tryToIdentify(tozaMakonApi, abonent, companyId); // qayta urinish
    }
    // elektr kodi dublikat bo'lsa
    if (err.type === "HETDublicate") {
      // dublikat abonentni olish
      const abonentDubl = await Abonent.findOne({
        licshet: err.dublicateLicshet,
      });
      // dublikat abonent elektr kodi tasdiqlandi bo'lsa joriy abonentni elektr kodini o'zgartirish
      if (abonentDubl && abonentDubl.ekt_kod_tasdiqlandi?.confirm) {
        await updateAbonentDetails(tozaMakonApi, abonent.id, {
          electricityAccountNumber: abonent.electricityAccountNumber + "0",
        });
        await Abonent.findOneAndUpdate(
          { id: abonent.id, "ekt_kod_tasdiqlandi.confirm": true },
          { $set: { ekt_kod_tasdiqlandi: { confirm: false } } }
        );
        abonent.electricityAccountNumber =
          abonent.electricityAccountNumber + "0";
        return await tryToIdentify(tozaMakonApi, abonent, companyId); // qayta urinish
      } else if (abonentDubl) {
        await updateAbonentDetails(tozaMakonApi, abonentDubl?.id, {
          electricityAccountNumber: abonent.electricityAccountNumber + "0",
        });
        return await tryToIdentify(tozaMakonApi, abonent, companyId); // qayta urinish
      } else {
        const abonentDubl = (
          await searchAbonent(tozaMakonApi, {
            accountNumber: err.dublicateLicshet,
            companyId: 1144,
          })
        ).content[0];
        if (!abonentDubl) {
          await updateAbonentDetails(tozaMakonApi, abonent.id, {
            electricityAccountNumber: abonent.electricityAccountNumber + "0",
          });
          return await tryToIdentify(tozaMakonApi, abonent, companyId); // qayta urinish
        }
        await updateAbonentDetails(tozaMakonApi, abonentDubl?.id, {
          electricityAccountNumber: abonent.electricityAccountNumber + "0",
        });
        abonent.electricityAccountNumber =
          abonent.electricityAccountNumber + "0";

        return await tryToIdentify(tozaMakonApi, abonent, companyId); // qayta urinish
      }
    }
    if (err.type === "brokenCaoto") {
      let caoto = caotoNames.find((c) => c.companyId == companyId);
      if (!caoto) throw new Error("caoto not found");
      await updateAbonentDetails(tozaMakonApi, abonent.id, {
        electricityCoato: String(caoto.caoto),
      });
      return await tryToIdentify(tozaMakonApi, abonent, companyId);
    }
    if (err.type === "brokenETK") {
      await updateAbonentDetails(tozaMakonApi, abonent.id, {
        electricityAccountNumber: abonent.electricityAccountNumber + abonent.id,
      });
      return await tryToIdentify(tozaMakonApi, abonent, companyId);
    }
    if (err.type === "brokenPasport") {
      await updateAbonentDetails(tozaMakonApi, abonent.id, {
        citizen: {
          passport: "AA1234567",
        },
      });
      return await tryToIdentify(tozaMakonApi, abonent, companyId);
    }
    if (err.type === "hasKirillOnName") {
      const abonentDeteils = await getAbonentDetails(tozaMakonApi, abonent.id);
      await updateAbonentDetails(tozaMakonApi, abonent.id, {
        citizen: {
          firstName: lotinga(abonentDeteils.citizen.firstName),
          lastName: lotinga(abonentDeteils.citizen.lastName),
          patronymic: lotinga(abonentDeteils.citizen.patronymic || "XXX"),
        },
      });
      return await tryToIdentify(tozaMakonApi, abonent, companyId);
    }
    if (err.type === "brokenJSHSHIR") {
      await updateAbonentDetails(tozaMakonApi, abonent.id, {
        citizen: {
          pnfl: "42907998901231",
        },
      });
      return await tryToIdentify(tozaMakonApi, abonent, companyId);
    }
    if (err.type === "cadastrDublicate") {
      await updateAbonentDetails(tozaMakonApi, abonent.id, {
        house: {
          cadastralNumber: abonent.cadastralNumber + abonent.id,
        },
      });
      return await tryToIdentify(tozaMakonApi, abonent, companyId);
    }
    if (err.type === "brokenCadastr") {
      await updateAbonentDetails(tozaMakonApi, abonent.id, {
        house: {
          cadastralNumber: getUniqueCadastr(abonent.accountNumber),
        },
      });
      return await tryToIdentify(tozaMakonApi, abonent, companyId);
    }
    throw error;
  }
}
