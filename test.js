const getAbonentDXJ = require("./api/cleancity/dxsh/getAbonentDXJ");
const {
  sudQaroruChiqorildiStatusigaUtkazish,
} = require("./api/cleancity/dxsh/sudQaroriChiqorildiStatusigaUtkazish");
const {
  sudXujjatlariBiriktirish,
} = require("./api/cleancity/dxsh/sudXujjatlariBiriktirish");
const {
  uploadFileToBilling,
} = require("./api/cleancity/helpers/uploadFileToBilling");
const { CaseDocument } = require("./models/CaseDocuments");
const { HybridMail } = require("./models/HybridMail");
const { SudAkt } = require("./models/SudAkt");

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

// =======================Prokratura arizasi yaratish==============
const ejs = require("ejs");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const { Abonent, xlsx, changeAbonentDates } = require("./requires");
const { Mahalla } = require("./models/Mahalla");

async () => {
  const oylar = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];
  const now = new Date();
  const qrData = await new Promise((resolve, reject) => {
    QRCode.toDataURL("Enangniki", (err, url) => {
      if (err) reject(err);
      resolve(url);
    });
  });
  ejs.renderFile(
    "./views/arizaProkuratura.ejs",
    {
      rows: [
        {
          KOD: "105120500123",
          FISH: "Mustafaqulov Jasurbek",
          MFY: "Qo'shtepa MFY",
          STREET: "G'o'lva qishloq",
          QARZ: "501630",
          PINFL: "31521545621002",
        },
      ],
      kun: now.getDate(),
      oy: oylar[now.getMonth()],
      qrData,
    },
    (err, str) => {
      if (err) console.log(err);
      fs.writeFile("./uploads/testProkraturaAriza.html", str, (err) => {
        if (err) throw err;
        console.log("Prokratura fayl yaratildi");
      });
    }
  );
}; //();

// export abonents
async () => {
  let abonents = await Abonent.find({}, { photo: 0 });
  const content = [];
  abonents = abonents.sort((a, b) => a.fio.localeCompare(b.fio));
  abonents.forEach((abonent, i) => {
    content.push({
      tartib: i + 1,
      licshet: abonent.licshet,
      fio: abonent.fio,
      fio2: `${abonent.last_name} ${abonent.first_name} ${abonent.middle_name}`,
      street: abonent.mahallas_id,
      kadastr_number: abonent.kadastr_number,
      passport: abonent.passport_number,
      pinfl: abonent.pinfl,
      confirm: abonent.shaxsi_tasdiqlandi?.confirm,
    });
  });

  const data = [
    {
      Sheet: "Abonents",
      columns: [
        { label: "№", value: "tartib" },
        { label: "Лицевой", value: "licshet" },
        { label: "ФИО--", value: "fio" },
        { label: "ФИО--2", value: "fio2" },
        { label: "Кўча", value: "street" },
        { label: "Кадастр", value: "kadastr_number" },
        { label: "ПАССПОРТ", value: "passport" },
        { label: "ЖШШИР", value: "pinfl" },
        { label: "Шахси тасдиқланди", value: "confirm" },
      ],
      content,
    },
  ];

  const fileName = "./uploads/abonents1";
  let settings = {
    fileName: fileName,
    extraLength: 3,
    writeMode: "writeFile",
    writeOptions: {},
  };
  await xlsx(data, settings);
  console.log("Bajarildi");
}; //();

// To'g'ri etk kodlarni bazaga import qilish
async () => {
  const etk_abonents = require("./lib/etk_baza.json");
  const rows = require("./main.json");
  console.log("Jarayon boshlandi");
  const promises = rows.map((row) => {
    return new Promise(async (resolve, reject) => {
      const abonent = await Abonent.findOne({ licshet: row.licshet });
      const etk = etk_abonents.find((a) => a.CUSTOMER_CODE == row.etk);
      let res = await changeAbonentDates({
        abonent_id: abonent.id,
        abo_data: {
          description: `FIO bo'yicha ETK kod to'g'ri deb tasdiqlandi`,
          energy_licshet: etk.CUSTOMER_CODE,
          energy_coato: "18214",
          phone: etk.MOBILE_PHONE ? etk.MOBILE_PHONE : undefined,
        },
      });
      if (res.msg == "Кадастр рақам формати нотоғри киритилди") {
        res = await changeAbonentDates({
          abonent_id: abonent.id,
          abo_data: {
            description: `FIO bo'yicha ETK kod to'g'ri deb tasdiqlandi`,
            energy_licshet: etk.CUSTOMER_CODE,
            energy_coato: "18214",
            phone: etk.MOBILE_PHONE ? etk.MOBILE_PHONE : undefined,
            kadastr_number: "",
          },
        });
      }
      if (!res.success) {
        return console.log(res.msg);
      }

      await Abonent.findByIdAndUpdate(abonent._id, {
        $set: {
          ekt_kod_tasdiqlandi: {
            confirm: true,
            inspector_id: 29624,
            inspector_name: `Шамшод Неъматуллаев`,
            updated_at: new Date(),
          },
          energy_licshet: etk.CUSTOMER_CODE,
        },
      });
      return resolve("Etk hisob raqami muvaffaqqiyatli kiritildi");
    });
  });
  await Promise.all(promises);
  console.log("Jarayon tugadi");
}; //();
