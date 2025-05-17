const {
  getConfirmedAbonentCountsReportByInspectors,
  getConfirmedAbonentCountsReportByInspectorsExcel,
} = require("./controllers/reports.controller");

const router = require("express").Router();

router.get(
  "/confirmed-abonentdata-by-inspectors",
  getConfirmedAbonentCountsReportByInspectors
);

router.get(
  "/confirmed-abonentdata-by-inspectors/excel",
  getConfirmedAbonentCountsReportByInspectorsExcel
);

module.exports = router;
