import { Axios } from "axios";

export enum sudIshTartibi {
  davo = "SUIT",
  davoSoddalashtirilgan = "SIMPLIFIED",
  buyruq = "DECREE",
  hakamlikSudiningHalQilovchiQarorigaDoir = "ARBITRAGE",
  alohidaTartibda = "SEPARATE",
}

export enum sudIshNatijasi {
  qanoatlantirilgan = "FULFILLED",
  qismanQanoatlantirilgan = "PARTIALLY_FULFILLED",
  qanoatlantirilmagan = "REFUSED",
  korilmayQolgan = "UNCONSIDERED",
  tugatilgan = "CASE_ENDED",
  ruyxatgaOlishRadEtilgan = "REGISTRATION_DECLINED",
  boshqaSudgaYuborilgan = "SENT_TO_OTHER_COURT",
  tergovgaQaratilgan = "RETURNED_TO_INVESTIGATION",
  boshqaIshgaBiriktirilgan = "JOINED_TO_OTHER_CASE",
  radEtilgan = "REJECTED",
  qaytarilgan = "RETURNED",
}

interface Params {
  claim_kind: sudIshTartibi;
  size?: number;
  page?: number;
  withCreated?: boolean;
  participantType?: "owner";
  case_number?: string;
  status?: "all" | "registered" | "in_process" | "finished";
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  hearing_date_start?: string; // YYYY-MM-DD
  hearing_date_end?: string; // YYYY-MM-DD
  case_result?: sudIshNatijasi;
}

interface Response {
  first: boolean;
  last: boolean;
  content: {
    case_id: string;
    case_number: string;
    case_result: string;
    claim_id: string;
    claim_kind: string;
    court_id: string;
    created_at: string;
    current_status: string;
    hearing_date: string;
    instance: string;
    names: {
      qq: string;
      ru: string;
      uz: string;
      uz_cyr: string;
    };
    participants: {
      inn: number;
      is_appellant: boolean;
      name: string;
      pinfl: string | null;
      type: "DEFENDANT" | "CLAIMANT";
    }[];
    registry_dt: string;
    registry_number: string;
    responsible_judge: string | null;
    speaker_judge: string | null;
  }[];
  limit: string;
  numberOfElements: number;
  page: string;
  sort: string;
  totalElements: number;
  totalPages: number;
}

export async function getFirstNonMaterialCases(
  cabinetSudApi: Axios,
  {
    size = 0,
    page = 10,
    withCreated = true,
    participantType = "owner",
    case_number,
    claim_kind,
  }: Params
): Promise<Response> {
  return (
    await cabinetSudApi.get("/cabinet/case/civil/first-non-material-cases", {
      params: {
        size,
        page,
        withCreated,
        participantType,
        case_number,
        claim_kind,
      },
    })
  ).data;
}
