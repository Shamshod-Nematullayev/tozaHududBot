import {
  getAllPachka,
  getElementsPachka,
  createNewPachka,
  updatePachkaById,
  deletePachkaById,
} from "../controllers/sudAktPachkaControllers.js";

import express from "express";
const router = express.Router();

router.get("/", getAllPachka);
router.get("/:pachka_id", getElementsPachka);
router.post("/", createNewPachka);
router.put("/:pachka_id", updatePachkaById);
router.delete("/:pachka_id", deletePachkaById);

export default router;
