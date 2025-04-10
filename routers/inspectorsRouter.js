const router = require("express").Router();
const { Nazoratchi } = require("../models/Nazoratchi");
const { Mahalla } = require("../models/Mahalla");
const {
  getAllInspectors,
  setInspectorToMfy,
  unsetInspectorToMfy,
} = require("./controllers/inspectors.controller");

router.get("/", getAllInspectors);

router.post("/set-inspector-to-mfy/:mfy_id", setInspectorToMfy);

router.post("/unset-inspector-to-mfy/:mfy_id", unsetInspectorToMfy);

module.exports = router;
