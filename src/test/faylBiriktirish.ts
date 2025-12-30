import { createTozaMakonApi } from "@api/tozaMakon.js";
import { uploadFileToTozaMakon } from "@services/billing/uploadFileToTozaMakon.js";
import fs from "fs";
import path from "path";

export function faylBiriktirsh() {
  const tozaMakonApi = createTozaMakonApi(337);

  const files = fs.readdirSync(
    path.join(process.cwd(), "src", "test", "files")
  );

  let fileIds: any = {};

  files.forEach(async (file) => {
    const mahallaId = Number(file.split(".")[0]);
    try {
      const fileId = await uploadFileToTozaMakon(
        tozaMakonApi,
        fs.readFileSync(path.join(process.cwd(), "src/test/files", file)),
        file,
        "SPECIFIC_ACT"
      );
      console.log(`File ${file} uploaded successfully with ID: ${fileId}`);
      fileIds[mahallaId] = fileId;
    } catch (err) {
      console.error(`Error uploading file ${file}:`, err);
    }
  });

  const acts = [];

  //   for()

  console.log("All file IDs:", fileIds);
}
