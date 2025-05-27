const isSTMRole = require("../middlewares/isSTMRole");
const {
  getActs,
  getActById,
  checkActById,
  getActStats,
  getActPacks,
  getPdfByFileId,
  addLogToAct,
  calculateAmount,
} = require("./controllers/acts.controller");

const router = require("express").Router();

router.get("/", getActs);

router.get("/packs", getActPacks);

router.get("/stats", getActStats);

router.get("/pdf", getPdfByFileId);

router.get("/calculate-amount", calculateAmount);

router.get("/:id", getActById);

router.patch("/:id/check", isSTMRole, checkActById);

router.post("/:id/logs", isSTMRole, addLogToAct);

module.exports = router;
