// bismillah

const cc = `https://cleancity.uz/`;
const { JSDOM } = require("jsdom");
const request = require("request");
const fs = require("fs");

const { CleanCitySession } = require("../models/CleanCitySession");
const { SudMaterial } = require("../models/SudMaterial");

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

        return new Promise((resolve, reject) => {
          request(options, function (error, response) {
            if (error) reject(error);
            resolve(JSON.parse(response.body));
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
        if (element.textContent.trim() === "Суд жараёнлари") {
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
      let findSudProccessPath = res2Text.match(
        /rownumbers:true,url:"ds\?xenc=([^']+)VDA"/g
      );
      findSudProccessPath = findSudProccessPath[0].split('"')[1];
      let saveFileLink = res2Text.match(/dsmmf\?xenc=([^']+)id='/g);
      saveFileLink = saveFileLink[0].split("'")[0];
      await CleanCitySession.updateOne(
        { type: "dxsh" },
        {
          $set: {
            "path.findSudProccessPath": findSudProccessPath,
            "path.saveFileLink": saveFileLink,
            "path.save_send_to_court": saveFileLink[2].split("'")[0],
          },
        }
      );
      return await enterMaterialTOBilling(file_path, kod);
    }
    const pachka = await SudMaterial.findById(pachka_id);
    let counter = 0;
    if (counter === pachka.items.length)
      return { success: true, msg: "Proccess tugadi" };
    const item = pachka.items[counter];
  } catch (error) {
    console.error(error);
  }
}
