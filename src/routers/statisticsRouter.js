import {
  getIdentityStat,
  getETKConfirmStat,
  getLastUpdateDateAbonentsSaldo,
  getNewAbonentRequstsCount,
} from "./controllers/statistics.controller.js";

import express from "express";
const router = express.Router();

router.get("/identity", getIdentityStat);
router.get("/elektrConfirm", getETKConfirmStat);
router.get("/lastUpdateDateAbonentsSaldo", getLastUpdateDateAbonentsSaldo);
router.get("/newAbonentRequstsCount", getNewAbonentRequstsCount);

export default router;
