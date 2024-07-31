const { CleanCitySession } = require("../../../requires");
const {
  getCleanCityPageByNavigation,
} = require("../helpers/getCleanCityPageByNavigation");

async function confirmNewWarningLetterByLicshet(lischet) {
  const session = await CleanCitySession.findOne({ type: "dxsh" });
  if (!session.path.getNewWarningLetter) {
    const pageText = await getCleanCityPageByNavigation({
      navigation_text: "Суд огоҳлантириш",
      session: session,
    });
    const urls = pageText.match(/ds\?xenc=([^']{10,100})==/g);
    await session.updateOne({ $set: { "path.getNewWarningLetter": urls[0] } });
    return await confirmNewWarningLetterByLicshet(lischet);
  }

  const res = await fetch(
    "https://cleancity.uz/" + session.path.getNewWarningLetter,
    {
      headers: {
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
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: "status=0&system_companies_id=1144&page=1&rows=20&sort=id&order=desc",
      method: "POST",
      mode: "cors",
      credentials: "include",
    }
  );
  const data = await res.json();
  const document = data.rows.find((a) => a.licshet == lischet);

  if (!document) {
    return { success: false, message: "Data not found" };
  }

  const res2 = await fetch(
    "https://cleancity.uz/ds?DAO=SudWarningDAO&ACTION=CONFIRM",
    {
      headers: {
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
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: "sud_warnings_id=" + document.id,
      method: "POST",
      mode: "cors",
      credentials: "include",
    }
  );
  return await res2.json();
}

module.exports = confirmNewWarningLetterByLicshet;
