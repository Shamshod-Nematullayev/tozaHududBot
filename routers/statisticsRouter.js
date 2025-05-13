const {
  getIdentityStat,
  getETKConfirmStat,
  getLastUpdateDateAbonentsSaldo,
} = require("./controllers/statistics.controller");

const router = require("express").Router();

router.get("/identity", getIdentityStat);
router.get("/elektrConfirm", getETKConfirmStat);
router.get("/lastUpdateDateAbonentsSaldo", getLastUpdateDateAbonentsSaldo);

module.exports = router;
