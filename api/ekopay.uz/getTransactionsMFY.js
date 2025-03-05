const { Company } = require("../../requires");
const { ekopayLogin } = require("./login");

const getTransactionMFY = async () => {
  try {
    const session = await Company.findOne({ type: "ekopay" });
    const now = new Date();
    const fromDate = `01.${now.getMonth() + 1}.${now.getFullYear()}`;
    const toDate = `${now.getDate()}.${
      now.getMonth() + 1
    }.${now.getFullYear()}`;

    const response = await fetch(
      `https://ekopay.uz/api/ecopay/real-pays-report;descending=false;page=1;perPage=100?branches_id=3&governments_id=584&level=3&companies_id=1144&date_from=${fromDate}&date_to=${toDate}`,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "uz",
          authorization: "Bearer " + session?.authorization,
          "sec-ch-ua":
            '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          Referer: "https://ekopay.uz/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: null,
        method: "GET",
      }
    );
    const data = await response.json();
    if (data.ERROR && data.ERROR.message == "Foydalanuvchi topilmadi") {
      const res = await ekopayLogin();
      return await getTransactionMFY();
    }
    return data.rows;
  } catch (err) {
    console.error(new Error(err));
  }
};

module.exports = { getTransactionMFY };
