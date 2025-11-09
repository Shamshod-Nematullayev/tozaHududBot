import express from "express";
const router = express.Router();
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification,
} from "./controllers/notification.controller.js";
import { catchAsync } from "./controllers/utils/catchAsync.js";

router.get("/", catchAsync(getAllNotifications));

router.put("/read-all", catchAsync(markAllNotificationsAsRead));

router.put("/:id/read", catchAsync(markNotificationAsRead));

router.post("/", catchAsync(createNotification));

export default router;
