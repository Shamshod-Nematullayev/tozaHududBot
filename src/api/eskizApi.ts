import { Company } from "@models/Company.js";
import axios, { AxiosInstance } from "axios";

function createEskizApi(companyId: number): AxiosInstance {
  const instance = axios.create({
    baseURL: "https://notify.eskiz.uz/api",
    headers: {
      Accept: "application/json, text/plain, */*",
      "accept-language": "UZ",
      "x-channel": "WEB",
    },
  });

  instance.interceptors.request.use(
    async (config) => {
      const company = await Company.findOne({ id: companyId });
      if (company?.eskizAccessToken) {
        config.headers["Authorization"] = `Bearer ${company.eskizAccessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const company = await Company.findOne({ id: companyId });
      if (!company || !error.response) return Promise.reject(error);

      const status = error.response.status;

      // Retry limiter
      error.config._retryCount = (error.config._retryCount || 0) + 1;
      if (error.config._retryCount > 1) {
        return Promise.reject(error); // Stop retrying
      }

      if (status === 401) {
        try {
          const { data } = (
            await axios.post("https://notify.eskiz.uz/api/auth/login", {
              email: company.eskizLogin,
              password: company.eskizPassword,
            })
          ).data;

          await company.updateOne({
            $set: {
              eskizAccessToken: data.token,
            },
          });

          error.config.headers["Authorization"] = `Bearer ${data.token}`;
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
