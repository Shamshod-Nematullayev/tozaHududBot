const { Abonent } = require("../../../models/Abonent");
const { CleanCitySession } = require("../../../models/CleanCitySession");

async function getAbonentCardHtml(kod) {
  const session = await CleanCitySession.findOne({ type: "dxsh" });

  const abonent = await Abonent.findOne({ licshet: kod });

  const res = await fetch(
    "https://cleancity.uz/pcard?rnd=31913&with_prescribeds=0&with_region_name=0&option_language=uz&is_full=1&abonents_id=" +
      abonent.id,
    {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
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
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  );
  return await res.text();
}

module.exports = { getAbonentCardHtml };
