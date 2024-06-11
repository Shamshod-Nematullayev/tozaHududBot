// bismillah

const cc = `https://cleancity.uz/`;
const { JSDOM } = require("jsdom");
const request = require("request");
const fs = require("fs");

const { CleanCitySession } = require("../models/CleanCitySession");
const { SudMaterial } = require("../models/SudMaterial");
const { Mahalla } = require("../models/Mahalla");

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
      const startpageDoc = new JSDOM(startpageText).window.document;
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

// sendToSudMaterial("663dea41d85ea026bf29f561");
