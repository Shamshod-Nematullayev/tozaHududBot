const {
  getPendingNewAbonents,
  getOnePendingNewAbonent,
  cancelPendingNewAbonent,
  acceptPendingNewAbonent,
  getFreeAbonentIdForNewAbonent,
  castlingWithNewAbonent,
} = require("./controllers/newAbonents.controller");

const router = require("express").Router();

router.get("/", getPendingNewAbonents);

router.get("/:_id", getOnePendingNewAbonent);

router.put("/cancel/:_id", cancelPendingNewAbonent);

router.put("/accept/:_id", acceptPendingNewAbonent);

router.get("/get-free-abonentid", getFreeAbonentIdForNewAbonent);

router.post("/castling", castlingWithNewAbonent);

module.exports = router;
