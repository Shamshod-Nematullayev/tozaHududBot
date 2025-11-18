import { createTozaMakonApi } from "@api/tozaMakon.js";
import { Company } from "@models/Company.js";
import { searchAbonent } from "@services/billing/searchAbonent.js";
import { getSubMahallas } from "@services/gps/getSubMahallas.js";

export async function bindAbonentsToGeozone(companyId: number) {
  const company = await Company.findOne({ id: companyId });
  if (!company) throw new Error("Company not found");
  const tozaMakonApi = createTozaMakonApi(companyId, "gps");
  // mahallalar ro'yxati mahallaId[]
  const mahallalar: number[] = [];
  // har bir mahalla bo'yicha yurib chiqish
  for (let mahallaId of mahallalar) {
    // mahalladagi abonentlar sonini olish
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
    // mahalladagi geozonalarni hammasini olish
    const geozones = await getSubMahallas(tozaMakonApi, {
      districtId: company.districtId,
      mahallaId: companyId,
      page: 0,
      size: 300,
    });
    const size = abonentlar_soni / geozones.content.length;
    // abonentlar soni / geozonalar soni ga bo' xuddi shuncha miqdorda bazadan abonentlar olinadi har bir pageda
    let i = 0;
    for (let geozone of geozones.content) {
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
      // Geozonaga biriktiriladi
      await tozaMakonApi.post("/user-service/sub-mahalla-residents", {
        subMahallaId: geozone.id,
        residentIds: abonentIds,
      });
    }
  }
}
