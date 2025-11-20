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
  55463, 60356, 60358, 60359, 60361, 60362, 60363, 60366, 61554, 61556,
];

// bindAbonentsToGeozone(1144, mahallalar);
