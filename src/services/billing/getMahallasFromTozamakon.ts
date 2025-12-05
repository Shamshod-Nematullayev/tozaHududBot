import { Axios } from "axios";

interface Paylaod {
  districtId: number;
  size: number;
}
interface IMahalla {
  accrualCancelled: boolean;
  accrualType: string;
  actualBalanceCalculateIndicator: boolean;
  affectToBalance: boolean;
  companyId: number;
  companyName: string;
  contractCreatedAt: string;
  description: string;
  districtId: number;
  districtName: string;
  file: null;
  geofenceUniqueId: string;
  gpsAccrualConfirmationFileId: string;
  gpsAccrualStartDate: string;
  gpsWeightDuration: null;
  gpsWeightMileage: null;
  gpsWeightSpeed: null;
  gpsWeightStops: null;
  id: number;
  inspectorId: null;
  inspectorName: null;
  isFrozen: boolean;
  isNewMahallaContract: boolean;
  maxAvgSpeed: null;
  minMileage: null;
  minMovingDuration: number;
  minStopsCount: null;
  monthlyTripsNumber: null;
  name: string;
  publicOfferFileId: string;
  regionId: number;
  regionName: string;
  sectorType: string;
  soato: number;
  villageCode: null;
}

interface IResponse {
  content: IMahalla[];
  totalElements: number;
  number: number;
  size: number;
}

export async function getMahallasFromTozamakon(
  tozaMakonApi: Axios,
  params: Paylaod
): Promise<IResponse> {
  return (await tozaMakonApi.get("/user-service/mahallas", { params })).data;
}
