import { uploadAsBlob } from "@middlewares/multer.js";

import express from "express";
import { catchAsync } from "./controllers/utils/catchAsync.js";
import {
  getFileById,
  sendExcelToTelegram,
  uploadDocumentTelegram,
} from "./controllers/telegram.controller.js";
const router = express.Router();

router.get("/:file_id", catchAsync(getFileById));

router.post(
  "/create-document",
  uploadAsBlob.single("file"),
  catchAsync(uploadDocumentTelegram)
);

router.post(
  "/send-excel-to-telegram",
  uploadAsBlob.single("file"),
  catchAsync(sendExcelToTelegram)
);

export default router;
