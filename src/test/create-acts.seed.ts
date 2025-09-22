import { createActPack } from "@services/billing/createActPack.js";
import { createTozaMakonApi } from "@api/tozaMakon.js";
import { formatDate } from "@services/utils/formatDate.js";
import { searchAbonent } from "@services/billing/searchAbonent.js";
import { packTypes } from "types/billing.js";
import { chunkArray } from "@helpers/chunkArray.js";
import { createAct } from "@services/billing/createAct.js";
import { calculateKSaldo } from "@services/billing/calculateKSaldo.js";

import fs from "fs/promises";
import path from "path";

export async function createActsSeed(
  companyId: number,
  abonentLists: { accountNumber: number; accrual: number }[][]
): Promise<void> {
  const tozaMakonApi = createTozaMakonApi(companyId);
  const errors: any[] = [];

  for (const [listIndex, list] of abonentLists.entries()) {
    console.log(
      `▶️ Boshlanyapti: abonentlar ro'yxati ${listIndex + 1}/${
        abonentLists.length
      }`
    );

    let abonent;
    try {
      abonent = await searchAbonent(tozaMakonApi, {
        accountNumber: list[0].accountNumber.toString(),
        companyId: companyId,
      });
    } catch (err) {
      console.error(`❌ Abonent topilmadi (account: ${list[0].accountNumber})`);
      errors.push({
        accountNumber: list[0].accountNumber,
        reason: "Abonent topilmadi yoki searchAbonent ishlamadi",
      });
      continue;
    }

    const packId = await createActPack(tozaMakonApi, {
      companyId: companyId,
      createdDate: formatDate(new Date()),
      description: "created by GreenZone service",
      isActive: true,
      isSpecialPack: false,
      name: abonent.content[0]?.mahallaName || "Unknown",
      packType: packTypes.viza,
    });

    const chunks = chunkArray(list, 10);
    for (let [chunkIndex, chunk] of chunks.entries()) {
      console.log(
        `   ⚡ Chunk ${chunkIndex + 1}/${chunks.length} ishlanmoqda...`
      );

      await Promise.all(
        chunk.map(async (abon) => {
          try {
            const abonentDetails = (
              await searchAbonent(tozaMakonApi, {
                accountNumber: abon.accountNumber.toString(),
                companyId: companyId,
              })
            ).content[0];

            if (!abonentDetails) {
              throw new Error("Abonent ma'lumotlari topilmadi");
            }

            await createAct(tozaMakonApi, {
              actPackId: packId,
              actType: "CREDIT",
              amount: abon.accrual,
              amountWithoutQQS: 0,
              amountWithQQS: abon.accrual,
              description: "Avgust oyi",
              fileId: "",
              startPeriod: "09.2025",
              endPeriod: "09.2025",
              inhabitantCount: null,
              kSaldo: await calculateKSaldo(tozaMakonApi, {
                actPackId: packId,
                amount: abon.accrual,
                residentId: abonentDetails.id,
                actType: "CREDIT",
              }),
              residentId: abonentDetails.id,
            });
          } catch (err: any) {
            console.error(
              `   ❌ Xatolik (account: ${abon.accountNumber}) → ${err.message}`
            );
            errors.push({
              accountNumber: abon.accountNumber,
              accrual: abon.accrual,
              reason: err.message,
            });
          }
        })
      );
    }
  }

  // Xatoliklarni txt faylga yozib qo'yamiz
  if (errors.length > 0) {
    const filePath = path.join(process.cwd(), "errors.txt");
    const content = errors
      .map(
        (e) =>
          `Account: ${e.accountNumber}, Accrual: ${e.accrual}, Reason: ${e.reason}`
      )
      .join("\n");

    await fs.writeFile(filePath, content, "utf-8");
    console.log(`📂 Xatoliklar "${filePath}" fayliga yozildi`);
  } else {
    console.log("✅ Hammasi muvaffaqiyatli bajarildi, xatolik topilmadi.");
  }
}
