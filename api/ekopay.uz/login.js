const { CleanCitySession } = require("../../requires");

const ekopayLogin = async (callback) => {
  try {
    const res = await fetch("https://ekopay.uz/api/admin/auth/login", {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded",
        "sec-ch-ua":
          '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      },
      referrer: "https://ekopay.uz/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `username=${process.env.ECOPAY_LOGIN}&password=${process.env.ECOPAY_PASSWORD}&remember=false&lang=uk`,
      method: "POST",
      mode: "cors",
      credentials: "omit",
    });
    let data = await res.json();
    const session = await CleanCitySession.findOne({ type: "ekopay" });
    if (!session) {
      return await CleanCitySession.create({
        type: "ekopay",
        cookie: data.user.session_id,
        authorization: data.user.token,
        status: "active",
      });
    }
    return await session.updateOne({
      cookie: data.user.session_id,
      authorization: data.user.token,
    });
  } catch (err) {
    console.error(new Error(err));
  }
};

module.exports = { ekopayLogin };
