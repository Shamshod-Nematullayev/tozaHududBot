const cc = `https://cleancity.uz/`;
const { CleanCitySession } = require("../../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");

// ========================================================================

const yangiAbonent = async (
  mfy_id,
  fish,
  street_id,
  yashovchi_soni,
  kadastr_number,
  phone,
  passport_number,
  pinfl
) => {
  const date = new Date();
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    const startpage = await fetch(cc + "startpage", {
      headers: { Cookie: session.cookie },
    });
    const startpageText = await startpage.text();

    // let url = startpageText.match(/href="?x=([^"]+)'/g);
    // console.log(url);
    const startpageDoc = new JSDOM(startpageText).window.document;
    let find_abonents_page_url = startpageDoc
      .querySelector(
        "#g_acccordion > div > div:nth-child(1) > ul > li:nth-child(1) > a"
      )
      .getAttribute("href");
    const abonents_page_url = await fetch(cc + find_abonents_page_url, {
      headers: { Cookie: session.cookie },
    });
    const abonents_page_res = await fetch(abonents_page_url.url, {
      headers: { Cookie: session.cookie },
    });
    const abonents_page_text = await abonents_page_res.text();
    const match_new_abonent_url = abonents_page_text
      .match(/url\s*=\s*'([^']+)'/g)[3]
      .split("'")[1]; //uchinchi topilgan url yangi abonent ochish yo'li
    const matched_get_litschet_url = abonents_page_text
      .match(/\$\.post\(\'ds\?xenc=([^'";\s]+)/g)[9]
      .split("'")[1]; //[3].split("'")[1]; //uchinchi topilgan url yangi abonent ochish yo'li

    console.log({ matched_get_litschet_url });
    return;
    const res = await fetch(cc + `${url[1].split("'")[1]}`, {
      method: "POST",
      headers: {
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua":
          '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        Cookie: session.cookie,
      },
      referrer: "https://cleancity.uz/startpage",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `companies_id=1144&licshet=${litsavoy}&module_name=StaffBottomHeader&page=1&rows=20&sort=licshet&order=asc`,
      mode: "cors",
      credentials: "include",
    });

    const abonent_data = (await res.json()).rows[0];
    const response = await fetch(
      "https://cleancity.uz/dashboard" + to_card_abo_url,
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
        body: `to_card_abo_hf_0=&id=${abonent_data.id}&companies_id=1144`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      }
    );

    const card_abonent_response = fetch(response.url, {
      headers: { Cookie: session.cookie },
    });
    const responseText = await response.text();
    const inrementLiversUrl = responseText
      .match(/url\s*=\s*'([^']+)'/g)[3]
      .split("'")[1];

    const incrementResponse = await fetch(
      "https://cleancity.uz/" +
        inrementLiversUrl +
        `${date.getMonth() + 1}&god=${date.getFullYear()}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Cookie: session.cookie,
        },
        body: `id=${abonent_data.id}&prescribed_cnt=${yashovchiSoni}&description=increment_from_telegram_bot`,
      }
    );
    const final = await incrementResponse.json();
    return final; // Return the 'final' variable
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};
module.exports = { yangiAbonent };
