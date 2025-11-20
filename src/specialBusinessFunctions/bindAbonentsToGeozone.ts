import { createTozaMakonApi } from "@api/tozaMakon.js";
import { Company } from "@models/Company.js";
import { searchAbonent } from "@services/billing/searchAbonent.js";
import { getSubMahallas } from "@services/gps/getSubMahallas.js";

export async function bindAbonentsToGeozone(
  companyId: number,
  mahallalar: number[]
) {
  console.log(
    `\n=== GEOZONALARGA BIRIKTIRISH BOSHLANDI | CompanyID: ${companyId} ===`
  );

  const company = await Company.findOne({ id: companyId });
  if (!company) throw new Error("Company not found");

  console.log(
    `Company topildi: ID=${company.id}, DistrictID=${company.districtId}`
  );

  const tozaMakonApi = createTozaMakonApi(companyId, "gps");

  for (let mahallaId of mahallalar) {
    console.log(`\n--- Mahalla ${mahallaId} bo‘yicha ishlov boshlandi ---`);

    // 1) Mahalladagi abonentlar soni
    const abonentlar_soni = (
      await searchAbonent(tozaMakonApi, {
        companyId: companyId,
        mahallaBindStatus: true,
        bindStatus: true,
        sort: "id,desc",
        districtId: company.districtId,
        mahallaId: mahallaId,
        page: 0,
        size: 1,
      })
    ).totalElements;

    console.log(`Mahalladagi abonentlar soni: ${abonentlar_soni}`);

    // 2) Geozonalarni olish
    const geozones = await getSubMahallas(tozaMakonApi, {
      districtId: company.districtId,
      mahallaId: mahallaId,
      page: 0,
      size: 300,
    });

    console.log(`Geozonalar soni: ${geozones.content.length}`);

    // 3) Har geozonaga qancha abonent to‘g‘ri kelishi
    const size = Math.floor(abonentlar_soni / geozones.content.length);
    console.log(`Bir geozonaga ajratiladigan abonentlar soni: ${size}`);

    let i = 0;

    for (let geozone of geozones.content) {
      console.log(
        `Geozone ID=${geozone.id} uchun abonentlar olinmoqda | Page=${i} | Size=${size}`
      );

      const abonentIds = (
        await searchAbonent(tozaMakonApi, {
          companyId: companyId,
          mahallaBindStatus: true,
          bindStatus: true,
          sort: "id,desc",
          districtId: company.districtId,
          mahallaId: mahallaId,
          page: i++,
          size: size,
        })
      ).content.map((abonent) => abonent.id);

      console.log(
        `Geozone ID=${geozone.id} ga ${abonentIds.length} ta abonent biriktirilmoqda...`
      );

      // 4) Biriktirish
      await tozaMakonApi.post("/user-service/sub-mahalla-residents", {
        subMahallaId: geozone.id,
        residentIds: abonentIds,
      });

      console.log(`✔ Biriktirildi: Geozone ${geozone.id}`);
    }

    console.log(`--- Mahalla ${mahallaId} bo‘yicha ishlov tugadi ---`);
  }

  console.log("\n=== BARCHA MAHALLALAR UCHUN BIRIKTIRISH YAKUNLANDI ===\n");
}

const mahallalar: number[] = [
  18161, 22804, 23624, 25704, 32204, 43025, 43026, 43027, 43028, 43029, 43030,
  43031, 43032, 43033, 43034, 43035, 43036, 43037, 43077, 43079, 43080, 43087,
  52367, 54599, 54600, 54601, 54602, 54603, 54604, 54605, 54606, 54607, 55300,
  55462, 55464, 55465, 55466, 55544, 55545, 55546, 56626, 56627, 56628, 56648,
  56652, 56653, 56654, 56655, 56679, 56681, 56907, 56908, 56909, 56910, 56911,
  60357, 60364, 60365, 61552,
];

// bindAbonentsToGeozone(1144, mahallalar);
