import { Axios } from "axios";

interface Payload {
  actIds: number[];
  fileId: string;
}

export async function uploadFileToActs(tozaMakonApi: Axios, params: Payload) {
  return await tozaMakonApi.put("/billing-service/acts/upload-attachment", {
    fileId: params.fileId,
    actIds: params.actIds,
  });
}
