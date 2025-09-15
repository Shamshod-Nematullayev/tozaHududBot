import {
  getConfirmedAbonentCountsReportByInspectors,
  getConfirmedAbonentCountsReportByInspectorsExcel,
  getConfirmedAbonentCountsReportByMahalla,
  getConfirmedAbonentCountsReportByMahallaExcel,
} from "./controllers/reports.controller.js";

import express from "express";
import { catchAsync } from "./controllers/utils/catchAsync.js";
const router = express.Router();

router.get(
  "/confirmed-abonentdata-by-inspectors",
  catchAsync(getConfirmedAbonentCountsReportByInspectors)
);

router.get(
  "/confirmed-abonentdata-by-inspectors/excel",
  catchAsync(getConfirmedAbonentCountsReportByInspectorsExcel)
);

router.get(
  "/confirmed-abonentdata-by-mahallas",
  catchAsync(getConfirmedAbonentCountsReportByMahalla)
);

router.get(
  "/confirmed-abonentdata-by-mahallas/excel",
  catchAsync(getConfirmedAbonentCountsReportByMahallaExcel)
);

export default router;
