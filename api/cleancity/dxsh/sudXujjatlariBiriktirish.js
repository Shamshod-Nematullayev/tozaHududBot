const { CleanCitySession } = require("../../../models/CleanCitySession");
const {
  getCleanCityPageByNavigation,
} = require("../helpers/getCleanCityPageByNavigation");
const fs = require("fs");
const request = require("request");
const { uploadFileToBilling } = require("../helpers/uploadFileToBilling");

async function sudXujjatlariBiriktirish({
  process_id,
  file_buffer,
  file_type_id,
  file_name,
}) {
  const fileType = `Sud qarori`;
  const session = await CleanCitySession.findOne({ type: "dxsh" });
  //faylni saqlash uchun linklar mavjud bo'lmagan holatlarda
  if (!session.path.saveFileLink || !session.path.save_desined_file) {
    session.path = await recoverPath(session);
  }

  const res = await uploadFileToBilling({
    url_path: session.path.saveFileLink + process_id,
    session,
    fileName: file_name,
    fileBuffer: file_buffer,
    otherFormDataParams: {
      file_type_id,
      purpose: file_name,
    },
  });
  if (!res.success) {
    console.error(new Error(res.msg));
    return { success: false, msg: "Fayl qabul qilinmadi" };
  }

  return { success: true };
}

async function recoverPath(session) {
  const sudJarayonlarPage = await getCleanCityPageByNavigation({
    navigation_text: "Суд жараёнлари",
    session: session,
  });
  const matched = sudJarayonlarPage.match(/dsmmf\?xenc=([^']+)id='/g);
  if (!matched) return { success: false, message: "Session has expired." };

  let saveFileLink = matched[0].split("'")[0];
  let save_desined_file = matched[1].split("'")[0];
  await session.updateOne({
    $set: {
      "path.saveFileLink": saveFileLink,
      "path.save_desined_file": save_desined_file,
    },
  });
  return { saveFileLink, save_desined_file };
}

module.exports = { sudXujjatlariBiriktirish };
