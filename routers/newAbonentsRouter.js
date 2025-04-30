const {
  getPendingNewAbonents,
} = require("./controllers/newAbonents.controller");

const router = require("express").Router();

router.get("/", getPendingNewAbonents);

module.exports = router;
