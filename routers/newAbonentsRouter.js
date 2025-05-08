const {
  getPendingNewAbonents,
  getOnePendingNewAbonent,
  cancelPendingNewAbonent,
  acceptPendingNewAbonent,
  getFreeAbonentIdForNewAbonent,
  castlingWithNewAbonent,
  generateAccountNumber,
} = require("./controllers/newAbonents.controller");

const router = require("express").Router();

router.get("/", getPendingNewAbonents);

router.get("/get-by-id/:_id", getOnePendingNewAbonent);

router.put("/cancel/:_id", cancelPendingNewAbonent);

router.put("/accept/:_id", acceptPendingNewAbonent);

router.get("/get-free-abonentid", getFreeAbonentIdForNewAbonent);

router.get("/generateAccountNumber", generateAccountNumber);

router.post("/castling", castlingWithNewAbonent);

module.exports = router;
