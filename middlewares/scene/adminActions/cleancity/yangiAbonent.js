const cc = `https://cleancity.uz/`;
const { CleanCitySession } = require("../../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");

// ========================================================================

const yangiAbonent = async ({
  mfy_id,
  fish,
  street_id,
  yashovchi_soni,
  kadastr_number,
  phone,
  passport_number,
  pinfl,
}) => {
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
    const new_abonent_url = abonents_page_text
      .match(/url\s*=\s*'([^']+)'/g)[2]
      .split("'")[1]; //uchinchi topilgan url yangi abonent ochish yo'li

    // return;
    const get_litschet_url = abonents_page_text
      .match(/\$\.post\(\'ds\?xenc=([^'";\s]+)/g)[9]
      .split("'")[1]; //[3].split("'")[1]; //uchinchi topilgan url yangi abonent ochish yo'li

    let availableKOD = await fetch(cc + get_litschet_url, {
      method: "POST",
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: session.cookie,
      },
      body: `mahallas_id=${mfy_id}&companies_id=1144`,
    });
    availableKOD = await availableKOD.json();
    // return;
    let finalResponse = await fetch("https://cleancity.uz/" + new_abonent_url, {
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
        "sec-fetch-dest": "iframe",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        Cookie: session.cookie,
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `id=&fio=${fish}&prescribed_cnt=${yashovchi_soni}&mahallas_id=${mfy_id}&licshet=${
        availableKOD.value
      }&streets_id=${street_id}&kadastr_number=${kadastr_number}&headquarters_id=&ind=&house=&flat=&house_type_id=1&inn=&contract_number=&contract_date=${
        date.getDate() > 9 ? date.getDate() : "0" + date.getDate()
      }.${
        date.getMonth() + 1 > 9
          ? date.getMonth() + 1
          : "0" + date.getMonth() + 1
      }.${date.getFullYear()}&energy_licshet=&energy_coato=&phone=&home_phone=&email=&description=&passport_location=&passport_number=${passport_number}&brith_date=&passport_given_date=&passport_expire_date=&pinfl=${pinfl}`,
      method: "POST",
      mode: "cors",
      credentials: "include",
    });

    const final = await finalResponse.json();
    if (final.success) {
      await session.updateOne({
        $set: {
          "path.new_abonent_url": new_abonent_url,
          "path.get_litschet_url": get_litschet_url,
        },
      });
    }
    return final; // Return the 'final' variable
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};
module.exports = { yangiAbonent };
