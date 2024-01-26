const {
  find_one_by_pinfil_from_mvd,
  find_address_by_pinfil_from_mvd,
} = require("./mvd-pinfil");
const pochta_harajati_belgilangan_summa = 17000;
const fs = require("fs");
const blobUtil = require("blob-util");

const sudApiDomen = "https://cabinetapi.sud.uz/api";
async function sendToSud({
  doc_number,
  doc_date,
  qarz,
  pinfl,
  pochta_harajati,
  ariza_dir,
  forma_bir_dir,
  ilovalar_dir,
}) {
  const authToken = "c939f29e-b1f0-4689-bc05-5ee6aecd7f52";
  async function uploadFileToSudUZ(filePath, fileName) {
    // Create form data
    const formDataForAriza = new FormData();
    formDataForAriza.append("file", fs.createReadStream(filePath));

    // let file_data =
    // Make the fetch request

    const res = await fetch(
      "https://cabinetapi.sud.uz/api/cabinet/case/file/upload",
      {
        method: "POST",
        headers: {
          "X-Auth-Token": authToken,
          file_name: fileName,
          file_size: fs.statSync(filePath).size.toString(),
          file_type: "46e58bdd-d861-44fd-8168-9522719fa999",
          mime_type: "application/pdf",
          is_photo: "false",
        },
        body: formDataForAriza,
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Upload successful:", data);
        return data;
      })
      .catch((error) => {
        console.log(error);
        console.error("Error:", error.message);
      });
    return res.id;
  }
  const customDates = await find_one_by_pinfil_from_mvd(pinfl);
  const addressDates = await find_address_by_pinfil_from_mvd(pinfl);
  if (!customDates.success) {
    return customDates;
  }
  if (!addressDates.success) {
    return addressDates;
  }

  let res_pochta_harajat;
  if (pochta_harajati) {
    res_pochta_harajat = await fetch(
      "https://cabinetapi.sud.uz/api/cabinet/guide/find-by-receipt-number",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "content-type": "application/json",
          responsetype: "arraybuffer",
          "sec-ch-ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-auth-token": authToken,
        },
        referrer: "https://cabinet.sud.uz/",
        body: '{"receipt_number":"' + pochta_harajati + '"}',
        method: "POST",
        mode: "cors",
        credentials: "omit",
      }
    );
    res_pochta_harajat = await res_pochta_harajat.json();
  }

  const ariza_id = await uploadFileToSudUZ(ariza_dir, "ariza.PDF");
  const forma_bir_id = await uploadFileToSudUZ(forma_bir_dir, "pasport.PDF");
  const ilovalar_id = await uploadFileToSudUZ(ilovalar_dir, "ilovalar.PDF");

  let generate_invoce = false;
  if (
    pochta_harajati_belgilangan_summa - res_pochta_harajat.receipt.amount >
    0
  ) {
    generate_invoce = await fetch(
      "https://cabinetapi.sud.uz/api/cabinet/guide/generate-invoices",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "content-type": "application/json",
          responsetype: "arraybuffer",
          "sec-ch-ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "x-auth-token": authToken,
        },
        referrer: "https://cabinet.sud.uz/",
        body:
          '{"entity_id":"6d8fd30e-82fb-4eaf-8308-57703c1c7e4c","court_id":"d007c274-844f-49b9-b2c1-b514fc407c2f","entity_details":{},"invoices":[{"amount_type":"POST","amount":' +
          Number(
            pochta_harajati_belgilangan_summa -
              res_pochta_harajat.receipt.amount
          ) +
          "}]}",
        method: "POST",
        mode: "cors",
        credentials: "omit",
      }
    );

    generate_invoce = await generate_invoce.json();
  }
  // Fuqoro rasmini Sud.uz bazasiga yuklash
  const formData = new FormData();
  const fileBuffer = Buffer.from(customDates.photo, "base64");
  // Convert Buffer to Blob
  // const fileBlob = blobUtil.createBlob([fileBuffer], {
  //   type: "application/octet-stream",
  // });
  const fileBlob = new Blob([customDates.photo], {
    type: "application/octet-stream",
  });

  formData.append(
    "file",
    fileBlob,
    `${customDates.details.surname_cyrillic} ${customDates.details.name_cyrillic}.jpeg`
  );

  // Append other necessary fields
  formData.append("file_size", "388820");
  formData.append("file_type", "7f5e9165-426c-4dfb-987d-b6be754fd28f");
  formData.append("is_photo", "true");

  let headers = new Headers();
  headers.set("X-Auth-Token", authToken);
  headers.set(
    "file_name",
    `${customDates.first_name} ${customDates.last_name}.jpeg`
  );
  headers.set("file_size", fileBlob.size.toString());
  headers.set("file_type", "7f5e9165-426c-4dfb-987d-b6be754fd28f");
  headers.set("is_photo", "true");

  // Create the fetch request
  let photo_res = await fetch(
    "https://cabinetapi.sud.uz/api/cabinet/case/file/upload",
    {
      method: "POST",
      headers,
      body: formData,
    }
  );

  photo_res = await photo_res.json();

  const date = new Date();
  const currentDate = new Date();
  const isoDateString = currentDate.toISOString().replace(/\.\d+Z$/, "Z");

  const [kun, oy, yil] = doc_date.split(".");
  const pochta_harajati_data = Date.now(1702617968449);
  const payload = {
    case: {
      doc_date: `${yil}-${oy}-${parseInt(kun) - 1}T19:00:00.000Z`,
      doc_number: doc_number,
      court_id: "d007c274-844f-49b9-b2c1-b514fc407c2f",
      duty_reason_id: "b4c87d9e-1f9e-4e9f-94f5-0b21840d57b1",
    },
    claim_categories: [
      {
        is_main: true,
        category_id: "0f90cc41-8f8e-4431-8a3f-84655acc06a9",
        fields_data: {},
        sub_category_id: "926f7cf8-3336-4002-90e5-38f665b1bcef",
        second_category_id: null,
      },
    ],
    receipts: [
      {
        receipt: {
          type: "POST",
          total: Number(res_pochta_harajat.receipt.amount),
          currency_id: "UZS",
          is_generated: false,
          receipt_date: `2023-12-15T05:26:08.449Z`,
          receipt_number: String(res_pochta_harajat.receipt.number),
        },
        right_hash: res_pochta_harajat.right_hash,
        responseModel: null,
        receipt_response: res_pochta_harajat.receipt,
      },
      {
        responseModel: null,
        receipt: {
          currency_id: "UZS",
          type: "POST",
          // receipt_date: `2023-12-15T05:26:08.449Z`,
          receipt_number: String(generate_invoce[0].receipt.number),
          total:
            pochta_harajati_belgilangan_summa -
            res_pochta_harajat.receipt.amount,
          is_generated: true,
        },
        receipt_response: generate_invoce[0].receipt,
        right_hash: generate_invoce[0].receipt.right_hash,
      },
    ],
    case_documents: [
      {
        file_id: ariza_id,
        type_id: "543042fd-81f0-4c65-b398-d991cbe9f546",
      },
      {
        file_id: forma_bir_id,
        type_id: "0871a85b-1fc8-404c-9462-031e7dad2e19",
      },
      {
        file_id: ilovalar_id,
        type_id: "616ccb56-4b2f-42ed-8522-7b351d2edb5f",
      },
    ],
    case_participants: [
      {
        entity: {
          id: "6d8fd30e-82fb-4eaf-8308-57703c1c7e4c",
        },
        participant: {
          type: "CLAIMANT",
          is_main: true,
          is_appellant: false,
        },
        entity_details: {
          is_small_business: false,
        },
      },
      {
        entity: {
          pinfl,
          tin: 0,
          not_citizen: true,
        },
        participant: {
          type: "DEFENDANT",
          is_main: true,
          is_appellant: false,
        },
        entity_details: {
          is_current: true,
          is_small_business: false,
          entity_type: "PERSON",
          citizenship: "UZB_CITIZEN",
          photo_id: photo_res.id,
          gender: customDates.gender,
          address: addressDates.address,
          details: customDates.details,
          last_name: customDates.last_name,
          region_id: addressDates.region_id,
          birth_date: customDates.birth_date,
          country_id: customDates.country_id,
          first_name: customDates.first_name,
          district_id: customDates.district_id,
          middle_name: customDates.middle_name,
          birth_region_id: customDates.birth_date,
          passport_number: customDates.passport_number,
          passport_serial: customDates.passport_serial,
          birth_district_id: customDates.birth_district_id,
        },
      },
    ],
    claim_amounts_with_parts: [
      {
        claim_amount: {
          amount: `${qarz}.00`,
          forfeit: null,
          currency_id: "UZS",
        },
        claim_amount_parts: [
          {
            amount: String(qarz),
            amount_type: "DEPT",
          },
        ],
      },
    ],
    claim: {
      claim_kind: "DECREE",
    },
    case_details: {
      state_duty_amount: 340000,
    },
  };

  let res = await fetch(
    "https://cabinetapi.sud.uz/api/cabinet/case/civil/save-suit",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
        "content-type": "application/json",
        responsetype: "arraybuffer",
        "sec-ch-ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-auth-token": authToken,
      },
      referrer: "https://cabinet.sud.uz/",
      body: JSON.stringify(payload),
      method: "POST",
      mode: "cors",
      credentials: "omit",
    }
  );
  res = await res.json();
  console.log(res);
}
// sendToSud({ pinfl: "33101706180044", pochta_harajati: "233494735062" });
module.exports = { sendToSud };
