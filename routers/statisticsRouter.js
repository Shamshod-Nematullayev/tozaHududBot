const {
  getIdentityStat,
  getETKConfirmStat,
  getLastUpdateDateAbonentsSaldo,
  getNewAbonentRequstsCount,
} = require("./controllers/statistics.controller");

const router = require("express").Router();

router.get("/identity", getIdentityStat);
router.get("/elektrConfirm", getETKConfirmStat);
router.get("/lastUpdateDateAbonentsSaldo", getLastUpdateDateAbonentsSaldo);
router.get("/newAbonentRequstsCount", getNewAbonentRequstsCount);

module.exports = router;
