import { Company } from "@models/Company.js";
import axios, { Axios } from "axios";
// import FormData from "form-data";

export function createSmartGpsApi(companyId: number) {
  const instance = axios.create({
    baseURL: "http://2.smartgps.uz",
    headers: {
      Accept: "application/json, text/plain, */*",
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
  const auth = await instance.post(
    "http://2.smartgps.uz/oauth/authorize.html",
    authFormData
  );

  console.log(auth.headers);
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
  console.log("Cookie sessions:", cookie);
}
