import express from "express";
const router = express.Router();
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./controllers/notification.controller";

router.get("/", getAllNotifications);

router.put("/read-all", markAllNotificationsAsRead);

router.put("/:id/read", markNotificationAsRead);

export default router;
