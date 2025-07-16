import isSTMRole from "@middlewares/isSTMRole";
import {
  getActs,
  getActById,
  checkActById,
  getActStats,
  getActPacks,
  getPdfByFileId,
  addLogToAct,
  calculateAmount,
} from "./controllers/acts.controller.js";

import express from "express";
const router = express.Router();

router.get("/", getActs);

router.get("/packs", getActPacks);

router.get("/stats", getActStats);

router.get("/pdf", getPdfByFileId);

router.get("/calculate-amount", calculateAmount);

router.get("/:id", getActById);

router.patch("/:id/check", isSTMRole, checkActById);

router.post("/:id/logs", isSTMRole, addLogToAct);

export default router;
