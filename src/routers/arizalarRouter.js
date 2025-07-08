import { Ariza } from "@models/Ariza";
import { Counter } from "@models/Counter";
import { Abonent } from "@models/Abonent";
import {
  getArizaById,
  getArizalar,
  updateArizaFromBillingById,
  changeArizaAct,
  addImageToAriza,
  cancelArizaById,
  createAriza,
  moveToInboxAriza,
  updateArizaById,
  createMonayTransferAriza,
} from "./controllers/arizalar.controller";
import { uploadAsBlob } from "../middlewares/multer";

import express from "express";
const router = express.Router();

router.get("/", getArizalar);

router.get("/:_id", getArizaById);

router.post("/cancel-ariza-by-id", cancelArizaById);

router.post("/create", createAriza);

router.patch("/move-to-inbox/:ariza_id", moveToInboxAriza);
router.patch("/:ariza_id", updateArizaById);

router.put("/updateFromBilling/:ariza_id", updateArizaFromBillingById);

router.put(
  "/change-akt/:ariza_id",
  uploadAsBlob.single("file"),
  changeArizaAct
);

router.put("/add-image/:ariza_id", addImageToAriza);

router.post("/create-monay-transfer-ariza", createMonayTransferAriza);

export default router;
