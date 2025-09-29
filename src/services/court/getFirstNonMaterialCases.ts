import { Axios } from "axios";

interface Params {
  size: number;
  page: number;
  withCreated: boolean;
  participantType: "owner";
  case_number?: string;
  claim_kind?: "SIMPLIFIED" | "DECREE";
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
  params: Params
): Promise<Response> {
  return (
    await cabinetSudApi.get("/cabinet/cases/first-non-material", { params })
  ).data;
}
