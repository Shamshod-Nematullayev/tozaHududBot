const { CleanCitySession } = require("../../../models/CleanCitySession");
const {
  getCleanCityPageByNavigation,
} = require("../helpers/getCleanCityPageByNavigation");
const fs = require("fs");
const request = require("request");
const { SudAkt } = require("../../../models/SudAkt");

async function sudQaroriniBiriktirish({ process_id, file_path }) {
  const fileType = `Sud qarori`;
  const session = await CleanCitySession.findOne({ type: "dxsh" });
  //faylni saqlash uchun linklar mavjud bo'lmagan holatlarda
  if (!session.path.saveFileLink || !session.path.save_desined_file) {
    const sudJarayonlarPage = getCleanCityPageByNavigation({
      navigation_text: "Суд жараёнлари",
      session: session,
    });
    let saveFileLink = sudJarayonlarPage
      .match(/dsmmf\?xenc=([^']+)id='/g)[0]
      .split("'")[0];
    let save_desined_file = sudJarayonlarPage
      .match(/dsmmf\?xenc=([^']+)id='/g)[1]
      .split("'")[0];
    await CleanCitySession.findOne(
      { type: "dxsh" },
      {
        $set: {
          "path.saveFileLink": saveFileLink,
          "path.save_desined_file": save_desined_file,
        },
      }
    );
    return await sudQaroriniBiriktirish(process_id);
  }
  //sud qarorini biriktirish
  let options = {
    method: "POST",
    url: `https://cleancity.uz/${session.path.saveFileLink + process_id}`,
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
      file_type_id: "3",
      purpose: fileType,
      file_bytes: {
        value: fs.createReadStream(file_path),
        options: {
          filename: fileType + ".PDF",
          contentType: "application/pdf",
        },
      },
    },
  };
  const uploadingFile = new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (error) reject(error);
      let obj = JSON.parse(response.body);
      resolve({
        ...obj,
        process_id: process_id,
      });
    });
  });
  const res = await uploadingFile;
  if (!res.success) {
    return { success: false, msg: "Fayl qabul qilinmadi" };
  }

  return { success: true };
}
module.exports = { sudQaroriniBiriktirish };
