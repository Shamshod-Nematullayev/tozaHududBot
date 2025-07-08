import {
  getAllBildirgilar,
  getBildirgiById,
} from "../controllers/bildirgilarController";

import express from "express";
const router = express.Router();

// Method GET all datas
router.get("/", getAllBildirgilar);

// Method GET by id
router.get("/:id", getBildirgiById);

export default router;
