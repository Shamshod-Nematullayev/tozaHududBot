import { uploadAsBlob } from "../middlewares/multer";
import {
  cancelDalolatnoma,
  createXatlovDocument,
  getMultiplyRequests,
  getMahallasMultiplyRequests,
  updateFromTozamakon,
  updateMultiplyRequest,
  getOneDalolatnoma,
  confirmDalolatnoma,
  getRowsByIds,
  getDalolatnomalar,
} from "./controllers/xatlovInhabitantCnt.controller.js";

import express from "express";
const router = express.Router();

router.post("/", createXatlovDocument);
router.get("/", getMultiplyRequests);

router.get("/mahallas", getMahallasMultiplyRequests);

router.patch("/update-from-tozamakon/:_id", updateFromTozamakon);

router.put("/:_id", updateMultiplyRequest);

router.get("/get-dalolatnomalar", getDalolatnomalar);

router.get("/get-one-dalolatnoma", getOneDalolatnoma);

router.put("/confirm/:_id", uploadAsBlob.single("file"), confirmDalolatnoma);

router.get("/get-rows-by-ids", getRowsByIds);

router.put("/cancel-document/:_id", cancelDalolatnoma);

export default router;
