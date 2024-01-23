const find_one_by_pinfil_from_mvd = async (pinfil) => {
  const res = await fetch(
    "https://cabinetapi.sud.uz/api/cabinet/guide/persons/find-one-by-pinfl",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
        "content-type": "application/json",
        responsetype: "arraybuffer",
        "sec-ch-ua":
          '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-auth-token":
          process.env.CABINET_SUD_X_TOKEN ||
          "30d4c5df-9c0e-419c-8211-00f625237131",
      },
      referrer: "https://cabinet.sud.uz/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `{"pinfl":"${pinfil}"}`,
      method: "POST",
      mode: "cors",
      credentials: "omit",
    }
  );
  const data = await res.json();
  console.log(data.scp_data[0].entity_details);
  if (data.success === false) return data;

  if (data.statusCode > 400) {
    return { ...data, success: false };
  }
  const { scp_data } = data;

  return { ...scp_data[0].entity_details, success: true };
};
const find_address_by_pinfil_from_mvd = async (pinfil) => {
  const res = await fetch(
    "https://cabinetapi.sud.uz/api/cabinet/guide/persons/find-address-by-pinfl",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
        "content-type": "application/json",
        responsetype: "arraybuffer",
        "sec-ch-ua":
          '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-auth-token":
          process.env.CABINET_SUD_X_TOKEN ||
          "30d4c5df-9c0e-419c-8211-00f625237131",
      },
      referrer: "https://cabinet.sud.uz/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `{"pinfl":"${pinfil}"}`,
      method: "POST",
      mode: "cors",
      credentials: "omit",
    }
  );
  const data = await res.json();
  console.log(data.data[0].entity_details);
  if (data.success === false) return data;

  if (data.statusCode == 500) {
    return data;
  }
  return { ...data.data[0].entity_details, success: true };
};

// TESTING
// find_one_by_pinfil_from_mvd("33101706180044");
// find_address_by_pinfil_from_mvd("33101706180044");

module.exports = {
  find_one_by_pinfil_from_mvd,
  find_address_by_pinfil_from_mvd,
};
