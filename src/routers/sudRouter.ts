import express from "express";
const router = express.Router();
import { uploadAsBlob } from "../middlewares/multer.js";

import {
  getSudAkts,
  getCourtCaseBySudAktId,
  getOneSudAkt,
  searchByLicshetSudakt,
  createSudAriza,
  createManySudAriza,
  uploadSudArizaFile,
  getDebitorAbonents,
  getDebitorAbonentsExcel,
  updateHybridMailsStatus,
  getHybridMails,
  uploadCashToBilling,
  getOneHybridMailFromDb,
  updateMailWarningAmount,
  updateMailStatus,
  getHybridMailChekAndSend,
} from "./controllers/sud.controller.js";
import { catchAsync } from "./controllers/utils/catchAsync.js";
import { createHybridPochtaApi } from "@api/hybridPochta.js";
import { getHybridMailChek } from "@services/hybrydPost/getHybridMailChek.js";

router.get("/", getSudAkts);

router.get("/court-case-by-id/:_id", getCourtCaseBySudAktId);

router.get("/find-one", getOneSudAkt);

router.get("/search-by-licshet", searchByLicshetSudakt);

router.put("/create-ariza/:_id", createSudAriza);

router.put("/create-many-ariza", createManySudAriza);

router.post(
  "/upload-ariza-file",
  uploadAsBlob.single("file"),
  uploadSudArizaFile
);

router.get("/hybrid-mails", catchAsync(getHybridMails));

router.get("/hybrid-mails/:mail_id", catchAsync(getOneHybridMailFromDb));
// update one mail by id
router.patch("/hybrid-mails/:mail_id", catchAsync(updateMailWarningAmount));

router.put(
  "/hybrid-mails/upload-cash-to-billing/:mail_id",
  catchAsync(uploadCashToBilling)
);

router.put("/hybrid-mails-status-from-db", catchAsync(updateHybridMailsStatus));

router.put("/update-mail-status/:mail_id", catchAsync(updateMailStatus));

router.get("/debitor-abonents", getDebitorAbonents);

router.get("/debitor-abonents/excel", getDebitorAbonentsExcel);

router.get("/hybrid-mail-check/:mail_id", catchAsync(getHybridMailChekAndSend));

export default router;
