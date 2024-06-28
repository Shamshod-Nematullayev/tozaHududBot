// headers for all requests
const headers = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
  authorization:
    "Bearer eJY9Px0AJbg_HvQCaUj0l6v9to4pUnyOkWhuzBd3DAc_bUMeAWAAnCVaUhmsXbIgYGjOXfX4lW-KGi-2OXj37QNXoWVC-dxqzNK2toNiUyePDlueEs6yLP0hWF0Ul-frcnt8P0IliEM-_L8X6B5S-i72DPmlY_ee-oRmQWSzfcXB4H1-tmCBxnqWOI9HR0D9qWAISeJSZEqBEk4D4lPBxr7J6rga7WlrFr2AWX0ekCQ87Me5A5XVD9RvTVP4M10lsshWoqHHG2ZUapG7CYZKlKRqTDCPciUznetOPuEuWl8aKRzg_Id268uW9spyU8Bx",
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
  );
  const mails = await response.json();
  return mails;
};

// get the all mails from the server
const gertOneMailById = async function (mail_id) {
  const response = await fetch(
    `https://hybrid.pochta.uz/api/mail?id=${mail_id}`,
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

module.exports = { getAllMails, gertOneMailById, createMail };
