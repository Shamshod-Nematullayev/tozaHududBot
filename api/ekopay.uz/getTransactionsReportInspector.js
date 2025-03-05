const { Company } = require("../../models/Company");
const { ekopayLogin } = require("./login");

async function getTransactionsReportInspector() {
  const session = await Company.findOne({ type: "ekopay" });
  const date = new Date();
  const dateStr = `${date.getDate()}.${
    date.getMonth() + 1
  }.${date.getFullYear()}`;

  const res = await fetch(
    `https://ekopay.uz/api/ecopay/transaction-report;descending=false;page=1;perPage=100?parent_id=32&date_from=${dateStr}&date_to=${dateStr}&companies_id=1144&sys_companies_id=503`,
    {
      method: "GET",
      headers: {
        "accept-language": "uz",
        Cookie: `JSESSIONID=${session.cookie};user_name=${process.env.ECOPAY_LOGIN}`,
        Authorization: `Bearer ${session.authorization}`,
      },
    }
  );
  const resData = await res.json();
  if (resData.ERROR && resData.ERROR.message == "Foydalanuvchi topilmadi") {
    const res = await ekopayLogin();
    return await getTransactionsReportInspector();
  }
  return resData.rows;
}

module.exports = { getTransactionsReportInspector };
