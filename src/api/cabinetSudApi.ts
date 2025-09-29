import { Company } from "@models/Company.js";
import axios from "axios";

export function createCabinetSudApi(companyId: number) {
  const instance = axios.create({
    baseURL: "https://cabinetapi.sud.uz/api",
    headers: {
      Accept: "application/json, text/plain, */*",
      "accept-language": "UZ",
      "x-channel": "WEB",
    },
  });

  instance.interceptors.request.use(
    async (config) => {
      const company = await Company.findOne({ id: companyId });
      if (company?.cabinetSudToken) {
        config.headers["x-auth-token"] = company.cabinetSudToken;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
}
