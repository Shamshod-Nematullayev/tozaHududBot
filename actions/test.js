const getAbonentDXJ = require("../api/cleancity/dxsh/getAbonentDXJ");
const {
  sudQaroruChiqorildiStatusigaUtkazish,
} = require("../api/cleancity/dxsh/sudQaroriChiqorildiStatusigaUtkazish");
const {
  sudXujjatlariBiriktirish,
} = require("../api/cleancity/dxsh/sudXujjatlariBiriktirish");
const {
  uploadFileToBilling,
} = require("../api/cleancity/helpers/uploadFileToBilling");
const { CaseDocument } = require("../models/CaseDocuments");
const { HybridMail } = require("../models/HybridMail");
const { SudAkt } = require("../models/SudAkt");

async function updateMongo() {
  try {
    const sudAkts = await SudAkt.find();
    let counter = 0;
    async function loop() {
      console.log(counter);
      if (counter === sudAkts.length) return console.log("Jarayon yakunlandi");

      const akt = sudAkts[counter];
      if (!akt.sud_case_id) {
        counter++;
        return loop();
      }
      const caseDocuments = await (
        await fetch(
          "https://cabinetapi.sud.uz/api/cabinet/case/case-documents/" +
            akt.sud_case_id,
          {
            headers: {
              accept: "application/json, text/plain, */*",
              "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
              "content-type": "application/json",
              responsetype: "arraybuffer",
              "sec-ch-ua":
                '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"Windows"',
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-site",
              "x-auth-token": process.env.CABINET_SUD_X_TOKEN,
            },
            referrer: "https://cabinet.sud.uz/",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "omit",
          }
        )
      ).json();
      const promises = caseDocuments.map((document) => {
        return new Promise(async (resolve, reject) => {
          try {
            const existingDocument = await CaseDocument.findOne({
              document_id: document.id,
            });
            if (existingDocument) return resolve("Avval kiritilgan");
            await CaseDocument.create({
              case_id: document.case_id,
              document_id: document.id,
              file_id: document.file_id,
              id: document.id,
              owner_name: document.owner_name,
              sudAktId: akt.sud_process_id_billing,
            });
            resolve("Successfull done");
          } catch (error) {
            reject(error);
          }
        });
      });
      await Promise.all(promises);
      counter++;
      loop();
    }
    loop();
  } catch (error) {
    console.error(error);
  }
}

// updateMongo();
async function upload() {
  const case_documents = await CaseDocument.find();
  let counter = 8000;
  async function loop() {
    if (counter === case_documents.length)
      return console.log("Jarayon yakunlandi");

    const document = case_documents[counter];
    if (document.isSavedBilling) {
      counter++;
      return loop();
    }
    console.log(counter, document);
    if (document.file_id == null) {
      counter++;
      return loop();
    }
    // file yuklab olish
    const file = await (
      await fetch(
        "https://cabinetapi.sud.uz/api/cabinet/case/download_as_buffer/" +
          document.file_id,
        {
          headers: {
            accept: "application/json, text/plain, */*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
            "content-type": "application/json",
            responsetype: "arraybuffer",
            "sec-ch-ua":
              '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "x-auth-token": process.env.CABINET_SUD_X_TOKEN,
          },
          referrer: "https://cabinet.sud.uz/",
          referrerPolicy: "strict-origin-when-cross-origin",
          body: null,
          method: "GET",
          mode: "cors",
          credentials: "omit",
        }
      )
    ).json();
    let fileTypeId = 3;
    const fileBuffer = Buffer.from(file.data, "base64");
    if (document.owner_name !== "GULMIRA DJUMAYEVA TADJIYEVNA") {
      const sudAkt = await SudAkt.findOne({
        sud_process_id_billing: document.sudAktId,
      });
      fileTypeId = 2;
      // sud qarori chiqarildi statusiga o'tkazish;
      // if (!sudAkt.sudQaroriBillinggaYuklandi) {
      //   const res = await sudQaroruChiqorildiStatusigaUtkazish(
      //     document.sudAktId
      //   );
      //   if (!res.success) return;
      // }
    }
    const result = await sudXujjatlariBiriktirish({
      process_id: document.sudAktId,
      file_type_id: fileTypeId,
      file_name: file.name,
      file_buffer: fileBuffer,
    });
    if (result.success) {
      await document.updateOne({ $set: { isSavedBilling: true } });
    }
    counter++;
    loop();
  }
  loop();
}
// upload();

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<KERAKLI>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Sudga chiqganidan buyon jami qancha tushum tushganini hisoblaydigan funksiya
// (async () => {
//   const sudAkts = await SudAkt.find();
//   counter = 0;
//   async function loop() {
//     if (counter === sudAkts.length) return console.log("Jarayon yakunlandi");
//     const document = sudAkts[counter];
//     try {
//       if (document.isDelete) {
//         counter++;
//         return loop();
//       }
//       console.log(counter);
//       const processStartedMonth = new Date(document.warningDate).getMonth() + 1;
//       const processStartedYear = new Date(document.warningDate).getFullYear();
//       const res = await getAbonentDXJ({ licshet: document.licshet });
//       const sudgaChiqgandanKeyingiDavr = res.rows.filter(
//         (a) =>
//           (a.god == processStartedYear && a.mes >= processStartedMonth) ||
//           a.god > processStartedYear
//       );
//       let tushumlar = 0;
//       sudgaChiqgandanKeyingiDavr.forEach((davr) => {
//         tushumlar += Math.floor(
//           Number(davr.saldo_n) + Number(davr.nachis) - Number(davr.saldo_k)
//         );
//       });
//       await document.updateOne({ $set: { tushum: tushumlar } });
//       counter++;
//       loop();
//     } catch (error) {
//       console.log(document);
//       console.error(error);
//     }
//   }
//   loop();
// })();
