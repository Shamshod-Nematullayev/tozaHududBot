import { createTozaMakonApi } from "@api/tozaMakon.js";
import { addMahallaContract } from "@services/billing/addMahallaContract.js";
import { uploadFileToTozaMakon } from "@services/billing/uploadFileToTozaMakon.js";
import { Axios } from "axios";
import fs from "fs";
import path from "path";

const input: { mahallaId: number; order: number }[] = [
  {
    mahallaId: 43032,
    order: 1,
  },
  {
    mahallaId: 56626,
    order: 2,
  },
  {
    mahallaId: 60356,
    order: 3,
  },
  {
    mahallaId: 56909,
    order: 4,
  },
  {
    mahallaId: 55300,
    order: 5,
  },
  {
    mahallaId: 43034,
    order: 6,
  },
  {
    mahallaId: 60357,
    order: 7,
  },
  {
    mahallaId: 56627,
    order: 8,
  },
  {
    mahallaId: 60358,
    order: 9,
  },
  {
    mahallaId: 56628,
    order: 10,
  },
  {
    mahallaId: 54603,
    order: 11,
  },
  {
    mahallaId: 43077,
    order: 12,
  },
  {
    mahallaId: 43033,
    order: 13,
  },
  {
    mahallaId: 18161,
    order: 14,
  },
  {
    mahallaId: 43026,
    order: 15,
  },
  {
    mahallaId: 60359,
    order: 16,
  },
  {
    mahallaId: 56648,
    order: 17,
  },
  {
    mahallaId: 61552,
    order: 18,
  },
  {
    mahallaId: 56653,
    order: 19,
  },
  {
    mahallaId: 55462,
    order: 20,
  },
  {
    mahallaId: 56679,
    order: 21,
  },
  {
    mahallaId: 43036,
    order: 22,
  },
  {
    mahallaId: 54601,
    order: 23,
  },
  {
    mahallaId: 55544,
    order: 24,
  },
  {
    mahallaId: 56681,
    order: 25,
  },
  {
    mahallaId: 43087,
    order: 26,
  },
  {
    mahallaId: 43030,
    order: 27,
  },
  {
    mahallaId: 22804,
    order: 28,
  },
  {
    mahallaId: 60361,
    order: 29,
  },
  {
    mahallaId: 43025,
    order: 30,
  },
  {
    mahallaId: 56652,
    order: 31,
  },
  {
    mahallaId: 55545,
    order: 32,
  },
  {
    mahallaId: 55463,
    order: 33,
  },
  {
    mahallaId: 60362,
    order: 34,
  },
  {
    mahallaId: 54602,
    order: 35,
  },
  {
    mahallaId: 60363,
    order: 36,
  },
  {
    mahallaId: 43028,
    order: 37,
  },
  {
    mahallaId: 43037,
    order: 38,
  },
  {
    mahallaId: 60364,
    order: 39,
  },
  {
    mahallaId: 61556,
    order: 40,
  },
  {
    mahallaId: 43027,
    order: 41,
  },
  {
    mahallaId: 54604,
    order: 42,
  },
  {
    mahallaId: 32204,
    order: 43,
  },
  {
    mahallaId: 43031,
    order: 44,
  },
  {
    mahallaId: 43079,
    order: 45,
  },
  {
    mahallaId: 56911,
    order: 46,
  },
  {
    mahallaId: 55464,
    order: 47,
  },
  {
    mahallaId: 54599,
    order: 48,
  },
  {
    mahallaId: 55465,
    order: 49,
  },
  {
    mahallaId: 56654,
    order: 50,
  },
  {
    mahallaId: 43080,
    order: 51,
  },
  {
    mahallaId: 61554,
    order: 52,
  },
  {
    mahallaId: 54607,
    order: 53,
  },
  {
    mahallaId: 60365,
    order: 54,
  },
  {
    mahallaId: 60366,
    order: 55,
  },
  {
    mahallaId: 54600,
    order: 56,
  },
  {
    mahallaId: 23624,
    order: 57,
  },
  {
    mahallaId: 56907,
    order: 58,
  },
  {
    mahallaId: 25704,
    order: 59,
  },
  {
    mahallaId: 54606,
    order: 60,
  },
  {
    mahallaId: 43035,
    order: 61,
  },
  {
    mahallaId: 55546,
    order: 62,
  },
  {
    mahallaId: 56910,
    order: 63,
  },
  {
    mahallaId: 43029,
    order: 64,
  },
  {
    mahallaId: 54605,
    order: 65,
  },
  {
    mahallaId: 56908,
    order: 66,
  },
  {
    mahallaId: 56655,
    order: 67,
  },
  {
    mahallaId: 52367,
    order: 68,
  },
  {
    mahallaId: 55466,
    order: 69,
  },
];
export async function uploadMahallaContracts(
  tozaMakonApi: Axios,
  companyId: number,
  input: { mahallaId: number; order: number }[]
) {
  console.log("📌 Import boshlandi...");

  const basePath = path.join(process.cwd(), "src", "test", "files");

  console.log("📁 Fayllar joylashgan papka:", basePath);

  const orderNumbers = fs
    .readdirSync(basePath)
    .map((fname) => Number(fname.split(".")[0]));

  console.log("🔢 Topilgan orderlar:", orderNumbers);

  for (const orderNum of orderNumbers) {
    console.log(`\n📄 [${orderNum}] Fayl yuklanmoqda...`);

    const filePath = path.join(basePath, `${orderNum}.pdf`);

    console.log(`➡️ Fayl manzili: ${filePath}`);

    const buffer = fs.readFileSync(filePath);

    console.log(`📦 Buffer o‘qildi (${buffer.length} bayt).`);

    // 1. Faylni serverga yuklash
    console.log("⬆️ Fayl TozaMakon'ga yuklanmoqda...");
    const fileId = await uploadFileToTozaMakon(
      tozaMakonApi,
      buffer,
      `${orderNum}.pdf`,
      "PUBLIC_MAHALLA_CONTRACTS"
    );
    console.log(`✅ Fayl yuklandi. fileId: ${fileId}`);

    // 2. Mahallaga biriktirish
    const found = input.find((i) => i.order === orderNum);

    if (!found) {
      console.log(
        `⚠️ Ogohlantirish: input ichida order ${orderNum} topilmadi. O‘tkazib yuborildi.`
      );
      continue;
    }

    console.log(
      `🏷️ Mahalla biriktirilmoqda. mahallaId: ${found.mahallaId}, companyId: ${companyId}`
    );

    await addMahallaContract(tozaMakonApi, {
      companyId: companyId,
      fileId: fileId,
      mahallaId: found.mahallaId,
    });

    console.log(`✅ [${orderNum}] Mahallaga biriktirildi.`);
  }

  console.log("\n🎉 Import jarayoni tugadi.");
}

uploadMahallaContracts(createTozaMakonApi(1144), 1144, input);
