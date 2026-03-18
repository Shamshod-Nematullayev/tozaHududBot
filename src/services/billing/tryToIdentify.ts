import { parseError } from '@bot/actions/shaxsiTasdiqlandi/handlers/parseErrorMessage.js';
import { identificationAbonent } from './identificationAbonent.js';
import { updateAbonentDetails } from './updateAbonentDetails.js';
import { Abonent } from '@models/Abonent.js';
import { searchAbonent } from './searchAbonent.js';
import { getAbonentDetails } from './getAbonentDetails.js';
import { lotinga } from '@bot/middlewares/smallFunctions/lotinKiril.js';
import { Axios } from 'axios';
import { IAbonent } from 'types/billing.js';
import { caotoNames } from 'constants.js';

function getUniqueCadastr(number: string) {
  const str = number.padStart(12, '0'); // 12 ta raqamga to'ldirish
  const parts = [
    str.slice(0, 2), // 10
    str.slice(2, 4), // 51
    str.slice(4, 6), // 20
    str.slice(6, 8), // 50
    str.slice(8, 12), // 0123
  ];
  return '14:05:' + parts.join(':');
}

// --- Xatoliklarni tuzatish strategiyalari ---
const errorFixers: Record<
  string,
  (
    api: Axios,
    abonent: {
      id: number;
      accountNumber: string;
    },
    errorData: any,
    companyId?: number
  ) => Promise<any>
> = {
  notPhoto: async (api, abonent) =>
    updateAbonentDetails(api, abonent.id, {
      citizen: {
        photo: 'tozamakon/nfs/resident_image/2025/05/20/db71ca6e47c34cc5a834777957f1ff7e32001666060015_ad1545711.jpg',
      },
    }),

  // HETDublicate: async (api, abonent, err) => {
  //   // bu xatolikni tuzatib bo'lmaydi
  //   return null;
  // },

  // brokenCaoto: async (api, abonent, _, companyId) => {
  //   const caoto = caotoNames.find((c) => c.companyId === companyId);
  //   if (!caoto) throw new Error("Caoto ma'lumoti topilmadi");
  //   return updateAbonentDetails(api, abonent.id, { electricityCoato: String(caoto.caoto) });
  // },

  hasKirillOnName: async (api, abonent) => {
    const details = await getAbonentDetails(api, abonent.id);
    return updateAbonentDetails(api, abonent.id, {
      citizen: {
        firstName: lotinga(details.citizen.firstName),
        lastName: lotinga(details.citizen.lastName),
        patronymic: lotinga(details.citizen.patronymic || 'XXX'),
      },
    });
  },

  // brokenETK: async (api, abonent) =>
  //   updateAbonentDetails(api, abonent.id, {
  //     electricityAccountNumber: abonent.electricityAccountNumber + abonent.id,
  //   }),

  brokenPasport: async (api, abonent) => updateAbonentDetails(api, abonent.id, { citizen: { passport: 'AA1234567' } }),

  brokenJSHSHIR: async (api, abonent) => updateAbonentDetails(api, abonent.id, { citizen: { pnfl: '42907998901231' } }),

  cadastrDublicate: async (api, abonent) =>
    updateAbonentDetails(api, abonent.id, { house: { cadastralNumber: getUniqueCadastr(abonent.accountNumber) } }),

  brokenCadastr: async (api, abonent) =>
    updateAbonentDetails(api, abonent.id, { house: { cadastralNumber: getUniqueCadastr(abonent.accountNumber) } }),
};

// --- Asosiy Funksiya ---
export async function tryToIdentify(
  tozaMakonApi: Axios,
  abonent: {
    id: number;
    accountNumber: string;
  },
  companyId: number,
  retryCount = 0
): Promise<boolean | undefined> {
  // Cheksiz rekursiyadan himoya (masalan, max 5 marta)
  if (retryCount > 5) {
    console.error(`[Limit] ${abonent.accountNumber} uchun urinishlar soni tugadi.`);
    return false;
  }

  console.log(`[Attempt ${retryCount}] Identifying: ${abonent.accountNumber}`);

  try {
    await identificationAbonent(tozaMakonApi, abonent.id, true);

    console.log(`[Success] ${abonent.accountNumber} uchun identifikatsiya muvaffaqiyatli amalga oshirildi.`);
    return true;
  } catch (error: any) {
    const err = parseError(error.response?.data?.message, abonent.accountNumber);
    const fixer = errorFixers[err.type];

    if (fixer) {
      await fixer(tozaMakonApi, abonent, err, companyId);
      return tryToIdentify(tozaMakonApi, abonent, companyId, retryCount + 1);
    }

    console.error(`[Unhandled Error] Type: ${err.type}`, error.response?.data || error.message);
    return false;
  }
}

// USAGE
// (async () => {
//   let counter = 0;
//   for (let i = 0; i < data.length; i++) {
//     await tryToIdentify(
//       createTozaMakonApi(1144),
//       {
//         accountNumber: data[i].accountNumber.toString(),
//         id: data[i].id,
//       },
//       1144
//     );
//     counter++;
//     console.log(`${counter}/${data.length + 1} done`);
//   }
// })();
