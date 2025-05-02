const router = require("express").Router();
const {
  getAllInspectors,
  setInspectorToMfy,
  unsetInspectorToMfy,
  addInspector,
  setInspectorInactive,
  setInspectorTelegramId,
} = require("./controllers/inspectors.controller");

router.get("/", getAllInspectors);

router.post("/set-inspector-to-mfy/:mfy_id", setInspectorToMfy);

router.post("/unset-inspector-to-mfy/:mfy_id", unsetInspectorToMfy);

router.get("/get-inspectors-from-toza-makon", getInspectorsFromTozaMakon);

router.post("/add-inspector", addInspector);

router.post("/set-inspector-telegram-id", setInspectorTelegramId);

router.post("/set-inspector-inactive", setInspectorInactive);

module.exports = router;
