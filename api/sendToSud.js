const {
  find_one_by_pinfil_from_mvd,
  find_address_by_pinfil_from_mvd,
} = require("./mvd-pinfil");
const pochta_harajati_belgilangan_summa = 17000;

const sudApiDomen = "https://cabinetapi.sud.uz/api";
async function sendToSud({
  doc_number,
  doc_date,
  qarz,
  pinfl,
  pochta_harajati,
}) {
  //   const customDates = await find_one_by_pinfil_from_mvd(pinfl);
  //   const addressDates = await find_address_by_pinfil_from_mvd(pinfl);
  //   if (!customDates.success) {
  //     return customDates;
  //   }
  //   if (!addressDates.success) {
  //     return addressDates;
  //   }

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
          "x-auth-token": "3bd3d280-3eb2-4611-b97c-61a9d2ca3a47",
        },
        referrer: "https://cabinet.sud.uz/",
        body: '{"receipt_number":"' + pochta_harajati + '"}',
        method: "POST",
        mode: "cors",
        credentials: "omit",
      }
    );
    res_pochta_harajat = await res_pochta_harajat.json();
    console.log(res_pochta_harajat);
  }
  let generate_invoce = await fetch(
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
        "x-auth-token": "3bd3d280-3eb2-4611-b97c-61a9d2ca3a47",
      },
      referrer: "https://cabinet.sud.uz/",
      body:
        '{"entity_id":"6d8fd30e-82fb-4eaf-8308-57703c1c7e4c","court_id":"d007c274-844f-49b9-b2c1-b514fc407c2f","entity_details":{},"invoices":[{"amount_type":"POST","amount":' +
        Number(
          pochta_harajati_belgilangan_summa - res_pochta_harajat.receipt.amount
        ) +
        "}]}",
      method: "POST",
      mode: "cors",
      credentials: "omit",
    }
  );

  generate_invoce = await generate_invoce.json();
  console.log(generate_invoce);

  return;
  // Fuqoro rasmini Sud.uz bazasiga yuklash
  const formData = new FormData();
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

  const headers = new Headers({
    "X-Auth-Token": "3bd3d280-3eb2-4611-b97c-61a9d2ca3a47",
    file_name: `${customDates.details.surname_cyrillic} ${customDates.details.name_cyrillic}.jpeg`,
    file_size: fileBlob.size.toString(),
    file_type: `7f5e9165-426c-4dfb-987d-b6be754fd28f`,
    is_photo: "true",
    // Add other headers as needed
  });

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

  const [kun, oy, yil] = doc_date.split(".");
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
          total: res_pochta_harajat.receipt.amount,
          currency_id: "UZS",
          is_generated: false,
          receipt_date: new Date(res_pochta_harajat.receipt.overdue),
          receipt_number: pochta_harajati,
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
          receipt_date: "2024-01-19T11:52:58.818Z",
          receipt_number: "240191327823",
          total: 500,
          is_generated: true,
        },
        receipt_response: {
          requestStatus: {
            code: 200,
            message: "Success",
          },
          invoiceStatus: "CREATED",
          paidAmount: 0,
          mustPayAmount: 500,
          number: "240191327823",
          overdue: 1708257178818,
          payCategory: "Почта харажатлари",
          payCategoryId: 3,
          court: "Фуқаролик ишлари бўйича Каттақўрғон туманлараро суди",
          courtId: 562,
          courtOwnId: 75,
          forAccount: "401410860184017033232011002",
          amount: 500,
          claimCaseNumber: null,
          decisionDate: null,
          payer: '"ANVARJON BIZNES INVEST" MAS\'ULIYATI CHEKLANGAN JAMIYAT',
          payerId: 10202088,
          payerTin: "303421898",
          payerPassport: null,
          description: "Почта харажатлари",
          isInFavor: true,
          instance: null,
          purpose: null,
          purposeId: null,
          issued: 1705665178818,
          courtType: "CIVIL",
          balance: null,
          historyList: [],
          is_generated: true,
        },
        right_hash: "H/azCBFPvjg7DV/nT/T7AqJ0B61TjfowjTGYiiuwsmc=",
      },
    ],
    case_documents: [
      {
        file_id: "195ac21e-50b8-4c0b-a350-14e6d0278ac2",
        type_id: "543042fd-81f0-4c65-b398-d991cbe9f546",
      },
      {
        file_id: "2ded05fa-3ec6-4e7e-908a-0288168216ce",
        type_id: "0871a85b-1fc8-404c-9462-031e7dad2e19",
      },
      {
        file_id: "0e44cbf2-7674-405a-b472-74a03f09b37f",
        type_id: "616ccb56-4b2f-42ed-8522-7b351d2edb5f",
      },
      {
        file_id: "9465b180-57bf-4a9c-b958-d6ddc59144a6",
        type_id: "616ccb56-4b2f-42ed-8522-7b351d2edb5f",
      },
      {
        file_id: "094ca819-7e37-4e0d-ad25-5f508bc2ab35",
        type_id: "85f9394d-fe3b-4511-a437-3ff7434a48f8",
      },
      {
        file_id: "3762daea-6542-4337-98d1-6b188156c445",
        type_id: "e55124df-d369-4132-9cd0-635c81ccce3c",
      },
      {
        file_id: "c7bd45b7-f91b-4733-80cd-60d0308c9ec9",
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
            amount: qarz,
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
}
// sendToSud({ pinfl: "33101706180044", pochta_harajati: "233494735062" });
module.exports = { sendToSud };
