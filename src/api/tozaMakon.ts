import { Company } from "@models/Company.js";
import axios from "axios";

export function createTozaMakonApi(
  companyId: number,
  type: "billing" | "gps" = "billing"
) {
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
      let token;
      switch (type) {
        case "billing":
          token = session?.tozamakonAccessToken;
          break;
        case "gps":
          token = session?.tozamakonGpsAccessToken;
          break;
      }
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
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
          switch (type) {
            case "billing":
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

              error.config.headers[
                "Authorization"
              ] = `Bearer ${data.access_token}`;
              return instance.request(error.config);
            case "gps":
              const { data: data2 } = await axios.post(
                "https://api.tozamakon.eco/user-service/users/login",
                {
                  username: session.tozamakonGpsLogin,
                  password: session.tozamakonGpsPassword,
                }
              );

              await Company.findByIdAndUpdate(session._id, {
                $set: {
                  tozamakonGpsAccessToken: data2.access_token,
                },
              });

              error.config.headers[
                "Authorization"
              ] = `Bearer ${data2.access_token}`;
              return instance.request(error.config);
          }
        } catch (loginError) {
          return Promise.reject(loginError); // login noto‘g‘ri bo‘lsa, to‘xtatish
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}
