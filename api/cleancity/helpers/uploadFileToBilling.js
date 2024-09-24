const fs = require("fs");
const request = require("request");
module.exports.uploadFileToBilling = async function uploadFileToBilling({
  url_path,
  fileName,
  session,
  filePath,
  fileBuffer,
  otherFormDataParams,
}) {
  if (!filePath && !fileBuffer) {
    return { success: false, msg: "fayl kiritilmadi" };
  }
  if (!fileName) fileName = "document.pdf";
  let file = null;
  if (filePath) {
    file = fs.createReadStream(filePath);
  } else {
    file = fileBuffer;
  }

  let options = {
    method: "POST",
    url: "https://cleancity.uz/" + url_path,
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
      file_bytes: {
        value: file,
        options: {
          filename: fileName,
          contentType: "application/pdf",
        },
      },
      ...otherFormDataParams,
    },
  };
  const uploadingFile = new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (error) reject(error);
      let obj = JSON.parse(response.body);
      resolve({
        ...obj,
      });
    });
  });
  return await uploadingFile;
};
