import { chunkArray } from "@helpers/chunkArray.js";
import abonents from "./abonents.json";
import { calculateAmount } from "@services/billing/calculateAmount.js";
import { createTozaMakonApi } from "@api/tozaMakon.js";
import { searchAbonent } from "@services/billing/searchAbonent.js";
import { createAct } from "@services/billing/createAct.js";
export async function aktlarYaratish(companyId: number, packId: number) {
  console.log(
    `🚀 Seeding jarayoni boshlandi. Company ID: ${companyId}, Pack ID: ${packId}`
  );

  const tozaMakonApi = createTozaMakonApi(companyId);
  const mahallas: string[] = [];

  // 1. Mahallalarni saralab olish
  for (const abonent of abonents) {
    if (mahallas.includes(abonent.mahallaName)) continue;
    mahallas.push(abonent.mahallaName);
  }
  console.log(`📍 Jami aniqlangan mahallalar soni: ${mahallas.length}`);

  // 2. Har bir mahalla bo'yicha sikl
  for (let i = 0; i < mahallas.length; i++) {
    const mahallaName = mahallas[i];
    const abonentsOfMahalla = abonents.filter(
      (a) => a.mahallaName === mahallaName
    );

    console.log(
      `--- [${i + 1}/${mahallas.length}] Mahalla: ${mahallaName} (${
        abonentsOfMahalla.length
      } ta abonent) ---`
    );

    const chunks = chunkArray(abonentsOfMahalla, 10);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      console.log(`📦 Chunk ${chunkIndex + 1}/${chunks.length} ishlanmoqda...`);

      await Promise.all(
        chunk.map(async (abonent) => {
          try {
            // Resident ID ni tekshirish va qidirish
            if (typeof abonent.residentId == "string") {
              const searchResult = await searchAbonent(tozaMakonApi, {
                accountNumber: abonent.accountNumber.toString(),
                companyId: companyId,
              });

              if (searchResult.content && searchResult.content.length > 0) {
                abonent.residentId = searchResult.content[0].id;
              } else {
                console.warn(
                  `⚠️ Abonent topilmadi: AccountNumber: ${abonent.accountNumber}`
                );
                return;
              }
            }

            // Summani hisoblash
            const calcResult = await calculateAmount(tozaMakonApi, {
              actPackId: packId,
              inhabitantCount: 0,
              kSaldo: 0,
              residentId: abonent.residentId,
            });
            const amount = calcResult.amount;

            // Akt yaratish
            await createAct(tozaMakonApi, {
              actPackId: packId,
              actType: "CREDIT",
              amount: amount,
              amountWithoutQQS: 0,
              amountWithQQS: amount,
              description: "Shartnoma bekor qilish",
              fileId: "",
              startPeriod: "12.2025",
              endPeriod: "12.2025",
              inhabitantCount: 0,
              kSaldo: 0,
              residentId: abonent.residentId,
            });

            console.log(
              `✅ Muvaffaqiyatli: Account: ${abonent.accountNumber}, Summa: ${amount}`
            );
          } catch (error: any) {
            console.error(
              `❌ Xatolik yuz berdi (Account: ${abonent.accountNumber}):`,
              error?.message
            );
          }
        })
      );
    }
  }
  console.log("🏁 Seeding jarayoni to'liq yakunlandi.");
}
