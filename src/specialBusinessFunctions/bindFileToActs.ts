import { createTozaMakonApi } from "@api/tozaMakon.js";
import { searchActFromPack } from "@services/billing/searchActFromPack.js";
import { uploadFileToActs } from "@services/billing/uploadFileToActs.js";
import { uploadFileToTozaMakon } from "@services/billing/uploadFileToTozaMakon.js";
import fs from "fs";

import abonnets from "./input.json";

const actPackId = 4456991;

async function bindFileToActsSeed(
  companyId: number,
  accountNumbers: {
    accountNumber: number;
    mahallaId: number | string;
  }[],
  actPackId: number
) {
  console.log(
    `🚀 Jarayon boshlandi. CompanyId: ${companyId}, ActPackId: ${actPackId}`
  );
  const tozaMakonApi = createTozaMakonApi(companyId);

  // 1. Fayllarni o'qish va yuklash
  const files = fs.readdirSync("./src/test/files");
  const fileIds: any = {};
  // const fileIds: any = {
  // "46532":
  //   "46532.pdf*tozamakon/nfs/stack_acts/2025/12/30/efca400e78f848aabd887b427db62d78.pdf",
  // "46615":
  //   "46615.pdf*tozamakon/nfs/stack_acts/2025/12/30/089bb0f24ddd4a4d9cbd6efba5a3a433.pdf",
  // "46632":
  //   "46632.pdf*tozamakon/nfs/stack_acts/2025/12/30/0dc8b04b4f9e416c8adbb83b9303a4d9.pdf",
  // "46635":
  //   "46635.pdf*tozamakon/nfs/stack_acts/2025/12/30/db7f7ed5fb65482a8d381e5e7d5bb766.pdf",
  // "46640":
  //   "46640.pdf*tozamakon/nfs/stack_acts/2025/12/30/557089b31d2148848caf0a7bc390157b.pdf",
  // "46644":
  //   "46644.pdf*tozamakon/nfs/stack_acts/2025/12/30/9d5de91c88114d1ba30b0f525943c4b5.pdf",
  // "46645":
  //   "46645.pdf*tozamakon/nfs/stack_acts/2025/12/30/1473c0f129194c8a8822e0a008131caf.pdf",
  // "46646":
  //   "46646.pdf*tozamakon/nfs/stack_acts/2025/12/30/6142bb5123a24f138ad53b290e61c8ce.pdf",
  // "46648":
  //   "46648.pdf*tozamakon/nfs/stack_acts/2025/12/30/b7182c5d462c4996b4c6e70039abe770.pdf",
  // "46666":
  //   "46666.pdf*tozamakon/nfs/stack_acts/2025/12/30/2b34b2116baa441fa5edace5804ff27e.pdf",
  // "46669":
  //   "46669.pdf*tozamakon/nfs/stack_acts/2025/12/30/19790dcfa00a43e3bd400431f3d5c809.pdf",
  // "46687":
  //   "46687.pdf*tozamakon/nfs/stack_acts/2025/12/30/4d38fd372c724939b31d451ea6884fe9.pdf",
  // "46710":
  //   "46697.pdf*tozamakon/nfs/stack_acts/2025/12/30/2394d235e09349b0a09ec63082fcb223.pdf",
  // "46747":
  //   "46706.pdf*tozamakon/nfs/stack_acts/2025/12/30/b722414758ac4eefa0902a4882ebf4e5.pdf",
  // "46707":
  //   "46707.pdf*tozamakon/nfs/stack_acts/2025/12/30/a6f0aa391cee4491aab15f0dcb93238a.pdf",
  // "46743":
  //   "46743.pdf*tozamakon/nfs/stack_acts/2025/12/30/b1877563cbaf4efeb1359f801d84a657.pdf",
  // "46755":
  //   "46755.pdf*tozamakon/nfs/stack_acts/2025/12/30/e7d55b726a914ae2913eef61eaa44fe3.pdf",
  // "46762":
  //   "46762.pdf*tozamakon/nfs/stack_acts/2025/12/30/198617da935242c1b433903fce36f87e.pdf",
  // "46784":
  //   "46784.pdf*tozamakon/nfs/stack_acts/2025/12/30/228544e78dff4ea4b708fccb92bc37ef.pdf",
  // "51576":
  //   "51576.pdf*tozamakon/nfs/stack_acts/2025/12/30/b4479637e44e4f7eaf57eb0907502b3a.pdf",
  // "52398":
  //   "52398.pdf*tozamakon/nfs/stack_acts/2025/12/30/b1a38049c3f749ed889ded4a102da31a.pdf",
  // "53235":
  //   "53235.pdf*tozamakon/nfs/stack_acts/2025/12/30/15b0b8b515224bce97ce004890fac90f.pdf",
  // "60293":
  //   "60293.pdf*tozamakon/nfs/stack_acts/2025/12/30/8b8e3aa9e46e4f60987edc151bdda0f2.pdf",
  // "46643":
  //   "46643.pdf*tozamakon/nfs/stack_acts/2025/12/30/d62db2de6b0045c9b758f7371ec1de16.pdf",
  // "46701":
  //   "46701.pdf*tozamakon/nfs/specific_acts/2025/12/30/e581f3275a7f423e86f690cc75b20703.pdf",
  // "46703":
  //   "46703.pdf*tozamakon/nfs/specific_acts/2025/12/30/bd337964f7b544da94798eede969abe7.pdf",

  // };

  console.log(
    `📁 "./files" papkasida ${files.length} ta fayl topildi. Yuklash boshlanmoqda...`
  );

  for (let f of files) {
    try {
      const id = await uploadFileToTozaMakon(
        tozaMakonApi,
        fs.readFileSync(`./src/test/files/${f}`),
        f,
        "STACK_ACT"
      );
      fileIds[f.split(".")[0]] = id;
      console.log(`✅ Fayl yuklandi: ${f} -> ID: ${id}`);
    } catch (error: any) {
      console.error(`❌ Fayl yuklashda xatolik (${f}):`, error?.message);
    }
  }
  console.log(fileIds);

  // 2. Accountlarni aktlarga bog'lash
  console.log(
    `🔗 Accountlarni aktlarga bog'lash boshlandi (${accountNumbers.length} ta)...`
  );
  let successCount = 0;

  const actsData = await searchActFromPack(tozaMakonApi, {
    page: 0,
    size: 100,
    actPackId: actPackId,
    sort: "id,DESC",
  });

  // console.log(actsData);

  let acts = actsData.content;

  for (let page = 1; actsData.totalPages > page; page++) {
    const nextPageActs = (
      await searchActFromPack(tozaMakonApi, {
        page: page,
        size: 100,
        actPackId: actPackId,
        sort: "id,DESC",
      })
    ).content;
    acts = acts.concat(nextPageActs);
  }

  console.log(`🗂️ Jami ${acts.length} ta akt topildi packda.`);

  for (let fileIdKey in fileIds) {
    const accountNumbersForMahalla = accountNumbers.filter(
      (a) => a.mahallaId.toString() == fileIdKey
    );
    const matchedActs = acts.filter((a) =>
      accountNumbersForMahalla.some(
        (ac) => ac.accountNumber.toString() == a.accountNumber
      )
    );

    if (matchedActs.length === 0) {
      console.warn(`⚠️ MahallaID ${fileIdKey} uchun akt topilmadi.`);
      continue;
    }

    try {
      await uploadFileToActs(tozaMakonApi, {
        actIds: matchedActs.map((a) => a.id),
        fileId: fileIds[fileIdKey],
      });
      console.log(
        `✅ MahallaID ${fileIdKey} uchun ${matchedActs.length} ta aktga fayl biriktirildi.`
      );
      successCount += matchedActs.length;
    } catch (error: any) {
      console.error(
        `❌ MahallaID ${fileIdKey} uchun fayl biriktirishda xatolik:`,
        error?.message
      );
    }
  }
  // for (let i = 0; i < accountNumbers.length; i++) {
  //   const data = accountNumbers[i];
  //   const progress = `[${i + 1}/${accountNumbers.length}]`;

  //   try {
  //     // Aktni qidirish
  //     const searchResult = await searchActFromPack(tozaMakonApi, {
  //       page: 0,
  //       size: 1,
  //       actPackId: actPackId,
  //       sort: "id,DESC",
  //       accountNumber: data.accountNumber.toString(),
  //     });

  //     const act = searchResult.content[0];

  //     if (!act) {
  //       console.warn(
  //         `${progress} ⚠️ Akt topilmadi: Account ${data.accountNumber}`
  //       );
  //       continue;
  //     }

  //     const fileId = fileIds[data.mahallaId];
  //     if (!fileId) {
  //       console.warn(
  //         `${progress} ⚠️ Mahalla uchun fayl topilmadi: MahallaID ${data.mahallaId}`
  //       );
  //       continue;
  //     }

  //     // Faylni aktga bog'lash
  //     await uploadFileToActs(tozaMakonApi, {
  //       actIds: [act.id],
  //       fileId: fileId,
  //     });

  //     console.log(
  //       `${progress} ✨ Muvaffaqiyatli: Account ${data.accountNumber} -> Akt ${act.id} (File: ${fileId})`
  //     );
  //     successCount++;
  //   } catch (error: any) {
  //     console.error(
  //       `${progress} ❌ Xatolik yuz berdi (Account: ${data.accountNumber}):`,
  //       error?.message
  //     );
  //   }
  // }

  console.log(`---
  🏁 Jarayon yakunlandi!
  ✅ Muvaffaqiyatli bog'landi: ${successCount} ta
  ❌ Xatoliklar yoki topilmaganlar: ${accountNumbers.length - successCount} ta
  ---`);
}

bindFileToActsSeed(337, abonnets, actPackId);
