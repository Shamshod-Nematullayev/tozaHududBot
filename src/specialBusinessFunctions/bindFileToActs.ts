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
    mahallaId: number;
  }[],
  actPackId: number
) {
  console.log(
    `🚀 Jarayon boshlandi. CompanyId: ${companyId}, ActPackId: ${actPackId}`
  );
  const tozaMakonApi = createTozaMakonApi(companyId);

  // 1. Fayllarni o'qish va yuklash
  //   const files = fs.readdirSync("./src/specialBusinessFunctions/files");
  const fileIds: any = {
    "13559":
      "13559.pdf*tozamakon/nfs/stack_acts/2025/12/29/fd1d30bdf9ca4244b3d16ff02101249d.pdf",
    "43418":
      "43418.pdf*tozamakon/nfs/stack_acts/2025/12/29/9ceedcd49be84cfeb10351eaf8fda07d.pdf",
    "43419":
      "43419.pdf*tozamakon/nfs/stack_acts/2025/12/29/33a85919d6704b3086a5408d8184a953.pdf",
    "43422":
      "43422.pdf*tozamakon/nfs/stack_acts/2025/12/29/ba121219e9ab45268cc273534ff9362d.pdf",
    "43423":
      "43423.pdf*tozamakon/nfs/stack_acts/2025/12/29/0349e02aba044bfea05037e1f120df7e.pdf",
    "43426":
      "43426.pdf*tozamakon/nfs/stack_acts/2025/12/29/21ea90f358c44cb9b162325b7961ab06.pdf",
    "43427":
      "43427.pdf*tozamakon/nfs/stack_acts/2025/12/29/fd14b910e3d9460f80537ae505be88fb.pdf",
    "43428":
      "43428.pdf*tozamakon/nfs/stack_acts/2025/12/29/7f05632a349b4aebae7269c211cc2ce6.pdf",
    "43431":
      "43431.pdf*tozamakon/nfs/stack_acts/2025/12/29/3b244f9de05c4fa4a5c14ef5ad0db640.pdf",
    "43432":
      "43432.pdf*tozamakon/nfs/stack_acts/2025/12/29/a1d517bca0094abf97de5e9f8dc9d95c.pdf",
    "43433":
      "43433.pdf*tozamakon/nfs/stack_acts/2025/12/29/078633198fc04e499e8f886286088df0.pdf",
    "43434":
      "43434.pdf*tozamakon/nfs/stack_acts/2025/12/29/bad6b25c612c4bcd919f8237dd9483dd.pdf",
    "43435":
      "43435.pdf*tozamakon/nfs/stack_acts/2025/12/29/3699a21df4664e30824c0f1a6d8ad53b.pdf",
    "43437":
      "43437.pdf*tozamakon/nfs/stack_acts/2025/12/29/43c62b1011374385a7b1c818bff2f635.pdf",
    "43439":
      "43439.pdf*tozamakon/nfs/stack_acts/2025/12/29/f0ebdb230d7741ed9e0424a6cbece2f3.pdf",
    "43440":
      "43440.pdf*tozamakon/nfs/stack_acts/2025/12/29/834152a13bdc4f46a91a07a711f7a201.pdf",
    "43441":
      "43441.pdf*tozamakon/nfs/stack_acts/2025/12/29/f1aaca94122b45c68cc79e95a4f77624.pdf",
    "43444":
      "43444.pdf*tozamakon/nfs/stack_acts/2025/12/29/3e86d9406ead4e7f8e0341f1968b883f.pdf",
    "43446":
      "43446.pdf*tozamakon/nfs/stack_acts/2025/12/29/ea687262f5394e8fb25cb2e842989580.pdf",
    "43448":
      "43448.pdf*tozamakon/nfs/stack_acts/2025/12/29/26d70dec881b4e3d8ebdb3f89bddfa9f.pdf",
    "43450":
      "43450.pdf*tozamakon/nfs/stack_acts/2025/12/29/56ee3c61688e4a3980256ba9c8ad4c41.pdf",
    "46611":
      "46611.pdf*tozamakon/nfs/stack_acts/2025/12/29/905dec938c2e4598be23c5b58a5d5a9d.pdf",
    "46670":
      "46670.pdf*tozamakon/nfs/stack_acts/2025/12/29/e1c8f606eb62455882e7b011c41b4944.pdf",
    "46703":
      "46703.pdf*tozamakon/nfs/stack_acts/2025/12/29/ffb40488924c440d89bf46b4aa269339.pdf",
    "46782":
      "46782.pdf*tozamakon/nfs/stack_acts/2025/12/29/1a54af62c7fc4bdebde691a5997a99dc.pdf",
    "50942":
      "50942.pdf*tozamakon/nfs/stack_acts/2025/12/29/ad73e13e08d543909188e179d68c8cb2.pdf",
    "55860":
      "55860.pdf*tozamakon/nfs/stack_acts/2025/12/29/95b962db41f14fe89caa9c74c524c72f.pdf",
    "55861":
      "55861.pdf*tozamakon/nfs/stack_acts/2025/12/29/2cc4c87f420d44b7b193331797868dce.pdf",
    "55862":
      "55862.pdf*tozamakon/nfs/stack_acts/2025/12/29/a6338d3f4d764d0e88ff32354639cf08.pdf",
    "55863":
      "55863.pdf*tozamakon/nfs/stack_acts/2025/12/29/2b64d1c059d14e9494e290ccef1206de.pdf",
    "55864":
      "55864.pdf*tozamakon/nfs/stack_acts/2025/12/29/b36f04bd81a643068b7a390da39f529c.pdf",
    "55867":
      "55867.pdf*tozamakon/nfs/stack_acts/2025/12/29/54c369fc226f4d848f5ee9039ad4d5af.pdf",
    "55969":
      "55969.pdf*tozamakon/nfs/stack_acts/2025/12/29/64bfc5db7e80448e828a633a67ac57b5.pdf",
    "56430":
      "56430.pdf*tozamakon/nfs/stack_acts/2025/12/29/40ee410d7a2e4d69bd861246c51c3490.pdf",
    "56857":
      "56857.pdf*tozamakon/nfs/stack_acts/2025/12/29/500b41771d5c4f0f95040072f0023f2e.pdf",
    "56876":
      "56876.pdf*tozamakon/nfs/stack_acts/2025/12/29/91b647cfc9d44edaa0c1e21681b8904a.pdf",
    "57105":
      "57105.pdf*tozamakon/nfs/stack_acts/2025/12/29/f9defda4af5e4e7bba7c3f15472c1039.pdf",
    "57106":
      "57106.pdf*tozamakon/nfs/stack_acts/2025/12/29/f889dbd06d54439da707f7879419089d.pdf",
  };
  //   console.log(
  //     `📁 "./files" papkasida ${files.length} ta fayl topildi. Yuklash boshlanmoqda...`
  //   );

  //   for (let f of files) {
  //     try {
  //       const id = await uploadFileToTozaMakon(
  //         tozaMakonApi,
  //         fs.readFileSync(`./src/specialBusinessFunctions/files/${f}`),
  //         f,
  //         "STACK_ACT"
  //       );
  //       fileIds[f.split(".")[0]] = id;
  //       console.log(`✅ Fayl yuklandi: ${f} -> ID: ${id}`);
  //     } catch (error: any) {
  //       console.error(`❌ Fayl yuklashda xatolik (${f}):`, error?.message);
  //     }
  //   }
  //   console.log(fileIds);

  // 2. Accountlarni aktlarga bog'lash
  console.log(
    `🔗 Accountlarni aktlarga bog'lash boshlandi (${accountNumbers.length} ta)...`
  );
  let successCount = 0;

  for (let i = 0; i < accountNumbers.length; i++) {
    const data = accountNumbers[i];
    const progress = `[${i + 1}/${accountNumbers.length}]`;

    try {
      // Aktni qidirish
      const searchResult = await searchActFromPack(tozaMakonApi, {
        page: 0,
        size: 1,
        actPackId: actPackId,
        sort: "id,DESC",
        accountNumber: data.accountNumber.toString(),
      });

      const act = searchResult.content[0];

      if (!act) {
        console.warn(
          `${progress} ⚠️ Akt topilmadi: Account ${data.accountNumber}`
        );
        continue;
      }

      const fileId = fileIds[data.mahallaId];
      if (!fileId) {
        console.warn(
          `${progress} ⚠️ Mahalla uchun fayl topilmadi: MahallaID ${data.mahallaId}`
        );
        continue;
      }

      // Faylni aktga bog'lash
      await uploadFileToActs(tozaMakonApi, {
        actIds: [act.id],
        fileId: fileId,
      });

      console.log(
        `${progress} ✨ Muvaffaqiyatli: Account ${data.accountNumber} -> Akt ${act.id} (File: ${fileId})`
      );
      successCount++;
    } catch (error: any) {
      console.error(
        `${progress} ❌ Xatolik yuz berdi (Account: ${data.accountNumber}):`,
        error?.message
      );
    }
  }

  console.log(`---
  🏁 Jarayon yakunlandi!
  ✅ Muvaffaqiyatli bog'landi: ${successCount} ta
  ❌ Xatoliklar yoki topilmaganlar: ${accountNumbers.length - successCount} ta
  ---`);
}

bindFileToActsSeed(337, abonnets, actPackId);
