const {
  getConfirmedAbonentCountsReportByInspectors,
} = require("./controllers/reports.controller");

const router = require("express").Router();

router.get(
  "/confirmed-abonentdata-by-inspectors",
  getConfirmedAbonentCountsReportByInspectors
);

module.exports = router;
