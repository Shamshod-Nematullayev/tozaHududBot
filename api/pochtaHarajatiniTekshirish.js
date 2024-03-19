async function pochtaHarajatiniTekshirish(pochta_id) {
  try {
    const res = await fetch(
      `https://billing.sud.uz/api/invoice/checkStatus?invoice=${pochta_id}&lang=name`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "sec-ch-ua":
            '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
        },
        referrer: "https://billing.sud.uz/invoice/" + pochta_id,
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "omit",
      }
    );
    const data = await res.json();
    return { ...data, success: true };
  } catch (error) {
    return { success: false, error };
  }
}
module.exports = { pochtaHarajatiniTekshirish };
