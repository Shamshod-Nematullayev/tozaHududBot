const {
  uploadFileToBilling,
} = require("../api/cleancity/helpers/uploadFileToBilling");
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
      console.log(counter);
      counter++;
      loop();
    }
    loop();
  } catch (error) {
    console.error(error);
  }
}
// updateMongo();
// fetch("https://cleancity.uz/dsm?xenc=Z31Qj75w-6Z_brILYFHKMOlc6fnmmcKOORB4iPMbWQWchF--BPQegmDomQJ-UbEGUneamfOYni_5Zrj95X1QwA==", {
//   "headers": {
//     "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//     "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
//     "cache-control": "max-age=0",
//     "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryTrjTe4BmfpZrF2fw",
//     "sec-ch-ua": "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Windows\"",
//     "sec-fetch-dest": "iframe",
//     "sec-fetch-mode": "navigate",
//     "sec-fetch-site": "same-origin",
//     "sec-fetch-user": "?1",
//     "upgrade-insecure-requests": "1"
//   },
//   "referrer": "https://cleancity.uz/dashboard?x=IGvFbewFk1K0i7cRe1GYP*Lly8dQxkeJ0kDK5zFLW0Ys5-YQB82DDTXcajud8fn-KcijQ*YDzmlRq2wf1MtfMA",
//   "referrerPolicy": "strict-origin-when-cross-origin",
//   "body": "------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"abonents_id\"\r\n\r\n12529555\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"osv_id\"\r\n\r\n441507746\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"resource_types_id\"\r\n\r\n12\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"stack_akts_id\"\r\n\r\n4441923\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"saldo_k\"\r\n\r\n178242.84\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"phone\"\r\n\r\n\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"akt_number\"\r\n\r\n\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"akt_types_id\"\r\n\r\n1\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"akt_date\"\r\n\r\n24.09.2024\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"amount\"\r\n\r\n5\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"purpose\"\r\n\r\n\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw\r\nContent-Disposition: form-data; name=\"file_bytes\"; filename=\"2.PDF\"\r\nContent-Type: application/pdf\r\n\r\n\r\n------WebKitFormBoundaryTrjTe4BmfpZrF2fw--\r\n",
//   "method": "POST",
//   "mode": "cors",
//   "credentials": "include"
// });
async () => {
  const session = {
    cookie: "JSESSIONID=B49FDC2B30EC43D57CE3BE1B980EBADB.thweb8",
  };
  console.log("sudga so'rov ketdi");
  const fileFromSud = require("../api/cleancity/helpers/kk.json");
  const fileBuffer = Buffer.from(fileFromSud.data, "base64");
  console.log("file yuklab olindi");
  const res = await uploadFileToBilling({
    url_path:
      "dsm?xenc=Z31Qj75w-6Z_brILYFHKMOlc6fnmmcKOORB4iPMbWQWchF--BPQegmDomQJ-UbEGUneamfOYni_5Zrj95X1QwA==",
    fileName: fileFromSud.name,
    session,
    fileBuffer,
    otherFormDataParams: {
      abonents_id: 12529555,
      osv_id: 441507746,
      resource_types_id: 12,
      stack_akts_id: 4441923,
      saldo_k: 178242.84,
      phone: "",
      akt_number: "",
      akt_types_id: 1,
      akt_date: "24.09.2024",
      amount: 5,
      purpose: "",
    },
  });
  console.log(res);
};
