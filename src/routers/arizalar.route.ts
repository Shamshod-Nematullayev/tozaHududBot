import express from "express";
import {
  getArizaById,
  getArizalar,
  createAriza,
  updateArizaById,
  updateArizaFromBillingById,
  cancelArizaById,
  moveToInboxAriza,
  changeArizaAct,
  addImageToAriza,
  createMonayTransferAriza,
  createMonayTransferActByAriza,
} from "./controllers/arizalar.controller";
import { uploadAsBlob } from "../middlewares/multer";
import { catchAsync } from "./controllers/utils/catchAsync";

const router = express.Router();

// --- GET routes ---
router.get("/", catchAsync(getArizalar)); // GET all arizas
router.get("/:id", catchAsync(getArizaById)); // GET specific ariza

// --- POST routes ---
router.post("/", catchAsync(createAriza)); // CREATE new ariza
router.post("/cancel", catchAsync(cancelArizaById)); // Cancel ariza (non-idempotent)
router.post("/money-transfer", catchAsync(createMonayTransferAriza)); // Create transfer
router.post("/money-transfer-act", catchAsync(createMonayTransferActByAriza));

// --- PUT routes ---
router.put("/:id", catchAsync(updateArizaById)); // Full update
router.put("/update-from-billing/:id", catchAsync(updateArizaFromBillingById)); // Billing update
router.put("/move-to-inbox/:id", catchAsync(moveToInboxAriza)); // Move ariza
router.put(
  "/change-act/:id",
  uploadAsBlob.single("file"),
  catchAsync(changeArizaAct)
);
router.put("/add-image/:id", catchAsync(addImageToAriza));

export default router;
