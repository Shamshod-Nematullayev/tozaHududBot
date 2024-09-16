const { CleanCitySession } = require("../../../models/CleanCitySession");
const request = require("request");
const cc = `https://cleancity.uz/`;
const fs = require("fs");
const {
  getCleanCityPageByNavigation,
} = require("../helpers/getCleanCityPageByNavigation");

async function dvaynikUchirish({ ikkilamchi_id, filepath, stack_akts_id }) {
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    if (!session.path.aktgaFileBiriktirish || !session.path.getAktsFromPacket) {
      session.path = await recoverPath(session);
    }
    const dvaynikUchirishUrl = `${cc}dsm?DAO=AbonentsDAO&ACTION=CACELCONTRACTBYFILTRCHOOSED&stack_akts_id=${stack_akts_id}`;
    const res1 = await fetch(dvaynikUchirishUrl, {
      headers: {
        Cookie: session.cookie,
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
      },
      credentials: "include",
      body: "ids%5B%5D=" + ikkilamchi_id + "&system_companies_id=1144",
      method: "POST",
      mode: "cors",
    });
    const data1 = await res1.json();
    if (!data1.success) {
      return {
        success: false,
        message: data1.message ? data1.message : "shartnoma bekor qilinmadi",
      };
    }
    const res2 = await fetch(`${cc}${session.path.getAktsFromPacket}`, {
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
      body:
        "stack_akts_id=" + stack_akts_id + "&page=1&rows=20&sort=id&order=desc",
      method: "POST",
      mode: "cors",
      credentials: "include",
    });
    const data2 = await res2.json();
    const akt = data2.rows.filter((row) => row.abonents_id == ikkilamchi_id)[0];
    if (!akt) {
      return { success: false, message: "akt not found" };
    }
    let options = {
      method: "POST",
      url: cc + session.path.aktgaFileBiriktirish,
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
        "cache-control": "max-age=0",
        "content-type": "multipart/form-data",
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
      formData: {
        id: akt.id,
        resource_types_id: 12,
        file_bytes: {
          value: fs.createReadStream(filepath),
          options: {
            filename: ikkilamchi_id + ".PDF",
            contentType: "application/pdf",
          },
        },
      },
    };
    const entering = await new Promise((resolve, reject) => {
      request(options, function (error, response) {
        if (error) reject(error);
        resolve(JSON.parse(response.body));
      });
    });
    if (!entering.success) {
      console.log(entering);
      return { success: false, message: "Akt fayl yuklab bo'lmadi" };
    }
    return {
      success: true,
      message: "Muvaffaqqiyatli kiritildi",
      akt_id: akt.id,
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: "internal error" };
  }
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

module.exports = { dvaynikUchirish };
