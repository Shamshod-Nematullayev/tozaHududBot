import { Axios } from "axios";
import FormData from "form-data";

/**
 * Faylni TozaMakon APIga yuklaydi va fileId qaytaradi
 */
export async function uploadFileToTozaMakon(
  tozaMakonApi: Axios,
  buffer: Buffer,
  filename: string,
  folderType: "SPECIFIC_ACT"
): Promise<string> {
  const formData = new FormData();
  formData.append("file", buffer, filename);

  const res = await tozaMakonApi.post(
    "/file-service/buckets/upload?folderType=" + folderType,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data.fileName + "*" + res.data.fileId;
}
