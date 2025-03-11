// const { default: axios } = require("axios");
// const { bot } = require("./core/bot");
// const { Mahalla } = require("./models/Mahalla");
// const { tozaMakonApi } = require("./api/tozaMakon");
// const FormData = require("form-data");
// const { Nazoratchi, keyboards } = require("./requires");
// const { lotinga } = require("./middlewares/smallFunctions/lotinKiril");

const { Abonent, Company } = require("./requires");

const { tozaMakonApi } = require("./api/tozaMakon");
const { SudAkt } = require("./models/SudAkt");
const { Ariza } = require("./models/Ariza");

let init = 50000;
// Abonent.find().then((abonents) => {
//   let counter = init;
//   const loop = async () => {
//     if (counter == datas.length || counter >= init + 5000)
//       return console.log("jarayon yakullandi");
//     const kod = datas[counter];
//     const finded = abonents.find(
//       (abonent) => abonent.licshet == kod.accountNumber
//     );
//     if (!finded) {
//       const { data } = await tozaMakonApi.get(
//         "/user-service/residents/" + kod.id
//       );
//       await Abonent.create({
//         createdAt: new Date(),
//         energy_licshet: "",
//         fio: data.fullName,
//         id: data.id,
//         licshet: kod.accountNumber,
//         kadastr_number: data.house.cadastralNumber,
//         mahallas_id: data.mahallaId,
//         mahalla_name: data.mahallaName,
//         passport_number: data.passportNumber,
//         pinfl: data.citizen.pnfl,
//         streets_id: data.streetId,
//         streets_name: data.streetName,
//         phone: data.house.phone,
//       });
//       counter++;
//       return loop();
//     }
//     // console.log(finded);
//     counter++;
//     console.log(counter);
//     loop();
//   };
//   loop();
// });

// Nazoratchi.find().then((inspectors) => {
//   inspectors.forEach(async (inspector) => {
//     try {
//       inspector.telegram_id.forEach(async (telegram) => {
//         try {
//           await bot.telegram.sendMessage(
//             telegram,
//             `<b>⚖️ Yangilik! ✒️Sudga Xat Tugmasi Qo'shildi!</b>\n\n

// Hurmatli ${lotinga(inspector.name)}! 🎉\n\n

// Endi sizning botda <b>"✒️Sudga xat"</b> degan yangi tugma paydo bo'ldi. Ushbu tugmani bosganingizda, quyidagi jarayonlar amalga oshiriladi:\n\n

// <b>"Qo'shish"</b> degan inline tugmani tanlang.\n
// Keyin sizdan to'lov qilishdan bosh tortgan abonentlar uchun <b>hisob raqami</b> so'raladi.\n
// Kerakli ma'lumotlarni kiriting va jarayonni yakunlang! 💼💡\n\n

// Har qanday savollar bo'lsa, biz bilan bog'laning. Biz doimo yordam berishga tayyormiz! 📩

// `,
//             {
//               reply_markup: keyboards.mainKeyboard.reply_markup,
//               parse_mode: "HTML",
//             }
//           );
//         } catch (error) {
//           console.log(error);
//         }
//       });
//     } catch (error) {
//       console.error(error);
//     }
//   });
// });

// async function integrtsiya() {
//   let page = 1;
//   let counter = 0;
//   const abonents = await Abonent.find()
//     .limit(5000)
//     .skip(5000 * (page - 1));
//   console.log("integrtsiya");
//   const loop = async function () {
//     if (counter === abonents.length || page * 5000 === counter)
//       return console.log("Jarayon yakullandi");
//     const abonent = abonents[counter];
//     try {
//       if (abonent.shaxsi_tasdiqlandi?.confirm) {
//         const pasportData = await tozaMakonApi.get("/user-service/citizens", {
//           params: {
//             passport: abonent.passport_number,
//             pinfl: abonent.pinfl,
//             // birthdate: req.data.birth_date,
//           },
//         });
//         if (pasportData.status !== 200) {
//           return console.log("Pasport ma'lumotlarini olishda xatolik");
//         }
//         const abonentDatasResponse = await tozaMakonApi.get(
//           `/user-service/residents/${abonent.id}?include=translates&withPhoto=true`
//         );
//         if (!abonentDatasResponse || abonentDatasResponse.status !== 200) {
//           return console.log(
//             "Abonent dastlabki ma'lumotlarini oliishda xatolik"
//           );
//         }
//         const data = abonentDatasResponse.data;
//         const updateResponse = await tozaMakonApi.put(
//           "/user-service/residents/" + abonent.id,
//           {
//             id: abonent.id,
//             accountNumber: abonent.licshet,
//             residentType: "INDIVIDUAL",
//             electricityAccountNumber: data.electricityAccountNumber,
//             electricityCoato: data.electricityCoato,
//             companyId: data.companyId,
//             streetId: data.streetId,
//             mahallaId: data.mahallaId,
//             contractNumber: data.contractNumber,
//             contractDate: data.contractDate,
//             homePhone: null,
//             active: data.active,
//             description: data.description,
//             citizen: pasportData.data,
//             house: {
//               ...data.house,
//               cadastralNumber: data.house.cadastralNumber
//                 ? data.house.cadastralNumber
//                 : "00:00:00:00:00:0000:0000",
//             },
//           }
//         );
//         if (!updateResponse || updateResponse.status !== 200) {
//           console.log("Ma'lumotlarni yangilashda xatolik");
//         }
//       }
//       console.log(counter);
//       counter++;
//       loop();
//     } catch (error) {
//       console.error(error);
//     }
//   };
//   loop();
// }
// // integrtsiya();
const func = async () => {
  const sudAktlari = await SudAkt.find({ akt: { $exists: 0 } }).lean();
  console.log(sudAktlari.length);
  for (let akt of sudAktlari) {
    try {
      const month = akt.createdAt.getMonth() + 1;
      const year = akt.createdAt.getFullYear();
      const abonent = await Abonent.findOne({ licshet: akt.licshet });
      const rows = (
        await tozaMakonApi.get("/billing-service/resident-balances/dhsh", {
          params: {
            residentId: abonent.id,
            page: 0,
            size: 30,
          },
        })
      ).data.content;
      const rows2 = rows.filter(
        (row) => row.god > year || (row.god === year && row.mes > month)
      );
      let allPayments = 0;
      let allActs = 0;
      rows2.forEach((row) => {
        allPayments += row.allPaymentsSum;
        allActs += row.actAmount;
      });
      await SudAkt.findByIdAndUpdate(akt._id, {
        $set: { tushum: allPayments, akt: allActs },
      });
      console.log(allActs, akt.licshet);
    } catch (error) {
      console.error(akt, "xato");
      console.error(error);
    }
  }
  console.log("Jarayon yakullandi");
};
// func();

// (async () => {
//   const rows = require("./main.json");
//   for (let row of rows) {
//     const { status } = await tozaMakonApi.patch(
//       "/user-service/residents/identified",
//       {
//         identified: true,
//         residentIds: [row.ID],
//       }
//     );
//     console.log(row, status);
//   }
// })();

// (async () => {
//   const rows = require("./main.json");
//   for (let row of rows) {
//     const ariza = await Ariza.findOne({ akt_id: row.id });
//     const abonent = await Abonent.findOne({ licshet: ariza.licshet });
//     const company = await Company.findOne({ id: 1144 });
//     const amounts = (
//       await tozaMakonApi.get("/billing-service/acts/calculate-amount", {
//         params: {
//           actPackId: company.akt_pachka_ids.dvaynik.id,
//           residentId: abonent.id,
//           inhabitantCount: 0,
//           kSaldo: 0,
//           startPeriod: "03.2025",
//           endPeriod: "03.2025",
//         },
//       })
//     ).data;
//     await tozaMakonApi.post("/billing-service/acts", {
//       actPackId: company.akt_pachka_ids.gps.id,
//       actType: amounts.actType,
//       amount: amounts.amount,
//       amountWithQQS: amounts.amountWithQQS,
//       amountWithoutQQS: 0,
//       description: `kamchiliklarni bartaraf etish`,
//       startPeriod: "03.2025",
//       endPeriod: "03.2025",
//       fileId: ariza.aktInfo.fileId,
//       kSaldo: 0,
//       residentId: abonent.id,
//       inhabitantCount: 0,
//     });
//   }
// })();
