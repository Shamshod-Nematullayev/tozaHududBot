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
} from "./controllers/arizalar.controller";
import { uploadAsBlob } from "../middlewares/multer";

const router = express.Router();

// --- GET routes ---
router.get("/", getArizalar); // GET all arizas
router.get("/:id", getArizaById); // GET specific ariza

// --- POST routes ---
router.post("/", createAriza); // CREATE new ariza
router.post("/cancel", cancelArizaById); // Cancel ariza (non-idempotent)
router.post("/money-transfer", createMonayTransferAriza); // Create transfer

// --- PUT routes ---
router.put("/:id", updateArizaById); // Full update
router.put("/update-from-billing/:id", updateArizaFromBillingById); // Billing update
router.put("/move-to-inbox/:id", moveToInboxAriza); // Move ariza
router.put("/change-act/:id", uploadAsBlob.single("file"), changeArizaAct);
router.put("/add-image/:id", addImageToAriza);

export default router;
