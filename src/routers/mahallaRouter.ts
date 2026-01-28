import { Router } from "express";
import { getMahallas } from "./controllers/mahalla.controller.js";
import { catchAsync } from "./controllers/utils/catchAsync.js";

const router = Router();

router.get("/", catchAsync(getMahallas));

export default router;
