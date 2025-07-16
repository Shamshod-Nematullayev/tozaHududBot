import { Router } from "express";
import {
  getTargets,
  createDocumentTargets,
  signDocumentTargets,
  getDocumentTargetsById,
  getDocumentTargets,
  cancelTargetById,
} from "./controllers/targets.controller.js";
import { uploadAsBlob } from "../middlewares/multer.js";
const router = Router();

router.get("/", getTargets);

router.post("/createDocument", createDocumentTargets);

router.patch(
  "/signDocument/:document_id",
  uploadAsBlob.single("file"),
  signDocumentTargets
);

router.patch("/cancel/:target_id", cancelTargetById);

router.get("/document", getDocumentTargets);
router.get("/document/:_id", getDocumentTargetsById);

export default router;
