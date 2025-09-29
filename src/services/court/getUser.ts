import { Axios } from "axios";

interface Response {
  certificates: string[];
  entity_id: string;
  fullName: string;
  id: string;
  is_advocate: boolean;
  photo: {
    data: string;
    name: string;
    size: number;
    type: string;
  };
  photo_id: string;
  pinfl: number;
  representing_org_entity_detail_id: string | null;
  representing_org_entity_id: string | null;
  token: string;
  username: string;
}

export async function getUser(cabinetSudApi: Axios): Promise<Response> {
  return (await cabinetSudApi.get("/cabinet/user/get")).data;
}
