const { default: axios } = require("axios");
const { Company } = require("../requires");

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
    const session = await Company.findOne({ login: "dxsh24107" });
    if (session.tozamakonAccessToken) {
      config.headers[
        "Authorization"
      ] = `Bearer ${session.tozamakonAccessToken}`;
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
    const session = await Company.findOne({ login: "dxsh24107" });
    console.error(
      {
        method: error.response.config.method,
        url: error.response.config.url,
        data: error.response.data,
      },
      error.config.data,
      error.response.status,
      error.response.statusText
    );
    if (error.response && error.response.status === 401) {
      const { data } = await axios.post(
        "https://api.tozamakon.eco/user-service/users/login",
        {
          username: session.login,
          password: session.password,
        }
      );
      await Company.findByIdAndUpdate(session._id, {
        $set: {
          tozamakonAccessToken: data.access_token,
        },
      });

      error.config.headers["Authorization"] = `Bearer ${data.access_token}`;
      return tozaMakonApi.request(error.config);
    }
    return error.response;
  }
);

function createTozaMakonApi(companyId) {
  const instance = axios.create({
    baseURL: "https://api.tozamakon.eco",
    headers: {
      Accept: "application/json, text/plain, */*",
      "accept-language": "UZ",
      "x-channel": "WEB",
    },
  });

  instance.interceptors.request.use(
    async (config) => {
      const session = await Company.findOne({ id: companyId });
      if (session?.tozamakonAccessToken) {
        config.headers[
          "Authorization"
        ] = `Bearer ${session.tozamakonAccessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const session = await Company.findOne({ id: companyId });
      if (!session || !error.response) return Promise.reject(error);

      const status = error.response.status;

      // Retry limiter
      error.config._retryCount = (error.config._retryCount || 0) + 1;
      if (error.config._retryCount > 1) {
        return Promise.reject(error); // Stop retrying
      }

      if (status === 401) {
        try {
          const { data } = await axios.post(
            "https://api.tozamakon.eco/user-service/users/login",
            {
              username: session.login,
              password: session.password,
            }
          );

          await Company.findByIdAndUpdate(session._id, {
            $set: {
              tozamakonAccessToken: data.access_token,
            },
          });

          error.config.headers["Authorization"] = `Bearer ${data.access_token}`;
          return instance.request(error.config);
        } catch (loginError) {
          return Promise.reject(loginError); // login noto‘g‘ri bo‘lsa, to‘xtatish
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

module.exports = { tozaMakonApi, createTozaMakonApi };
