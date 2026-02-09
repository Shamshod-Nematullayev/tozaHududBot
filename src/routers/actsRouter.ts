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
import allowRoles from "@middlewares/allowRoles.js";
import { catchAsync } from "./controllers/utils/catchAsync.js";
const router = express.Router();

router.get("/", catchAsync(getActs));

router.get("/packs", catchAsync(getActPacks));

router.get("/stats", catchAsync(getActStats));

router.get("/pdf", catchAsync(getPdfByFileId));

router.get("/calculate-amount", catchAsync(calculateAmount));

router.get("/:id", catchAsync(getActById));

router.patch("/:id/check", allowRoles(["stm"]), catchAsync(checkActById));

router.post("/:id/logs", allowRoles(["stm"]), catchAsync(addLogToAct));

export default router;
