// const { default: axios } = require("axios");
// const { bot } = require("./core/bot");
// const { Mahalla } = require("./models/Mahalla");
// const { tozaMakonApi } = require("./api/tozaMakon");
// const FormData = require("form-data");
// const { Nazoratchi, keyboards } = require("./requires");
// const { lotinga } = require("./middlewares/smallFunctions/lotinKiril");

const { Abonent } = require("./requires");

// Mahalla.find().then(async (mahallalar) => {
//   let counter = 49;
//   const loop = async () => {
//     if (counter === mahallalar.length) {
//       return console.log("Jarayon yakullandi");
//     }
//     const mahalla = mahallalar[counter];
//     if (mahalla.ommaviy_shartnoma?.file_id) {
//       const dataTg = await bot.telegram.getFileLink(
//         mahalla.ommaviy_shartnoma.file_id
//       );
//       const data = await axios.get(dataTg.href, {
//         responseType: "arraybuffer",
//       });
//       const pdfBuffer = Buffer.from(data.data, "binary");
//       const formData = new FormData();
//       formData.append("file", pdfBuffer, {
//         filename: mahalla.ommaviy_shartnoma.filename,
//         contentType: "application/pdf",
//       });
//       const fileDataBilling = (
//         await tozaMakonApi.post(
//           "file-service/buckets/upload?folderType=PUBLIC_MAHALLA_CONTRACTS",
//           formData,
//           {
//             headers: {
//               "Content-Type": "multipart/form-data",
//             },
//           }
//         )
//       ).data;
//       await tozaMakonApi.patch("user-service/mahallas/" + mahalla.id, {
//         id: mahalla.id,
//         publicOfferFileId:
//           fileDataBilling.fileName + "*" + fileDataBilling.fileId,
//       });
//       await mahalla.updateOne({
//         $set: {
//           publicOfferFileId:
//             fileDataBilling.fileName + "*" + fileDataBilling.fileId,
//         },
//       });
//       counter++;
//       loop();
//       console.log(counter);
//       return;
//     }
//     counter++;
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


