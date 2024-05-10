const { Abonent } = require("../../../models/Abonent");
const { CleanCitySession } = require("../../../models/CleanCitySession");
const cc = `https://cleancity.uz/`;
const { JSDOM } = require("jsdom");

async function getAbonentDXJ({ licshet }) {
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    const abonent = await Abonent.findOne({ licshet });
    if (!abonent) {
      return { success: false, msg: `abonent not found on mongodb` };
    }

    if (!session.path.toCardAboUrl || 1) {
      const startpage = await fetch(cc + "startpage", {
        headers: { Cookie: session.cookie },
      });
      const startpageText = await startpage.text();
      const startpageDoc = new JSDOM(startpageText).window.document;
      let toCardAboUrl = startpageDoc
        .getElementById("to_card_abo")
        .getAttribute("action");
      const abonentCardPage = await fetch(
        "https://cleancity.uz/dashboard" + toCardAboUrl,
        {
          headers: {
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
            "cache-control": "max-age=0",
            "content-type": "application/x-www-form-urlencoded",
            "sec-ch-ua":
              '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            Cookie: session.cookie,
          },
          referrerPolicy: "strict-origin-when-cross-origin",
          body: `to_card_abo_hf_0=&id=${abonent.id}&companies_id=1144`,
          method: "POST",
          mode: "cors",
          credentials: "include",
        }
      );

      const responseText = await abonentCardPage.text();

      const findedUrls = responseText
        .match(/url:"ds\?xenc=([^']{107})="/g)[2]
        .split(`"`)[1];

      // index 2 =    aktlar haqida ma'lumot
      // index 1 =    dxj
      const res = await fetch("https://cleancity.uz/" + findedUrls, {
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "sec-ch-ua":
            '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          Cookie: session.cookie,
        },
        referrer: "https://cleancity.uz/startpage?x=uClGJQog3-t34nu-YGpa8g",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: "page=1&rows=20&sort=id&order=desc",
        method: "POST",
        mode: "cors",
        credentials: "include",
      });

      console.log(findedUrls);
      console.log(await res.json());
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = { getAbonentDXJ };
