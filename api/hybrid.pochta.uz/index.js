// headers for all requests
const headers = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
  authorization:
    "Bearer zjfvnj6Q2RcIwn9a4ajvi4gIak_bGu5JF9PlvryoCso_ANJWCL2FCw8avaw-VGEsEXbWk_E_J-9zFtne8WEIYj4IANpvenhojCMHol-pYGu1zF_5uZwjkNP8QzVv3PO54zHP2JX5EOG3VKsludsMlXa0AB4SmTsw4f6_l2-9q-kFsgJfC_bqhTesjS3t1Vpnp-mJYE9hN8EL15hJGOCtvB3qlHNRrHv6XmQz--jp2v_pxJtF7rU-4Ai216tPdcL6trwy9SGNMDP23_6EhjThlawrSdPNKk1mBBFlZ94jPX2U9FbfOD1uBU8OSZB4rBtu",
  "content-type": "application/json;charset=UTF-8",
  "sec-ch-ua":
    '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
};

// get the all mails from the server
const getAllMails = async function (limit, isSent) {
  const response = await fetch(
    `https://hybrid.pochta.uz/api/mail?limit=${
      limit || 50
    }&skip=0&sort=createdOn&desc=true&isSent=${isSent}`,
    {
      method: "GET",
      headers: headers,
      referrer: "https://hybrid.pochta.uz/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      mode: "cors",
      credentials: "include",
    }
  ).catch((err) => {
    console.error(err);
  });

  const mails = await response.json();
  return mails;
};

// get the all mails from the server
const getOneMailById = async function (mail_id) {
  const response = await fetch(
    `https://hybrid.pochta.uz/api/mail?id=${mail_id}`,
    {
      method: "GET",
      headers: headers,
      referrer: "https://hybrid.pochta.uz/",
      referrerPolicy: "strict-origin-when-cross-origin",
      mode: "cors",
      credentials: "include",
    }
  );

  const mails = await response.json();
  return mails;
};

// create a new mail
const createMail = async function (Address, Receiver, Document64) {
  const response = await fetch(`https://hybrid.pochta.uz/api/PdfMail`, {
    method: "POST",
    headers: headers,
    referrer: "https://hybrid.pochta.uz/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: JSON.stringify({
      Address,
      Receiver,
      Document64,
      Region: 3, //Samarqand viloyati
      Area: 41, // Kattaqo'rg'on tumani
    }),
    mode: "cors",
    credentials: "include",
  });
  const mails = await response.json();
  return mails;
};

// get pdf file

const getPdf = async function (mail_id) {
  try {
    const response = await fetch(
      `https://hybrid.pochta.uz/api/PdfMail/${mail_id}`,
      {
        method: "GET",
        headers: headers,
        referrer: "https://hybrid.pochta.uz/",
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        mode: "cors",
        credentials: "include",
      }
    );
    const blobData = await response.blob();
    const arrayBuffer = await blobData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `./uploads/${mail_id}.pdf`; // Replace with actual filename

    const fs = require("fs");
    const promise = new Promise((resolve, reject) => {
      fs.writeFile(`./${filename}`, buffer, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ ok: true, filename: filename });
        }
      });
    });
    return await promise;
  } catch (err) {
    return { ok: false, err };
  }
};

module.exports = { getAllMails, getOneMailById, createMail, getPdf };
