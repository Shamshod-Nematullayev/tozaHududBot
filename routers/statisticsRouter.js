const {
  getIdentityStat,
  getETKConfirmStat,
} = require("./controllers/statistics.controller");

const router = require("express").Router();

router.get("/identity", getIdentityStat);
router.get("/elektrConfirm", getETKConfirmStat);

module.exports = router;
