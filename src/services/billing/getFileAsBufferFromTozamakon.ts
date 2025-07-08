import { Axios } from "axios";

export async function getFileAsBuffer(tozaMakonApi: Axios, fileId: string) {
  return (
    await tozaMakonApi.get("/file-service/buckets/download", {
      params: { file: fileId },
      responseType: "arraybuffer",
    })
  ).data;
}
