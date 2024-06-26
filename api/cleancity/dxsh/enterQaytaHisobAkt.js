const { CleanCitySession } = require("../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const { Abonent } = require("../../../models/Abonent");
const request = require("request");
const cc = `https://cleancity.uz/`;
const fs = require("fs");
const {
  getCleanCityPageByNavigation,
} = require("../helpers/getCleanCityPageByNavigation");

function getCurrentDate() {
  // Create a new Date object
  var currentDate = new Date();

  // Get the day, month, and year
  var day = currentDate.getDate(); // Returns the day of the month (1-31)
  var month = currentDate.getMonth() + 1; // Returns the month (0-11), so we add 1 to get 1-12
  var year = currentDate.getFullYear(); // Returns the year (four digits)

  // Format day and month to have leading zeros if needed
  day = day < 10 ? "0" + day : day;
  month = month < 10 ? "0" + month : month;

  // Format the date string in the desired format
  var formattedDate = day + "." + month + "." + year;

  // Return the formatted date
  return formattedDate;
}
async function enterQaytaHisobAkt({
  licshet,
  amount,
  comment,
  filepath,
  stack_akts_id,
  akt_number,
}) {
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    if (
      !session.path.searchQaytaHisobAkt ||
      !session.path.enterQaytaHisobAkt ||
      !session.path.confirmQaytaHisobAkt ||
      !session.path.getQaytaHisobAktlar
    ) {
      const aktlarPage = await getCleanCityPageByNavigation({
        navigation_text: "Актлар",
        session,
      });
      let searchQaytaHisobAkt = aktlarPage
        .match(/post\('ds\?xenc([^']+)'/g)[6]
        .split("'")[1];
      let enterQaytaHisobAktPath = aktlarPage
        .match(/dsm\?xenc=([^']+)'/g)[1]
        .split("'")[0];
      let getQaytaHisobAktlar = aktlarPage
        .match(/url:\s*'([^']*)'/g)[4]
        .split("'")[1];
      let confirmQaytaHisobAktPath = aktlarPage
        .match(/post\('ds\?xenc([^']+)'/g)[1]
        .split("'")[1];

      if (!enterQaytaHisobAktPath)
        return { success: false, message: "Session has expired" };

      await session.updateOne({
        $set: {
          "path.searchQaytaHisobAkt": searchQaytaHisobAkt,
          "path.enterQaytaHisobAkt": enterQaytaHisobAktPath,
          "path.confirmQaytaHisobAkt": confirmQaytaHisobAktPath,
          "path.getQaytaHisobAktlar": getQaytaHisobAktlar,
        },
      });
      return await enterQaytaHisobAkt(arguments[0]);
    } else {
      const abonent = await Abonent.findOne({ licshet });
      if (!abonent) {
        return { success: false, msg: "Abonent aniqlanmadi" };
      }
      let findedAbonents = await fetch(cc + session.path.searchQaytaHisobAkt, {
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "sec-ch-ua":
            '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
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
          "page=1&rows=20&sort=id&order=asc&licshet=" +
          licshet +
          "&module_name=AktWorkersModule",
        method: "POST",
        mode: "cors",
        credentials: "include",
      });
      findedAbonents = (await findedAbonents.json()).rows[0];
      let options = {
        method: "POST",
        url: cc + session.path.enterQaytaHisobAkt,
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
          abonents_id: abonent.id,
          osv_id: findedAbonents.osv_id,
          resource_types_id: 12,
          stack_akts_id,
          saldo_k: findedAbonents.saldo_k,
          phone: "",
          akt_number,
          akt_types_id: amount >= 0 ? 2 : 1,
          akt_date: getCurrentDate(),
          amount: Math.abs(amount),
          purpose: comment,
          file_bytes: {
            value: fs.createReadStream(filepath),
            options: {
              filename: licshet + ".PDF",
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
      console.log(entering);
      if (!entering.success) {
        return { success: false, msg: "Malumot kiritishda xatolik" };
      }
      const res = await fetch(cc + session.path.getQaytaHisobAktlar, {
        method: "POST",
        headers: {
          Cookie: session.cookie,
          accept: "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "sec-ch-ua":
            '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
        },
        body:
          "stack_akts_id=" +
          stack_akts_id +
          "&page=1&rows=20&sort=id&order=desc",
      });
      const rows = (await res.json()).rows;
      const akt = rows.find(function (obj) {
        return obj.licshet == licshet && obj.akt_number == akt_number;
      });
      console.log(akt);
      const result = await fetch(cc + session.path.confirmQaytaHisobAkt, {
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "sec-ch-ua":
            '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          Cookie: session.cookie,
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        body: "id%5B%5D=" + akt.id,
        method: "POST",
        mode: "cors",
        credentials: "include",
      });
      return await result.json();
    }
  } catch (err) {
    console.error(err);
  }
}

module.exports = { enterQaytaHisobAkt };
