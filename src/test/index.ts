// import { createTozaMakonApi } from "@api/tozaMakon.js";
// import { parseError } from "@bot/actions/shaxsiTasdiqlandi/handlers/parseErrorMessage";
// import { lotinga } from "@bot/middlewares/smallFunctions/lotinKiril";
// import { Abonent } from "@models/Abonent";
// import {
//   getAbonentDetails,
//   identificationAbonent,
//   searchAbonent,
//   updateAbonentDetails,
// } from "@services/billing/index.js";
// import { Axios } from "axios";
// import { chunkArray } from "helpers/chunkArray";
// import { IAbonent } from "types/billing";
// // export async function idenAllAbonents() {
// //   const tozaMakonApi = createTozaMakonApi(1144);
// //   const abonents = await searchAbonent(tozaMakonApi, {
// //     identified: false,
// //     companyId: 1144,
// //     size: 300,
// //     page: 0,
// //     sort: "id,DESC",
// //     cadastralNumber: null,
// //   });

// //   let done = 0;
// //   let error = 0;
// //   const errors: { accountNumber: string; message: string }[] = [];
// //   const chunks = chunkArray(abonents.content, 30);
// //   let counter = chunks.length;
// //   for (const chunk of chunks) {
// //     console.log(counter);
// //     counter--;
// //     await Promise.all(
// //       chunk.map(async (abonent) => {
// //         try {
// //           await updateAbonentDetails(tozaMakonApi, abonent.id, {
// //             house: {
// //               cadastralNumber: formatCustom(abonent.accountNumber),
// //             },
// //           });
// //           await identificationAbonent(tozaMakonApi, abonent.id, true);
// //           done++;
// //         } catch (err: any) {
// //           error++;
// //           errors.push({
// //             accountNumber: abonent.accountNumber,
// //             message: err.response?.data?.message,
// //           });
// //         }
// //       })
// //     );
// //   }
// //   // for (const abonent of abonents.content) {
// //   //   console.log(counter);
// //   //   counter--;
// //   //   try {
// //   //     await updateAbonentDetails(tozaMakonApi, abonent.id, {
// //   //       house: {
// //   //         cadastralNumber: formatCustom(abonent.accountNumber),
// //   //       },
// //   //     });
// //   //     await identificationAbonent(tozaMakonApi, abonent.id, true);
// //   //     done++;
// //   //   } catch (err: any) {
// //   //     error++;
// //   //     errors.push({
// //   //       accountNumber: abonent.accountNumber,
// //   //       message: err.response?.data?.message,
// //   //     });
// //   //   }
// //   // }
// //   fs.writeFileSync("./errors.txt", JSON.stringify(errors));
// //   console.log("All abonents", abonents.content.length);
// //   console.log("Done", done);
// //   console.log("Error", error);
// // }
// function formatCustom(number: string) {
//   const str = number.padStart(13, "0"); // 13 ta raqamga to'ldirish
//   const parts = [
//     str.slice(0, 2), // 10
//     str.slice(2, 4), // 51
//     str.slice(4, 6), // 20
//     str.slice(6, 8), // 50
//     str.slice(8, 10), // 01
//     str.slice(10, 13), // 023
//   ];
//   return "14:05:" + parts.join(":");
// }

// export async function idenOneAbonent() {
//   try {
//     console.log("start");
//     const tozaMakonApi = createTozaMakonApi(1144);
//     const abonents = await searchAbonent(tozaMakonApi, {
//       identified: false,
//       companyId: 1144,
//       size: 300,
//       sort: "id,DESC",
//     });
//     const chunks = chunkArray(abonents.content, 5);
//     for (let chunk of chunks) {
//       await Promise.all(
//         chunk.map(async (abonent) => {
//           await tryToIdentify(tozaMakonApi, abonent);
//           console.log("done", abonent.accountNumber);
//         })
//       );
//     }
//   } catch (error: any) {
//     console.error(error.response?.data?.message);
//     // console.error(error);
//   }
// }

// // Identifikatsiyadan o'tkazish bo'yicha makros
// async function tryToIdentify(tozaMakonApi: Axios, abonent: IAbonent) {
//   console.log(abonent.accountNumber, "trying");
//   try {
//     // identifikatsiyadan o'tkazishga urinish
//     await identificationAbonent(tozaMakonApi, abonent.id, true);
//     return true;
//   } catch (error: any) {
//     // xatolikni tekshirish
//     const err = parseError(
//       error.response?.data?.message,
//       abonent.accountNumber
//     );
//     // rasm yo'q bo'lsa rasm qo'shish
//     if (err.type === "notPhoto") {
//       await updateAbonentDetails(tozaMakonApi, abonent.id, {
//         citizen: {
//           photo:
//             "tozamakon/nfs/resident_image/2025/05/20/db71ca6e47c34cc5a834777957f1ff7e32001666060015_ad1545711.jpg",
//         },
//       });
//       // qayta urinish
//       return await tryToIdentify(tozaMakonApi, abonent); // qayta urinish
//     }
//     // elektr kodi dublikat bo'lsa
//     if (err.type === "HETDublicate") {
//       // dublikat abonentni olish
//       const abonentDubl = await Abonent.findOne({
//         licshet: err.dublicateLicshet,
//       });
//       // dublikat abonent elektr kodi tasdiqlandi bo'lsa joriy abonentni elektr kodini o'zgartirish
//       if (abonentDubl && abonentDubl.ekt_kod_tasdiqlandi?.confirm) {
//         await updateAbonentDetails(tozaMakonApi, abonent.id, {
//           electricityAccountNumber: abonent.electricityAccountNumber + "0",
//         });
//         await Abonent.findOneAndUpdate(
//           { id: abonent.id, "ekt_kod_tasdiqlandi.confirm": true },
//           { $set: { ekt_kod_tasdiqlandi: { confirm: false } } }
//         );
//         abonent.electricityAccountNumber =
//           abonent.electricityAccountNumber + "0";
//         return await tryToIdentify(tozaMakonApi, abonent); // qayta urinish
//       } else if (abonentDubl) {
//         await updateAbonentDetails(tozaMakonApi, abonentDubl?.id, {
//           electricityAccountNumber: abonent.electricityAccountNumber + "0",
//         });
//         return await tryToIdentify(tozaMakonApi, abonent); // qayta urinish
//       } else {
//         const abonentDubl = (
//           await searchAbonent(tozaMakonApi, {
//             accountNumber: err.dublicateLicshet,
//             companyId: 1144,
//           })
//         ).content[0];
//         if (!abonentDubl) {
//           await updateAbonentDetails(tozaMakonApi, abonent.id, {
//             electricityAccountNumber: abonent.electricityAccountNumber + "0",
//           });
//           return await tryToIdentify(tozaMakonApi, abonent); // qayta urinish
//         }
//         await updateAbonentDetails(tozaMakonApi, abonentDubl?.id, {
//           electricityAccountNumber: abonent.electricityAccountNumber + "0",
//         });
//         abonent.electricityAccountNumber =
//           abonent.electricityAccountNumber + "0";

//         return await tryToIdentify(tozaMakonApi, abonent); // qayta urinish
//       }
//     }
//     if (err.type === "brokenCaoto") {
//       await updateAbonentDetails(tozaMakonApi, abonent.id, {
//         electricityCoato: "18214",
//       });
//       return await tryToIdentify(tozaMakonApi, abonent);
//     }
//     if (err.type === "brokenETK") {
//       await updateAbonentDetails(tozaMakonApi, abonent.id, {
//         electricityAccountNumber: "9561650",
//       });
//       return await tryToIdentify(tozaMakonApi, abonent);
//     }
//     if (err.type === "brokenPasport") {
//       await updateAbonentDetails(tozaMakonApi, abonent.id, {
//         citizen: {
//           passport: "AA1234567",
//         },
//       });
//       return await tryToIdentify(tozaMakonApi, abonent);
//     }
//     if (err.type === "hasKirillOnName") {
//       const abonentDeteils = await getAbonentDetails(tozaMakonApi, abonent.id);
//       await updateAbonentDetails(tozaMakonApi, abonent.id, {
//         citizen: {
//           firstName: lotinga(abonentDeteils.citizen.firstName),
//           lastName: lotinga(abonentDeteils.citizen.lastName),
//           patronymic: lotinga(abonentDeteils.citizen.patronymic || "XXX"),
//         },
//       });
//       return await tryToIdentify(tozaMakonApi, abonent);
//     }
//     if (err.type === "brokenJSHSHIR") {
//       await updateAbonentDetails(tozaMakonApi, abonent.id, {
//         citizen: {
//           pnfl: "42907998901231",
//         },
//       });
//       return await tryToIdentify(tozaMakonApi, abonent);
//     }
//     if (err.type === "cadastrDublicate") {
//       await updateAbonentDetails(tozaMakonApi, abonent.id, {
//         house: {
//           cadastralNumber: abonent.cadastralNumber + "123",
//         },
//       });
//       return await tryToIdentify(tozaMakonApi, abonent);
//     }
//     if (err.type === "brokenCadastr") {
//       await updateAbonentDetails(tozaMakonApi, abonent.id, {
//         house: {
//           cadastralNumber: formatCustom(abonent.accountNumber),
//         },
//       });
//       return await tryToIdentify(tozaMakonApi, abonent);
//     }
//     throw error;
//   }
// }
