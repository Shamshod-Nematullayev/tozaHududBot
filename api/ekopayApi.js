const { default: axios } = require("axios");
const { Company } = require("../requires");

const ekopayApi = axios.create({
  baseURL: "https://ekopay.uz/api/",
  headers: {
    Accept: "application/json",
    "accept-language": "uz",
    "Content-Type": "application/json",
  },
});

ekopayApi.interceptors.request.use(
  async (config) => {
    if (!config.headers.login) {
      throw new Error("Login not found");
    }
    const session = await Company.findOne({
      login: config.headers.login,
    });

    if (session?.ekopayToken) {
      config.headers["Authorization"] = `Bearer ${session.ekopayToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

ekopayApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      const login = error.config?.headers?.login;
      if (!login) {
        return Promise.reject("Login not found in request");
      }

      const company = await Company.findOne({ login });
      if (!company) {
        return Promise.reject("Company not found");
      }

      if (error.response?.status === 401) {
        const { data } = await axios.post(
          "https://ekopay.uz/api/admin/auth/login",
          {
            username: company.ekopayLogin,
            password: company.ekopayPassword,
            remember: false,
            lang: "uz",
          },
          {
            headers: {
              accept: "application/json, text/plain, */*",
              "content-type": "application/x-www-form-urlencoded",
            },
          }
        );

        await Company.findByIdAndUpdate(company._id, {
          $set: {
            ekopayToken: data.user.token,
            ekopaySessionId: data.user.session_id,
          },
        });

        // Xatolik yuz bergan so‘rovni yana bir bor bajarish
        error.config.headers["Authorization"] = `Bearer ${data.user.token}`;
        return ekopayApi.request(error.config);
      }

      return Promise.reject(error.response);
    } catch (err) {
      return Promise.reject(err);
    }
  }
);

module.exports = { ekopayApi };
