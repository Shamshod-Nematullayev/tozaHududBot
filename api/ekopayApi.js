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
    const session = await Company.findOne({ login: "dxsh24107" });
    if (session.ekopayToken) {
      config.headers["Authorization"] = `Bearer ${session.ekopayToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

ekopayApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const session = await Company.findOne({ login: "dxsh24107" });
    if (error.response.status === 401) {
      const { data } = await axios.post("https://ekopay.uz/api/auth/login", {
        username: session.login,
        password: session.password,
      });
      await session.updateOne({
        $set: {
          ekopayToken: data.access_token,
        },
      });
      return ekopayApi.request(error.response.config);
    }
    return Promise.reject(error.response);
  }
);
