const { getActs, getActById } = require("./controllers/acts.controller");

const router = require("express").Router();

router.get("/", getActs);

router.get("/:id", getActById);

router.patch("/:id/check", checkById);

module.exports = router;
