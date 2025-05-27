const isSTMRole = require("../middlewares/isSTMRole");
const {
  getActs,
  getActById,
  checkActById,
  getActStats,
  getActPacks,
  getPdfByFileId,
  addLogToAct,
} = require("./controllers/acts.controller");

const router = require("express").Router();

router.get("/", getActs);

router.get("/packs", getActPacks);

router.get("/stats", getActStats);

router.get("/:id", getActById);

router.get("/:fileId/pdf", getPdfByFileId);

router.patch("/:id/check", isSTMRole, checkActById);

router.post("/:id/logs", isSTMRole, addLogToAct);

module.exports = router;
