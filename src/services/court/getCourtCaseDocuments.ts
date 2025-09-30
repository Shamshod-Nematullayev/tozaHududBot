import { Axios } from "axios";
import { CaseDocumentFull } from "types/cabinetSud.js";

export async function getCourtCaseDocuments(
  cabinetSudApi: Axios,
  id: string
): Promise<CaseDocumentFull[]> {
  return (await cabinetSudApi.get(`/cabinet/case/case-documents/${id}`)).data;
}
let a: CaseDocumentFull;
