import { Router } from "express";
import { catchAsync } from "./controllers/utils/catchAsync.js";
import {
  createGPSDalolatnoma,
  getCars,
  getGPSDalolatnomalar,
  getOneGPSDalolatnomaById,
} from "./controllers/gps.controller.js";
import allowRoles from "@middlewares/allowRoles.js";

const router = Router();

router.get("/cars", catchAsync(getCars));

router.post("/create-dalolatnoma", catchAsync(createGPSDalolatnoma));

router.get("/dalolatnomalar", catchAsync(getGPSDalolatnomalar));

router.get("/:_id", catchAsync(getOneGPSDalolatnomaById));

export default router;
