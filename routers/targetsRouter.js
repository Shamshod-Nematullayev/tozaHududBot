const { Router } = require("express");
const { getTargets } = require("./controllers/targets.controller");
const router = Router();

router.get("/", getTargets);

module.exports = router;
