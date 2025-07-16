import { Axios } from "axios";

export type Street = {
  id: number;
  name: string;
  districtName: string;
  description: string;
  regionName: string;
};

export async function getStreetsByMahallaId(
  tozaMakonApi: Axios,
  mahallaId: number
): Promise<Street[]> {
  return (
    await tozaMakonApi.get(`/user-service/mahallas/streets`, {
      params: {
        size: 1000,
        mahallaId,
      },
    })
  ).data;
}
