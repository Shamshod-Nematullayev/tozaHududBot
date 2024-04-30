const { CleanCitySession } = require("../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const { Abonent } = require("../../../models/Abonent");
const cc = `https://cleancity.uz/`;

async function enterYashovchiSoniAkt({
  licshet,
  prescribed_cnt,
  comment,
  filepath,
  stack_prescribed_akts_id,
  akt_number,
}) {
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    if (!session.path.enterYashovchiSoniAkt) {
      const startpage = await fetch(cc + "startpage", {
        headers: { Cookie: session.cookie },
      });
      const startpageText = await startpage.text();
      const startpageDoc = new JSDOM(startpageText).window.document;
      const elements = startpageDoc.querySelectorAll("a");
      let yashovchiSoniAktlarPage = "";
      elements.forEach(function (element) {
        // Check if the text content matches "hello world"

        if (
          element.textContent.trim() ===
            "Яшовчилар сонини ўзгартириш актлари" ||
          element.textContent.trim() ===
            "Yashovchilar sonini o`zgartirish aktlari"
        ) {
          // Found the element, do something with it
          yashovchiSoniAktlarPage = element.href;
        }
      });
      const res1 = await fetch(
        `https://cleancity.uz/dashboard/${yashovchiSoniAktlarPage}`,
        { headers: { Cookie: session.cookie } }
      );
      const res2 = await fetch(res1.url, {
        headers: {
          Cookie: session.cookie,
        },
      });
      const res2Text = await res2.text();
      let enterYashovchiSoniAktPath = res2Text
        .match(/dsm\?xenc=([^']+)'/g)[0]
        .split("'")[0];
      if (!enterYashovchiSoniAktPath)
        return { success: false, message: "Session has expired" };

      await session.updateOne({
        $set: {
          "path.enterYashovchiSoniAkt": enterYashovchiSoniAktPath,
        },
      });
      return await enterYashovchiSoniAkt(arguments);
    } else {
      const date = new Date();
      const abonent = await Abonent.findOne({ licshet });
      let options = {
        method: "POST",
        url: `https://cleancity.uz/` + session.path.enterYashovchiSoniAkt,
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
          abonents_id: abonent.id,
          mes: date.getMonth() + 1,
          god: date.getFullYear(),
          resource_types_id: 20,
          stack_prescribed_akts_id,
          akt_number,
          //   akt_date: ,
          file_bytes: {
            value: fs.createReadStream(file_path),
            options: {
              filename: lischet + ".PDF",
              contentType: "application/pdf",
            },
          },
        },
      };
    }
  } catch (err) {
    console.error(new Error(err));
  }
}

module.exports = { enterYashovchiSoniAkt };
