const cc = `https://cleancity.uz/`;
const { CleanCitySession } = require("../../../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const { Abonent } = require("../../../../../models/Abonent");

// Yordamchi funksiyalar
// URL qayta aniqlash
const yashovchiSoniOshirishUrlTiklash = async (session, litsavoy) => {
  // url aniqlash boshlanishi
  const startpage = await fetch(cc + "startpage", {
    headers: { Cookie: session.cookie },
  });
  const startpageText = await startpage.text();

  const startpageDoc = new JSDOM(startpageText).window.document;
  let toCardAboUrl = startpageDoc
    .getElementById("to_card_abo")
    .getAttribute("action");

  const abonent_data = await Abonent.findOne({ licshet: litsavoy });
  const response = await fetch(
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
      body: `to_card_abo_hf_0=&id=${abonent_data.id}&companies_id=1144`,
      method: "POST",
      mode: "cors",
      credentials: "include",
    }
  );
  await session.updateOne({
    $set: { "path.toCardAboUrl": toCardAboUrl },
  });

  const responseText = await response.text();
  const inrementLiversUrl = responseText
    .match(/url\s*=\s*'([^']+)'/g)[3]
    .split("'")[1];
  return inrementLiversUrl;
};

// ========================================================================

const yashovchiSoniKopaytirish = async (litsavoy, yashovchiSoni) => {
  const date = new Date();
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    let inrementLiversUrl = session.path.inrementLiversUrl;
    if (!inrementLiversUrl) {
      console.log("url yo'q");
      inrementLiversUrl = await yashovchiSoniOshirishUrlTiklash(
        session,
        litsavoy
      );
    }

    const abonent_data = await Abonent.findOne({ licshet: litsavoy });
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
    await session.updateOne({
      $set: { "path.inrementLiversUrl": inrementLiversUrl },
    });
    const final = await incrementResponse.json();
    return final; // Return the 'final' variable
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};
// yashovchiSoniKopaytirish(105120390245);
module.exports = { yashovchiSoniKopaytirish };
