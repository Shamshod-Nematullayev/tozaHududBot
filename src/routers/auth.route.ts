import { Router } from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  login,
  refreshToken,
  logout,
  changePassword,
  getPhoto,
} from "./controllers/auth.controller.js";
import { catchAsync } from "./controllers/utils/catchAsync.js";

const router = Router();

router.post("/login", catchAsync(login));
router.post("/refresh-token", catchAsync(refreshToken));
router.post("/logout", catchAsync(logout));
router.put("/change-password", isAuth, catchAsync(changePassword));
router.get("/get-photo", isAuth, catchAsync(getPhoto));

export default router;
