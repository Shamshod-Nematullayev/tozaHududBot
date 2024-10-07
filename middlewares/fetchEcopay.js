const { drawSendLastSeen } = require("./drawTushum");

let cookie = "";
let Authorization = "";

module.exports.fetchEcopayLogin = async (callback) => {
  await fetch("https://ekopay.uz/api/admin/auth/login", {
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
  })
    .then(async (res) => {
      let data = await res.json();
      cookie = data.user.session_id;
      Authorization = data.user.token;
    })
    .catch((err) => {
      console.error(new Error(err));
    });
};

// Last seen
module.exports.fetchEcoTranzaksiyalar = () => {
  const date = new Date();
  fetch(
    `https://ekopay.uz/api/ecopay/eopc-transactions;sortBy=id;descending=true;page=1;perPage=500?branchs_id=32&from_date=${date.getDate()}.${
      date.getMonth() + 1
    }.${date.getFullYear(Date.now())}&to_date=${date.getDate()}.${
      date.getMonth() + 1
    }.${date.getFullYear(Date.now())}&companies_id=336`,
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
        "sec-ch-ua":
          '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        Cookie: "JSESSIONID=" + cookie,
      },
      referrer: "https://ekopay.uz/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  ).then((data) =>
    data.json().then(async (response) => {
      if (
        response.ERROR &&
        response.ERROR.message == "Пользователь не найден"
      ) {
        await this.fetchEcopayLogin().then(async () => {
          response = await this.fetchEcoTranzaksiyalar();
        });
        return response;
      } else {
        drawSendLastSeen(response);
        return response;
      }
    })
  );
};
