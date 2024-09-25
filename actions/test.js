const { CaseDocument } = require("../models/CaseDocuments");
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
            if (existingDocument) return;
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
      console.log(counter);
      counter++;
      loop();
    }
    loop();
  } catch (error) {
    console.error(error);
  }
}
//updateMongo();
