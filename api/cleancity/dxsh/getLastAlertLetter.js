const { Abonent } = require("../../../models/Abonent");
const { CleanCitySession } = require("../../../models/CleanCitySession");
const cc = `https://cleancity.uz/`;
const { JSDOM } = require("jsdom");
const fs = require("fs");
const https = require("https");

async function getLastAlertLetter(kod) {
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    if (session.path.findResourceId && session.path.findSudProccessPath) {
      const date = new Date();
      let findedProcesses = await fetch(
        "https://cleancity.uz/" + session.path.findSudProccessPath,
        {
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
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

      let resourses = await fetch(
        "https://cleancity.uz/" + session.path.findResourceId,
        {
          headers: {
            accept: "*/*",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
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
          body: "sud_processes_id=" + findedProcesses.rows[0].id,
          method: "POST",
          mode: "cors",
          credentials: "include",
        }
      );
      resourses = await resourses.json();
      return new Promise((resolve, reject) => {
        const filename = `./uploads/ogohlantirishXatlar/${kod}.PDF`;
        const writeStream = fs.createWriteStream(filename);
        https.get(
          `https://cleancity.uz/rsview?id=` + resourses.rows[0].resources_id,
          (res) => {
            res.pipe(writeStream);
            writeStream.on("finish", () => {
              resolve({
                success: true,
                filename,
              });
            });
            writeStream.on("error", (err) => {
              reject(err);
            });
          }
        );
      });
    } else {
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
      console.log(res1.url);

      const res2Text = await res2.text();
      let findSudProccessPath = res2Text.match(
        /rownumbers:true,url:"ds\?xenc=([^']+)VDA"/g
      );
      findSudProccessPath = findSudProccessPath[0].split('"')[1];
      let findResourceId = res2Text.match(/post\('ds\?xenc=([^']+)'/g);
      findResourceId = findResourceId[0].split("'")[1];
      await CleanCitySession.updateOne(
        { type: "dxsh" },
        {
          $set: {
            "path.findSudProccessPath": findSudProccessPath,
            "path.findResourceId": findResourceId,
          },
        }
      );
      getLastAlertLetter(kod);
    }
  } catch (error) {
    throw error;
  }
}

module.exports = { getLastAlertLetter };
