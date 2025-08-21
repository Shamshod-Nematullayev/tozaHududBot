import { Router } from "express";
import { getMahallas } from "./controllers/mahalla.controller.js";

const router = Router();

router.get("/", getMahallas);
