import { Axios } from "axios";

export async function deleteGeoZoneFromSmartGps(
  smartGpsApi: Axios,
  itemId: number,
  geoZoneId: number
): Promise<(number | null)[]> {
  const res = await smartGpsApi.post("/resource/update_zone", {
    params: {
      itemId: itemId,
      id: geoZoneId,
      callMode: "delete",
    },
  });

  return res.data;
}
