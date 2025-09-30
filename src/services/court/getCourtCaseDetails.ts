import { Axios } from "axios";
import { ICourtCase } from "types/cabinetSud.js";

export async function getCourtCaseDetails(
  cabinetSudApi: Axios,
  id: string
): Promise<ICourtCase> {
  return (await cabinetSudApi.get("/cabinet/case/conflict-suit-view/" + id))
    .data;
}
