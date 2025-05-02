const router = require("express").Router();
const {
  getAllInspectors,
  setInspectorToMfy,
  unsetInspectorToMfy,
  addInspector,
  setInspectorInactive,
  setInspectorTelegramId,
  getInspectorsFromTozaMakon,
  checkTelegramId,
} = require("./controllers/inspectors.controller");

router.get("/", getAllInspectors);

router.post("/set-inspector-to-mfy/:mfy_id", setInspectorToMfy);

router.post("/unset-inspector-to-mfy/:mfy_id", unsetInspectorToMfy);

router.get("/get-inspectors-from-toza-makon", getInspectorsFromTozaMakon);

router.post("/add-inspector", addInspector);

router.get("/check-telegram/:user_id", checkTelegramId);

router.post("/set-inspector-telegram-id", setInspectorTelegramId);

router.post("/set-inspector-inactive/:id", setInspectorInactive);

module.exports = router;
