const {
  getPendingNewAbonents,
  getOnePendingNewAbonent,
  cancelPendingNewAbonent,
  acceptPendingNewAbonent,
} = require("./controllers/newAbonents.controller");

const router = require("express").Router();

router.get("/", getPendingNewAbonents);

router.get("/:_id", getOnePendingNewAbonent);

router.put("/cancel/:_id", cancelPendingNewAbonent);

router.put("/accept/:_id", acceptPendingNewAbonent);

module.exports = router;
