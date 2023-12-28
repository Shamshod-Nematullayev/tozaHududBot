async function getLastAlertLetter(litsavoy) {
  const date = new Date();
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    const startpage = await fetch(cc + "startpage", {
      headers: { Cookie: session.cookie },
    });
    const startpageText = await startpage.text();
    const startpageDoc = new JSDOM(startpageText).window.document;
    let to_card_abo_url = startpageDoc
      .getElementById("to_card_abo")
      .getAttribute("action");
    const abonent_data = await Abonent.findOne({ licshet: litsavoy });
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
  } catch (error) {
    throw error;
  }
}
