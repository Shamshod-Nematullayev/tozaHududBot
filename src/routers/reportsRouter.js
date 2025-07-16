import {
  getConfirmedAbonentCountsReportByInspectors,
  getConfirmedAbonentCountsReportByInspectorsExcel,
} from "./controllers/reports.controller.js";

import express from "express";
const router = express.Router();

router.get(
  "/confirmed-abonentdata-by-inspectors",
  getConfirmedAbonentCountsReportByInspectors
);

router.get(
  "/confirmed-abonentdata-by-inspectors/excel",
  getConfirmedAbonentCountsReportByInspectorsExcel
);

export default router;
