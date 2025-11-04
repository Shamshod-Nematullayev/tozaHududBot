import {
  getPendingNewAbonents,
  getOnePendingNewAbonent,
  cancelPendingNewAbonent,
  acceptPendingNewAbonent,
  getFreeAbonentIdForNewAbonent,
  castlingWithNewAbonent,
  generateAccountNumber,
} from "./controllers/newAbonents.controller.js";

import express from "express";
import { catchAsync } from "./controllers/utils/catchAsync.js";
const router = express.Router();

router.get("/", catchAsync(getPendingNewAbonents));

router.get("/get-by-id/:_id", catchAsync(getOnePendingNewAbonent));

router.put("/cancel/:_id", catchAsync(cancelPendingNewAbonent));

router.put("/accept/:_id", catchAsync(acceptPendingNewAbonent));

router.get("/get-free-abonentid", catchAsync(getFreeAbonentIdForNewAbonent));

router.get("/generateAccountNumber", catchAsync(generateAccountNumber));

router.post("/castling", catchAsync(castlingWithNewAbonent));

export default router;
