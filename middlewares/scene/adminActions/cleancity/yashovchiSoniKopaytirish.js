const cc = `https://cleancity.uz/`;
const { CleanCitySession } = require("../../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");

// ========================================================================

const yashovchiSoniKopaytirish = async (litsavoy, yashovchiSoni) => {
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    const startpage = await fetch(cc + "startpage", {
      headers: { Cookie: session.cookie },
    });
    const startpageText = await startpage.text();

    // to get to find abonent url
    let url = startpageText.match(/url:\s*'ds\?xenc=([^']+)'/g);
    let urlX = startpageText.match(/action=["'](.*?)["']/g)[1].split(`"`)[1];

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
    console.log(urlX);
    const abonentData = await res.json();
    const res1 = await fetch("https://cleancity.uz/dashboard" + urlX, {
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
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `to_card_abo_hf_0=&id=${abonentData.rows[0].id}&companies_id=1144`,
      method: "POST",
      mode: "cors",
      credentials: "include",
    });
    // console.log(await res1.text());
    console.log(res1.url);
  } catch (err) {
    console.log(err);
  }
};
// yashovchiSoniKopaytirish(105120390245);
module.exports = { yashovchiSoniKopaytirish };
