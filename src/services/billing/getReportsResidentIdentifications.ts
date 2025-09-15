import { Axios } from "axios";

interface Params {
  companyId: number;
  regionId: number;
  districtId: number;
  dateFrom: string;
  dateTo: string;
  page?: number;
  size?: number;
}

interface Row {
  foreignIdentifiedCount: number;
  foreignIdentifiedCountByDate: number;
  id: number;
  identifiedCount: number;
  identityShare: number;
  name: string;
  residentCount: number;
  totalIdentifiedCount: number;
  unIdentifiedCount: number;
}

export async function getReportsResidentIdentifications(
  tozaMakonApi: Axios,
  params: Params
): Promise<Row[]> {
  return (
    await tozaMakonApi.get("/report-service/reports/resident-identifications", {
      params,
    })
  ).data;
}
