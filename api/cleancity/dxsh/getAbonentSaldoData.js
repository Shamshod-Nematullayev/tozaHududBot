const { CleanCitySession } = require("../../../models/CleanCitySession");
const {
  getCleanCityPageByNavigation,
} = require("../helpers/getCleanCityPageByNavigation");

const getAbonentSaldoData = async (litsavoy) => {
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    const abonentsPage = await getCleanCityPageByNavigation({
      navigation_text: "Абонентлар",
      session,
    });
    const date = new Date();

    const headers = {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua":
        '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      Cookie: session.cookie,
    };
    let getQaytaHisobAktlar = abonentsPage
      .match(/url:\s*'([^']*)'/g)[7]
      .split("'")[1];
    console.log(
      `licshet=${litsavoy}&mes=${
        date.getMonth() + 1
      }&god=${date.getFullYear()}&page=1&rows=20&sort=a.id&order=asc`
    );
    const res = await fetch(
      process.env.CLEAN_CITY_DOMEN + getQaytaHisobAktlar,
      {
        headers,
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `licshet=${litsavoy}&mes=${
          date.getMonth() + 1
        }&god=${date.getFullYear()}&page=1&rows=20&sort=a.id&order=asc`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      }
    );
    const data = (await res.json()).rows[0];
    console.log(data);
  } catch (error) {
    throw error;
  }
};

module.exports = { getAbonentSaldoData };
