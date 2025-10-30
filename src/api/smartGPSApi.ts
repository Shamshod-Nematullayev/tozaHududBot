import { Company } from "@models/Company.js";
import axios, { Axios } from "axios";
// import FormData from "form-data";

export function createSmartGpsApi(companyId: number) {
  const instance = axios.create({
    baseURL: "http://2.smartgps.uz",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Content-Type": "multipart/form-data",
    },
    withCredentials: true,
  });

  instance.interceptors.request.use(
    async (config) => {
      const company = await Company.findOne({ id: companyId });
      if (!company) throw new Error("Company not found");

      if (company.smartGpsAccessToken) {
        if (config.method === "post") {
          config.data = {
            ...config.data,
            sid: company.smartGpsAccessToken,
          };
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  let isRefreshing = false;

  instance.interceptors.response.use(async (response) => {
    if (response.data.error === 1 && !isRefreshing) {
      isRefreshing = true;
      try {
        await refreshToken(companyId, instance); // alohida funksiya
        isRefreshing = false;
        return instance.request(response.config);
      } catch (err) {
        isRefreshing = false;
        throw err;
      }
    }
    return response;
  });

  return instance;
}

async function refreshToken(companyId: number, instance: Axios) {
  // Bu yerda tokenni yangilash logikasi bo'ladi
  const company = await Company.findOne({ id: companyId });
  if (!company) throw new Error("Company not found");
  const authFormData = new FormData();
  authFormData.append("client_id", "SmartGPS");
  authFormData.append("access_type", "-1");
  authFormData.append("activation_time", "0");
  authFormData.append("duration", "8640000");
  authFormData.append("flags", "7");
  authFormData.append("response_type", "hash");
  authFormData.append("sign", "0ua32MEpvPgMx6MhO2YBbuGQxoBxDEtHn3QpH5sNsqU=");
  authFormData.append("login", company.smartGpsLogin);
  authFormData.append("passw", company.smartGpsPassword);
  authFormData.append("redirect_uri", "http://2.smartgps.uz/post_message.html");
  authFormData.append("request_id", "1");
  const auth = await instance.post("/oauth/authorize.html", authFormData, {
    maxRedirects: 0,
    validateStatus: (status) => status === 301,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const url = auth.headers.location; //http://2.smartgps.uz/post_message.html?request_id=1&access_hash=1c5653589405b81c60a169520f501123&user_name=Anvarjon_Biznes&svc_error=0
  const urlParams = new URLSearchParams(url.split("?")[1]);

  const authHashBody = new FormData();
  authHashBody.append("svc", "core/use_auth_hash");
  authHashBody.append(
    "params",
    JSON.stringify({
      authHash: urlParams.get("access_hash"),
      appName: "web/2.smartgps.uz",
      siteName: "auto.wialon_web.5",
      checkService: "",
    })
  );
  authHashBody.append("callback", "__wialon_sdk_jsonp_1");

  const authHash = await axios.post(
    "http://2.smartgps.uz/wialon/ajax.html",
    authHashBody
  );
  //Cookie sessions: 8f98da739acb96a0c0bf69dd55ebeaa6
  const cookie = authHash.headers["set-cookie"];
  if (!cookie || cookie.length === 0) {
    throw new Error("Failed to refresh token: No cookie received");
  }
  company.smartGpsAccessToken = cookie[0]
    .split(";")[0]
    .split("=")[1]
    .slice(0, 32);
  await company.save();
}
