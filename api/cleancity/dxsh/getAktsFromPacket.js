const { CleanCitySession } = require("../../../models/CleanCitySession");
const cc = `https://cleancity.uz/`;

async function getAktsFromPacket(pachka_id) {
  const session = await CleanCitySession.findOne({ type: "dxsh" });
  if (!session.path.getAktsFromPacket) {
    return (session.path = await recoverPath(session));
  }
  const res = await fetch(`${cc}${session.path.getAktsFromPacket}`, {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "sec-ch-ua":
        '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      Cookie: session.cookie,
    },
    referrerPolicy: "strict-origin-when-cross-origin",
    body: "stack_akts_id=" + pachka_id + "&page=1&rows=20&sort=id&order=desc",
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
  const data = await res.json();
  return data;
}
async function recoverPath(session) {
  const abonentlarPage = await getCleanCityPageByNavigation({
    navigation_text: "Актлар",
    session,
  });
  let aktgaFileBiriktirish = abonentlarPage.match(
    /dsm\?xenc=([A-Za-z0-9_-]{107})=/g
  )[0];
  let getAktsFromPacket = abonentlarPage.match(
    /ds\?xenc=([A-Za-z0-9_-]{86})==/g
  )[1];
  await session.updateOne({
    $set: {
      "path.aktgaFileBiriktirish": aktgaFileBiriktirish,
      "path.getAktsFromPacket": getAktsFromPacket,
    },
  });
  return { aktgaFileBiriktirish, getAktsFromPacket };
}

module.exports = { getAktsFromPacket };
