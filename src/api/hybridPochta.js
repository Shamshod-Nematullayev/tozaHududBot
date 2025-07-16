import axios from "axios";
import { Company } from "@models/Company.js";

export const createHybridPochtaApi = (companyId) => {
  const instance = axios.create({
    baseURL: "https://hybrid.pochta.uz/api",
    headers: {
      Accept: "application/json, text/plain, */*",
    },
  });
  instance.interceptors.request.use(
    async (config) => {
      const session = await Company.findOne({ id: companyId });
      if (session.hybridToken) {
        config.headers["Authorization"] = `Bearer ${session.hybridToken}`;
      }
      return config;
    },
    (err) => {
      return Promise.reject(err);
    }
  );

  instance.interceptors.response.use(
    (response) => response,
    async (err) => {
      const session = await Company.findOne({ id: companyId });

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
        return instance.request(err.config);
      }

      return Promise.reject(err);
    }
  );
  return instance;
};
