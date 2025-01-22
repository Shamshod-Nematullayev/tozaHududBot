const { default: axios } = require("axios");
const { CleanCitySession } = require("../requires");

const hybridPochtaApi = axios.create({
  baseURL: "https://hybrid.pochta.uz/api",
  headers: {
    Accept: "application/json, text/plain, */*",
  },
});

hybridPochtaApi.interceptors.request.use(
  async (config) => {
    const session = await CleanCitySession.findOne({ login: "dxsh24107" });
    if (session.hybridToken) {
      config.headers["Authorization"] = `Bearer ${session.hybridToken}`;
    }
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

hybridPochtaApi.interceptors.response.use(
  (response) => response,
  async (err) => {
    const session = await CleanCitySession.findOne({ login: "dxsh24107" });

    if (err.response && err.response.status === 401) {
      const { data } = await axios.post(
        "https://hybrid.pochta.uz/token",
        {
          username: session.hybridLogin,
          password: session.hybridPassword,
          grant_type: "password",
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json, text/plain, */*",
          },
        }
      );
      await session.updateOne({
        $set: {
          hybridToken: data.access_token,
        },
      });

      err.config.headers["Authorization"] = `Bearer ${data.access_token}`;
      return hybridPochtaApi.request(err.config);
    }
  }
);

module.exports = { hybridPochtaApi };
