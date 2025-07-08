import {
  getPendingNewAbonents,
  getOnePendingNewAbonent,
  cancelPendingNewAbonent,
  acceptPendingNewAbonent,
  getFreeAbonentIdForNewAbonent,
  castlingWithNewAbonent,
  generateAccountNumber,
} from "./controllers/newAbonents.controller";

import express from "express";
const router = express.Router();

router.get("/", getPendingNewAbonents);

router.get("/get-by-id/:_id", getOnePendingNewAbonent);

router.put("/cancel/:_id", cancelPendingNewAbonent);

router.put("/accept/:_id", acceptPendingNewAbonent);

router.get("/get-free-abonentid", getFreeAbonentIdForNewAbonent);

router.get("/generateAccountNumber", generateAccountNumber);

router.post("/castling", castlingWithNewAbonent);

export default router;
