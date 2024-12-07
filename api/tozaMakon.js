const { default: axios } = require("axios");
const { CleanCitySession } = require("../requires");

const tozaMakonApi = axios.create({
  baseURL: "https://api.tozamakon.eco",
  headers: {
    Accept: "application/json, text/plain, */*",
    "accept-language": "UZ",
    "x-channel": "WEB",
  },
});

tozaMakonApi.interceptors.request.use(
  async (config) => {
    const session = await CleanCitySession.findOne({ login: "dxsh24107" });
    if (session.cookie) {
      config.headers["Authorization"] = `Bearer ${session.cookie}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

tozaMakonApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const session = await CleanCitySession.findOne({ login: "dxsh24107" });
    console.error({
      method: error.response.config.method,
      url: error.response.config.url,
      data: error.response.data,
    });
    if (error.response && error.response.status === 401) {
      const { data } = await axios.post(
        "https://api.tozamakon.eco/user-service/users/login",
        {
          username: session.login,
          password: session.password,
        }
      );
      await session.updateOne({
        $set: {
          cookie: data.access_token,
        },
      });

      error.config.headers["Authorization"] = `Bearer ${data.access_token}`;
      return tozaMakonApi.request(error.config);
    }
  }
);

module.exports = { tozaMakonApi };
