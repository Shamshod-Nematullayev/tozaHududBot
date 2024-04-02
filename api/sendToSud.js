const {
  find_one_by_pinfil_from_mvd,
  find_address_by_pinfil_from_mvd,
} = require("./mvd-pinfil");
const pochta_harajati_belgilangan_summa = 17000;
const fs = require("fs");
const blobUtil = require("blob-util");
const path = require("path");
const request = require("request");

const sudApiDomen = "https://cabinetapi.sud.uz/api";
async function sendToSud({
  doc_number,
  doc_date,
  qarz,
  pinfl,
  pochta_harajati,
  ariza_dir,
  ilovalar_dir,
}) {
  const authToken = "fe9e6cf7-e76e-44fd-8a25-4018c7f9b13c";
  async function uploadFileToSudUZ(filePath, fileName) {
    // Create form data
    const formDataForAriza = new FormData();
    formDataForAriza.append("file", fs.createReadStream(filePath));

    let options = {
      method: "POST",
      url: `https://cabinetapi.sud.uz/api/cabinet/case/file/upload`,
      headers: {
        "x-Auth-Token": authToken,
        file_name: fileName,
        file_size: fs.statSync(filePath).size.toString(),
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
        "content-type": "multipart/form-data",
        file_type: "46e58bdd-d861-44fd-8168-9522719fa999",
        mime_type: "application/pdf",
        responsetype: "arraybuffer",
        "sec-ch-ua":
          '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      },
      formData: {
        file: {
          value: fs.createReadStream(filePath),
          options: {
            filename: "ariza" + ".PDF",
            contentType: "application/pdf",
          },
        },
      },
    };
    const send = new Promise((resolve, reject) => {
      request(options, function (error, response) {
        // if (error) reject(error);
        resolve(JSON.parse(response.body));
      });
    });

    // Make the fetch request
    // const res = await fetch(
    //   "https://cabinetapi.sud.uz/api/cabinet/case/file/upload",
    //   {
    //     method: "POST",
    //     headers: {
    //       "x-Auth-Token": authToken,
    //       file_name: fileName,
    //       file_size: fs.statSync(filePath).size.toString(),
    //       accept: "application/json, text/plain, */*",
    //       "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
    //       "content-type": "application/octet-stream",
    //       file_type: "46e58bdd-d861-44fd-8168-9522719fa999",
    //       mime_type: "application/pdf",
    //       responsetype: "arraybuffer",
    //       "sec-ch-ua":
    //         '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    //       "sec-ch-ua-mobile": "?0",
    //       "sec-ch-ua-platform": '"Windows"',
    //       "sec-fetch-dest": "empty",
    //       "sec-fetch-mode": "cors",
    //       "sec-fetch-site": "same-site",
    //     },
    //     body: formDataForAriza,
    //   }
    // )
    //   .then(async (response) => {
    //     if (!response.ok) {
    //       throw new Error(`HTTP error! Status: ${response.status}`);
    //     }
    //     return response.json();
    //   })
    //   .then((data) => {
    //     console.log("Upload successful:", data);
    //     return data;
    //   })
    //   .catch((error) => {
    //     console.error(error);
    //     console.error("Error:", error.message);
    //   });
    return send.then((res) => {
      console.log({ res });
      return res.id;
    });
  }

  async function checkPochtaXarajat(id) {
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
        body: '{"receipt_number":"' + id + '"}',
        method: "POST",
        mode: "cors",
        credentials: "omit",
      }
    );
    return await res_pochta_harajat.json();
  }

  const customDates = await find_one_by_pinfil_from_mvd(pinfl);
  const addressDates = await find_address_by_pinfil_from_mvd(pinfl);
  if (!customDates.success) {
    console.error(customDates);
    return customDates;
  }
  if (!addressDates.success) {
    console.error(addressDates);
    addressDates;
  }

  let res_pochta_harajat;

  async function checkPochtaWithRetry(pochta_harajati) {
    res_pochta_harajat = await checkPochtaXarajat(pochta_harajati);
    if (res_pochta_harajat.statusCode >= 400) {
      console.log(pochta_harajati, pinfl);
      console.error(res_pochta_harajat.message, "Will retry after 1 minute.");
      // setTimeout(() => checkPochtaWithRetry(pochta_harajati), 60 * 1000);
    }
  }

  if (pochta_harajati) {
    await checkPochtaWithRetry(pochta_harajati);
  }
  console.log({ res_pochta_harajat });
  if (res_pochta_harajat.statusCode >= 400) {
    return {
      failed: true,
      message:
        pochta_harajati +
        " - raqamli pochta harajatida muammo bo'ldi. " +
        res_pochta_harajat.message,
    };
  }

  const ariza_id = await uploadFileToSudUZ(ariza_dir, "ariza.PDF");
  const ilovalar_id = await uploadFileToSudUZ(ilovalar_dir, "ilovalar.PDF");

  let generate_invoce = false;
  // if (
  //   pochta_harajati_belgilangan_summa - res_pochta_harajat.receipt.amount >
  //   0
  // ) {
  //   generate_invoce = await fetch(
  //     "https://cabinetapi.sud.uz/api/cabinet/guide/generate-invoices",
  //     {
  //       headers: {
  //         accept: "application/json, text/plain, */*",
  //         "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
  //         "content-type": "application/json",
  //         responsetype: "arraybuffer",
  //         "sec-ch-ua":
  //           '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  //         "sec-ch-ua-mobile": "?0",
  //         "sec-ch-ua-platform": '"Windows"',
  //         "sec-fetch-dest": "empty",
  //         "sec-fetch-mode": "cors",
  //         "sec-fetch-site": "same-site",
  //         "x-auth-token": authToken,
  //       },
  //       referrer: "https://cabinet.sud.uz/",
  //       body:
  //         '{"entity_id":"6d8fd30e-82fb-4eaf-8308-57703c1c7e4c","court_id":"d007c274-844f-49b9-b2c1-b514fc407c2f","entity_details":{},"invoices":[{"amount_type":"POST","amount":' +
  //         Number(
  //           pochta_harajati_belgilangan_summa -
  //             res_pochta_harajat.receipt.amount
  //         ) +
  //         "}]}",
  //       method: "POST",
  //       mode: "cors",
  //       credentials: "omit",
  //     }
  //   );

  //   generate_invoce = await generate_invoce.json();
  // }
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
  headers.set("file_name", `photo.jpeg`);
  headers.set("file_size", fileBlob.size.toString());
  headers.set("file_type", "49ecf5e0-c2dc-466f-9b6c-964327b1634b");
  headers.set("is_photo", "true");

  // Create the fetch request
  let photo_res = await fetch(
    "https://cabinetapi.sud.uz/api/cabinet/case/file/upload",
    {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
        "content-type": "application/octet-stream",
        file_name:
          "%D0%A3%D0%9B%D0%A3%D2%92%D0%91%D0%95%D0%9A%20%D0%96%D0%A3%D0%A0%D0%90%D0%95%D0%92.jpeg",
        file_size: `${fileBlob.size.toString()}`,
        file_type: "7f5e9165-426c-4dfb-987d-b6be754fd28f",
        is_photo: "true",
        responsetype: "arraybuffer",
        "sec-ch-ua":
          '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-auth-token": "49ecf5e0-c2dc-466f-9b6c-964327b1634b",
      },
      body: customDates.photo,
    }
  );

  photo_res = await photo_res.json();

  const [kun, oy, yil] = doc_date.split(".");
  // console.log({ addressDates: addressDates.details });
  console.log({ photo_res });
  function formatNumber(number) {
    if (number < 10) {
      return "0" + number;
    } else {
      return number;
    }
  }
  const payload = {
    case: {
      doc_date: `${yil}-${formatNumber(oy)}-${parseInt(kun) - 1}T19:00:00.000Z`,
      doc_number: doc_number,
      court_id: "d007c274-844f-49b9-b2c1-b514fc407c2f",
      duty_reason_id: "b4c87d9e-1f9e-4e9f-94f5-0b21840d57b1",
    },
    claim_categories: [
      {
        is_main: true,
        category_id: "0f90cc41-8f8e-4431-8a3f-84655acc06a9",
        sub_category_id: "926f7cf8-3336-4002-90e5-38f665b1bcef",
        fields_data: {},
        second_category_id: null,
      },
    ],
    receipts: [
      {
        responseModel: null,
        receipt: {
          currency_id: "UZS",
          type: "POST",
          receipt_date: new Date(
            res_pochta_harajat.receipt.issued
          ).toISOString(),
          receipt_number: String(res_pochta_harajat.receipt.number),
          total: Number(res_pochta_harajat.receipt.amount),
          is_generated: false,
        },
        receipt_response: res_pochta_harajat.receipt,
        right_hash: res_pochta_harajat.right_hash,
      },
    ],
    case_documents: [
      {
        file_id: ariza_id,
        type_id: "543042fd-81f0-4c65-b398-d991cbe9f546",
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
          region_id: "eb80d9ff-0d1a-543e-14cb-b3a429a96842",
          district_id: "c16a182e-453d-465d-6127-cd3f2352f4f2",
          address: "BOLTABEK MFY JALAYER QISHLOG'I  ",
        },
      },
      {
        entity: {
          pinfl: 0,
          tin: "201214329",
          not_citizen: true,
        },
        participant: {
          type: "CLAIMANT",
          is_main: false,
          is_appellant: false,
        },
        entity_details: {
          is_current: true,
          entity_type: "ORGANIZATION",
          citizenship: "UZB_CITIZEN",
          short_name: '"SAMARQAND VILOYATI PROKURATURASI" ',
          name: '"SAMARQAND VILOYATI PROKURATURASI" DAVLAT MUASSASASI',
          director: "SAYIDKULOV DILMUROD BASTAMOVICH",
          registry_date: "1995-08-29",
          accountant_phone: "662330028",
          accountant_name: "LUKMONOV JAXONGIR AKBAROVICH",
          bank_account: "20203000100436095004",
          email: null,
          director_tin: "442959925",
          director_pinfl: "30709733790019",
          accountant_tin: "489652928",
          registry_number: "1-к",
          phone: "662330028",
          bank_id: "f0afcffb-5cab-46ca-96d1-76dc28b22a8a",
          address: "КУКСАРОЙ КУЧАСИ  4",
          postcode: "140100",
          ministry_stat_id: "16108ef7-f4ba-78fe-91ff-19170f3ba1fd",
          ownership_type_id: "a4b4c86e-7be3-c217-3e26-b20f80341142",
          organization_form_id: "32293d0b-3dfb-f3b0-8758-73886d6cb96b",
          district_id: "c3bd78a9-3020-1515-1e8b-3dfd448c9039",
          region_id: "eb80d9ff-0d1a-543e-14cb-b3a429a96842",
        },
      },
      {
        entity: {
          pinfl: String(pinfl),
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
          details: {
            ...customDates.details,
            PermanentRegistration: addressDates.details?.PermanentRegistration,
          },
          country_id: customDates.country_id,
          passport_serial: customDates.passport_serial,
          passport_number: customDates.passport_number,
          last_name: customDates.last_name,
          middle_name: customDates.middle_name,
          first_name: customDates.first_name,
          birth_date: customDates.birth_date,
          gender: customDates.gender,
          birth_region_id: customDates.birth_region_id,
          birth_district_id: customDates.birth_district_id,
          region_id: addressDates.region_id,
          district_id: customDates.district_id,
          address: addressDates.address,
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
  fs.writeFile("./text.txt", JSON.stringify(payload), "utf-8", (err) => {});
  console.log(res);
  return {
    ...res,
    FISH: `${customDates.last_name} ${customDates.first_name} ${customDates.middle_name}`,
  };
}
module.exports = { sendToSud };
