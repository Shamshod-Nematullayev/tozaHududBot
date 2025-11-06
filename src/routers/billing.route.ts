import { uploadAsBlob } from "@middlewares/multer.js";

import {
  getAbonentDHJByAbonentId,
  getAbonentActs,
  duplicateActFromRequest,
  getAbonentsByMfyIdController,
  createDublicateAct,
  getActiveMfy,
  sendAbonentsListToTelegram,
  getMfyById,
  getAbonentDataByLicshet,
  getTariffs,
  getAbonentsByMfyIdExcel,
  getHouses,
  getResidents,
  createResidentAct,
  downloadPdfFileFromBillingAsBase64,
  transferMoneyBetweenResidents,
  importActs,
} from "./controllers/billing.controller.js";

import express from "express";
import { catchAsync } from "./controllers/utils/catchAsync.js";
import { getActPacks } from "./controllers/acts.controller.js";
const router = express.Router();

// --- GET routes ---
router.get("/get-file/", catchAsync(downloadPdfFileFromBillingAsBase64));
router.get(`/get-abonent-dxj-by-id`, catchAsync(getAbonentDHJByAbonentId));
router.get(
  "/get-abonent-data-by-licshet/:licshet",
  catchAsync(getAbonentDataByLicshet)
);
router.get(
  "/get-abonents-by-mfy-id/:mfy_id",
  catchAsync(getAbonentsByMfyIdController)
);
router.get(
  "/get-abonents-by-mfy-id/:mfy_id/excel",
  catchAsync(getAbonentsByMfyIdExcel)
);
router.get("/get-all-active-mfy", catchAsync(getActiveMfy));
router.get("/get-mfy-by-id/:mfy_id", catchAsync(getMfyById));
router.get("/get-abonent-acts/:abonentId", catchAsync(getAbonentActs));
router.get("/act-packs", catchAsync(getActPacks));
router.get("/get-tariffs", catchAsync(getTariffs));
router.get("/get-houses", catchAsync(getHouses));
router.get("/residents", catchAsync(getResidents));
// --- POST routes ---
router.post(
  "/create-full-akt",
  uploadAsBlob.single("file"),
  catchAsync(createResidentAct)
);
router.post(
  "/create-dvaynik-akt-by-ariza",
  uploadAsBlob.single("file"),
  catchAsync(duplicateActFromRequest)
);
router.post(
  "/create-dvaynik-akt",
  uploadAsBlob.single("file"),
  catchAsync(createDublicateAct)
);
router.post(
  "/send-abonents-list-to-telegram/",
  uploadAsBlob.any(),
  catchAsync(sendAbonentsListToTelegram)
);
router.post(
  "/monay-transfer-act",
  uploadAsBlob.single("file"),
  catchAsync(transferMoneyBetweenResidents)
);

router.post("/import-acts", catchAsync(importActs));

export default router;
