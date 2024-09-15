// bismillah

const cc = `https://cleancity.uz/`;
const { JSDOM } = require("jsdom");
const request = require("request");
const fs = require("fs");

const { CleanCitySession } = require("../models/CleanCitySession");
const { SudMaterial } = require("../models/SudMaterial");
const { SudAkt } = require("../models/SudAkt");
const { Mahalla } = require("../models/Mahalla");
const getAbonentData = require("../api/cleancity/dxsh/getAbonentData");
const { HybridMail } = require("../models/HybridMail");
const { getOneMailById, getPdf } = require("../api/hybrid.pochta.uz");
const ejs = require("ejs");
const { htmlPDF } = require("../requires");
const PDFMerger = require("pdf-merger-js");
const {
  enterWarningLetterToBilling,
  confirmNewWarningLetterByLicshet,
} = require("../api/cleancity/dxsh");
const { virtualConsole } = require("../api/cleancity/helpers/virtualConsole");

(async function () {
  // let res = await enterMaterialTOBilling(
  //   "./uploads/6613a5d45aded63aa13c09d9/shakl2/105120190114/ilovalar.PDF",
  //   105120190114,
  //   "ILOVALAR"
  // );
  // console.log(res);
})();

// ariza va ilovalarni billing bazasiga yuklaydigan dastur.
async function importSudMaterialsToBilling(pachka_id) {
  try {
    async function enterMaterialTOBilling(file_path, kod, fileType) {
      const session = await CleanCitySession.findOne({ type: "dxsh" });
      if (
        session.path.saveFileLink &&
        session.path.findSudProccessPath &&
        session.path.save_send_to_court
      ) {
        const date = new Date();
        let findedProcesses = await fetch(
          "https://cleancity.uz/" + session.path.findSudProccessPath,
          {
            headers: {
              accept: "application/json, text/javascript, */*; q=0.01",
              "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
              "content-type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              "sec-ch-ua":
                '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"Windows"',
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              "x-requested-with": "XMLHttpRequest",
              Cookie: session.cookie,
            },
            referrerPolicy: "strict-origin-when-cross-origin",
            body: `date1=01.01.2019&date2=${date.getDate()}.${
              date.getMonth() + 1
            }.${date.getFullYear()}&licshet=${kod}&system_companies_id=1144&page=1&rows=100&sort=id&order=desc`,
            method: "POST",
            mode: "cors",
            credentials: "include",
          }
        );
        findedProcesses = await findedProcesses.json();
        if (findedProcesses.rows.length < 1) {
          return { success: false, message: "Ma'lumot topilmadi" };
        }
        let options = {
          method: "POST",
          url: `https://cleancity.uz/${
            session.path.saveFileLink + findedProcesses.rows[0].id
          }`,
          headers: {
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
            "cache-control": "max-age=0",
            "content-type": "multipart/form-data",
            "sec-ch-ua":
              '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "iframe",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            Cookie: session.cookie,
          },
          formData: {
            file_type_id: "2",
            purpose: fileType,
            file_bytes: {
              value: fs.createReadStream(file_path),
              options: {
                filename: fileType + ".PDF",
                contentType: "application/pdf",
              },
            },
          },
        };
        console.log(file_path);

        return new Promise((resolve, reject) => {
          request(options, function (error, response) {
            if (error) reject(error);
            let obj = JSON.parse(response.body);
            resolve({
              ...obj,
              success: true,
              proccess_id: findedProcesses.rows[0].id,
            });
          });
        });
      }
      const startpage = await fetch(cc + "startpage", {
        headers: { Cookie: session.cookie },
      });
      const startpageText = await startpage.text();
      const startpageDoc = new JSDOM(startpageText, {
        virtualConsole: virtualConsole,
      }).window.document;
      const elements = startpageDoc.querySelectorAll("a");
      let toSudActionsPage = "";
      elements.forEach(function (element) {
        // Check if the text content matches "hello world"
        if (
          element.textContent.trim() === "Суд жараёнлари" ||
          element.textContent.trim() === "Sud jarayonlari"
        ) {
          // Found the element, do something with it
          toSudActionsPage = element.href;
        }
      });
      const res1 = await fetch(
        `https://cleancity.uz/dashboard/${toSudActionsPage}`,
        { headers: { Cookie: session.cookie } }
      );
      const res2 = await fetch(res1.url, {
        headers: {
          Cookie: session.cookie,
        },
      });
      const res2Text = await res2.text();
      fs.writeFileSync(
        "./text.txt",
        res2Text,
        { encoding: "utf-8" },
        (err) => {}
      );
      let findSudProccessPath = res2Text.match(
        /rownumbers:true,url:"ds\?xenc=([^']+)VDA"/g
      );
      findSudProccessPath = findSudProccessPath[0].split('"')[1];
      let saveFileLink = res2Text.match(/dsmmf\?xenc=([^']+)id='/g);
      saveFileLink = saveFileLink[0].split("'")[0];
      let sendToSud = res2Text.match(/dsmmf\?xenc=([^']+)id='/g);
      await CleanCitySession.updateOne(
        { type: "dxsh" },
        {
          $set: {
            "path.findSudProccessPath": findSudProccessPath,
            "path.saveFileLink": saveFileLink,
            "path.save_send_to_court": sendToSud[2].split("'")[0],
          },
        }
      );
      return await enterMaterialTOBilling(file_path, kod);
    }
    const pachka = await SudMaterial.findById(pachka_id);
    let counter = 0;

    async function upload() {
      if (counter === pachka.items.length)
        return { success: true, msg: "Proccess tugadi" };
      const item = pachka.items[counter];

      if (item.savedOnBilling) {
        counter++;
        console.log(item.KOD, "Kiritilgan allaqachon");
        return await upload();
      }
      const res1 = await enterMaterialTOBilling(
        `./uploads/${pachka_id}/arizalar/${item.KOD}.PDF`,
        item.KOD,
        "ARIZA"
      );
      // const res2 = await enterMaterialTOBilling(
      //   `./uploads/${pachka_id}/shakl2/${item.KOD}/ilovalar.PDF`,
      //   item.KOD,
      //   "ILOVALAR"
      // );

      // if (res1.success && res2.success) {
      const session = await CleanCitySession.findOne({ type: "dxsh" });
      const res3 = await fetch(
        `https://cleancity.uz/${
          session.path.save_send_to_court + res1.proccess_id
        }`,
        { headers: { Cookie: session.cookie } }
      );
      const newItems = pachka.items;
      const indexToUpdate = pachka.items.findIndex((a) => a.KOD == item.KOD);
      if (indexToUpdate !== -1) {
        newItems[indexToUpdate].savedOnBilling = true;
      }
      console.log(item.KOD, "Bajarildi");

      await pachka.updateOne({ $set: { items: newItems } });
      console.log(counter);
      counter++;
      await upload();
      // }
    }
    await upload();
  } catch (error) {
    console.error(error);
  }
}

// importSudMaterialsToBilling("664dc9430e5794763f32d0bd");

async function sendToSudMaterial(pachka_id) {
  const pachka = await SudMaterial.findById(pachka_id);
  let counter = 0;
  let newItems = pachka.items;
  async function update() {
    // if (counter == 200)
    //   return await pachka.updateOne({ $set: { items: newItems } });

    const item = pachka.items[counter];

    if (item.sended) {
      counter++;
      return await update();
    }
    const indexToUpdate = newItems.findIndex((a) => a.KOD == item.KOD);
    fetch(
      "https://cabinetapi.sud.uz/api/cabinet/case/send-to-court/" +
        item.sud_case_id,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "content-type": "application/json",
          responsetype: "arraybuffer",
          "sec-ch-ua":
            '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-auth-token": "932320c7-303c-41e8-b4ad-9c1a41f270d9",
        },
        referrer: "https://cabinet.sud.uz/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: "{}",
        method: "PUT",
        mode: "cors",
        credentials: "omit",
      }
    ).then(async (res) => {
      const data = await res.json().catch((err) => {
        console.log(err);
      });
      console.log(item.KOD, data);
      if (indexToUpdate !== -1 && data.id) {
        newItems[indexToUpdate].sended = true;
      } else {
        newItems[indexToUpdate].sended = data.message;
      }
      console.log(newItems[indexToUpdate]);
      counter++;
      await pachka.updateOne({ $set: { items: newItems } });
      return await update();
    });
  }
  await update();
}
async function updateMongo() {
  function bugungiSana() {
    const date = new Date();
    return `${date.getDate()}.${
      date.getMonth() + 1 < 10
        ? "0" + (date.getMonth() + 1)
        : date.getMonth() + 1
    }.${date.getFullYear()}`;
  }

  const bazagaYuklashKk = `105120500328 
  105120210883 
  105120600001 
  105120320264 
  105120440055 
  105120350185 
  105120550322 
  105120470267 
  105120310056 
  105120590125 
  105120690523 
  105120660011 
  105120590189 
  105120460197 
  105120400323 
  105120710305 
  105120630543 
  105120340527 
  105120380477 
  105120710459 
  `;
  const codes = bazagaYuklashKk.trim().split(/\s+/);
  // const mails = await HybridMail.find({isSavedBilling: false})
  let counter = 0;
  async function loop() {
    if (counter == codes.length) {
      console.log("Billingga yuklab bo'ldim.");
      return;
    }
    await HybridMail.updateOne(
      { licshet: codes[counter] },
      { $set: { isSavedBilling: true } }
    );
    counter++;
    loop();
    // const mail = await HybridMail.findOne({ licshet: codes[counter] });
    // if (mail.isSavedBilling) {
    //   counter++;
    //   loop();
    //   return;
    // }
    // const response = await getOneMailById(mail.hybridMailId);
    // const pdf = await getPdf(mail.hybridMailId);
    // if (!pdf.ok) return { success: false, message: pdf.err };
    // ejs.renderFile(
    //   "./views/hybridPochtaCash.ejs",
    //   { mail: { ...response } },
    //   (err, str) => {
    //     if (err) return console.error(err);

    //     htmlPDF
    //       .create(str, { format: "A4", orientation: "portrait" })
    //       .toFile(
    //         "./uploads/cash" + mail.hybridMailId + ".pdf",
    //         async (err, res) => {
    //           if (err) return console.error(err);
    //           let merger = new PDFMerger();
    //           console.log(pdf.filename);
    //           const convert = async () => {
    //             await merger.add(pdf.filename);

    //             await merger.add("./uploads/cash" + mail.hybridMailId + ".pdf");

    //             // Set metadata
    //             await merger.setMetadata({
    //               producer: "oliy ong",
    //               author: "Shamshod Nematullayev",
    //               creator: "Toza Hudud bot",
    //               title: "Ogohlantirish xati",
    //             });
    //             await merger.save(
    //               `./uploads/ogohlantirish_xati${mail.licshet}.PDF`
    //             );
    //           };
    //           await convert();
    //           const abonentData = await getAbonentData({
    //             licshet: mail.licshet,
    //           });
    //           if (!abonentData) {
    //             console.log(mail.licshet + ": " + "Abonent topilmadi");
    //             counter++;
    //             return loop();
    //           }
    //           console.log(`./uploads/ogohlantirish_xati${mail.licshet}.PDF`);
    //           const response = await enterWarningLetterToBilling({
    //             lischet: mail.licshet,
    //             comment: "Gibrit pochta orqali yuborilgan ogohlantirish xati",
    //             qarzdorlik: abonentData.saldo_k,
    //             sana: bugungiSana(),
    //             file_path: `./uploads/ogohlantirish_xati${mail.licshet}.PDF`,
    //           });

    //           if (response.success) {
    //             const res = await confirmNewWarningLetterByLicshet(
    //               mail.licshet
    //             );
    //             if (res.success) {
    //               await HybridMail.findByIdAndUpdate(mail._id, {
    //                 $set: { isSavedBilling: true },
    //               });
    //               counter++;
    //               console.log(counter, mail.licshet);
    //               loop();
    //             }
    //           } else {
    //             console.error(response);
    //             ctx.reply(mail.licshet + ": " + response.msg);
    //             if (response.msg == "Сумма не корректно") {
    //               console.log("Сумма не корректно");
    //               counter++;
    //               loop();
    //             }
    //           }
    //         }
    //       );
    //   }
    // );
  }
  loop();
}
// updateMongo();
// sendToSudMaterial("663dea41d85ea026bf29f561");
