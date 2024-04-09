const { CleanCitySession } = require("../../../models/CleanCitySession");
const request = require("request");
const cc = "https://cleancity.uz/";
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
// const FormData = require("form-data");

async function enterWarningLetterToBilling({
  lischet,
  file_path,
  qarzdorlik,
  sana,
  comment,
}) {
  const session = await CleanCitySession.findOne({ type: "dxsh" });

  if (session.path.enterWarningLetterToBilling) {
    let options = {
      method: "POST",
      url: `https://cleancity.uz/${session.path.enterWarningLetterToBilling}&resource_types_id=15&system_companies_id=1144&licshet=${lischet}`,
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
        to_sud_proccess: "0",
        abonents_id: "",
        resource_types_id: "15",
        amount: qarzdorlik,
        warning_date: sana,
        purpose: comment,
        file_bytes: {
          value: fs.createReadStream(file_path),
          options: {
            filename: lischet + ".PDF",
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
  } else {
    const startpage = await fetch(cc + "startpage", {
      headers: { Cookie: session.cookie },
    });
    const startpageText = await startpage.text();
    const startpageDoc = new JSDOM(startpageText).window.document;
    const elements = startpageDoc.querySelectorAll("a");
    let warningLettersPage = "";
    elements.forEach(function (element) {
      // Check if the text content matches "hello world"

      if (
        element.textContent.trim() === "Суд огоҳлантириш" ||
        element.textContent.trim() === "Sud ogohlantirish"
      ) {
        // Found the element, do something with it
        warningLettersPage = element.href;
      }
    });
    const res1 = await fetch(
      `https://cleancity.uz/dashboard/${warningLettersPage}`,
      { headers: { Cookie: session.cookie } }
    );
    const res2 = await fetch(res1.url, {
      headers: {
        Cookie: session.cookie,
      },
    });
    const res2Text = await res2.text();
    let findSudProccessPath = res2Text.match(/dsmmf\?xenc=([^']+)==/g);
    if (!findSudProccessPath)
      return { success: false, message: "Session has expired" };
    await session.updateOne({
      $set: { "path.enterWarningLetterToBilling": findSudProccessPath[0] },
    });
    return enterWarningLetterToBilling(arguments);
  }
}

module.exports = { enterWarningLetterToBilling };
