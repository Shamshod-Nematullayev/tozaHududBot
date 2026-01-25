import { Router } from "express";
import { catchAsync } from "./controllers/utils/catchAsync.js";
import {
  addMahallaToAutomobile,
  createAutomobile,
  deleteAutomobile,
  getAutomobileById,
  getAutomobiles,
  removeMahallaFromAutomobile,
  updateAutomobile,
  updateMahallaInAutomobile,
} from "./controllers/automobiles.controller.js";

const router = Router();

router.get("/", catchAsync(getAutomobiles));

router.get("/:id", catchAsync(getAutomobileById));

router.post("/", catchAsync(createAutomobile));

router.put("/:id", catchAsync(updateAutomobile));

router.delete("/:id", catchAsync(deleteAutomobile));

router.post("/add-mahalla/:id", catchAsync(addMahallaToAutomobile));

router.patch("/update-mahalla/:id", catchAsync(updateMahallaInAutomobile));

router.delete(
  "/remove-mahalla/:autoId/:mahallaId",
  catchAsync(removeMahallaFromAutomobile),
);

export default router;
