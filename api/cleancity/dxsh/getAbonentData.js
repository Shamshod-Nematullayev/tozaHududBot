const { Abonent } = require("../../../models/Abonent");
const { CleanCitySession } = require("../../../models/CleanCitySession");
const cc = "https://cleancity.uz/";
const { JSDOM } = require("jsdom");

module.exports.getAbonentDataByLicshet =
  async function getAbonentDataByLicshet({ licshet }) {
    try {
      const session = await CleanCitySession.findOne({ type: "dxsh" });

      const abonent = await Abonent.findOne({ licshet });

      if (!session.path.getAboDataUrl) {
        const startpage = await fetch(cc + "startpage", {
          headers: { Cookie: session.cookie },
        });
        const startpageText = await startpage.text();

        const startpageDoc = new JSDOM(startpageText).window.document;
        let toCardAboUrl = startpageDoc
          .getElementById("to_card_abo")
          .getAttribute("action");

        // Abonent kartasini topish manzili mavjud bo'lganida
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
        const updateAboDataUrl = responseText
          .match(/url_upd\s*=\s*'([^']*)'/g)[0]
          .split("'")[1];

        const getAboDataUrl = responseText
          .match(/ds\?xenc=([^']*)'/g)[2]
          .split("'")[0];
        await session.updateOne({
          $set: {
            "path.updateAboDataUrl": updateAboDataUrl,
            "path.getAboDataUrl": getAboDataUrl,
          },
        });
        return await getAbonentDataByLicshet(arguments[0]);
      }

      let abonent_data = await fetch(
        "https://cleancity.uz/" + session.path.getAboDataUrl,
        {
          headers: {
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
            "cache-control": "max-age=0",
            "content-type": "application/x-www-form-urlencoded",
            "sec-ch-ua":
              '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "iframe",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            Cookie: session.cookie,
          },
          referrerPolicy: "strict-origin-when-cross-origin",
          body: `abonents_id=${abonent.id}&module_name=AbonentCardModule`,
          method: "POST",
          mode: "cors",
          credentials: "include",
        }
      );
      return await abonent_data.json();
    } catch (err) {
      console.error(err);
      return { success: false, msg: "Error on getAbonentData" };
    }
  };
