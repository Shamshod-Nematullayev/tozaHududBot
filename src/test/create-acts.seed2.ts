import { createTozaMakonApi } from "@api/tozaMakon.js";
import { chunkArray } from "@helpers/chunkArray.js";
import { calculateAmount } from "@services/billing/calculateAmount.js";
import { createAct } from "@services/billing/createAct.js";
import { createActPack } from "@services/billing/createActPack.js";
import { searchAbonent } from "@services/billing/searchAbonent.js";
import { uploadFileToTozaMakon } from "@services/billing/uploadFileToTozaMakon.js";
import { formatDate } from "@services/utils/formatDate.js";
import path from "path";
import fs from "fs";
import { packTypes } from "types/billing.js";

export async function createActs2(
  companyId: number,
  abonentLists: { accountNumber: number; mahallaId: number }[]
) {
  const mahallaIds = fs
    .readdirSync(path.join(process.cwd(), "src", "test", "files"))
    .map((fname) => Number(fname.split(".")[0]));

  const tozaMakonApi = createTozaMakonApi(621);
  const errors: any[] = [];

  const packId = await createActPack(tozaMakonApi, {
    companyId: companyId,
    createdDate: formatDate(new Date()),
    description: "created by GreenZone service",
    isActive: true,
    isSpecialPack: false,
    name: "Canceling contract acts",
    packType: packTypes.dvaynik,
  });

  if (packId) {
    console.log(`   🚀 Act pachka yaratildi: ${packId}`);

    let list = abonentLists.filter((a) => mahallaIds.includes(a.mahallaId));
    const fileIds: any = {};
    for (let mfy of mahallaIds) {
      fileIds[mfy] = await uploadFileToTozaMakon(
        tozaMakonApi,
        fs.readFileSync(
          path.join(process.cwd(), "src/test/files", mfy + ".pdf")
        ),
        mfy + ".pdf",
        "SPECIFIC_ACT"
      );
    }

    const chunks = chunkArray(list, 10);
    const newChunks = chunks.slice();
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

            const amount = (
              await calculateAmount(tozaMakonApi, {
                actPackId: packId,
                inhabitantCount: 0,
                kSaldo: 0,
                residentId: abonentDetails.id,
              })
            ).amount;

            await createAct(tozaMakonApi, {
              actPackId: packId,
              actType: "CREDIT",
              amount: amount,
              amountWithoutQQS: 0,
              amountWithQQS: amount,
              description: "Shartnoma bekor qilish",
              fileId: fileIds[abon.mahallaId],
              startPeriod: "10.2025",
              endPeriod: "10.2025",
              inhabitantCount: 0,
              kSaldo: 0,
              residentId: abonentDetails.id,
            });
          } catch (err: any) {
            console.error(
              `   ❌ Xatolik (account: ${abon.accountNumber}) → ${err.message}`
            );
            errors.push({
              accountNumber: abon.accountNumber,
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
      .map((e) => `Account: ${e.accountNumber}, Reason: ${e.reason}`)
      .join("\n");

    await fs.writeFile(filePath, content, "utf-8", (err) => {
      if (err) console.error(err);
    });
    console.log(`📂 Xatoliklar "${filePath}" fayliga yozildi`);
  } else {
    console.log("✅ Hammasi muvaffaqiyatli bajarildi, xatolik topilmadi.");
  }
}
