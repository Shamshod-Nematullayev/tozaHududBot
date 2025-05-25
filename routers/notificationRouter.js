const router = require("express").Router();
const {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("./controllers/notification.controller");

router.get("/", getAllNotifications);

router.put("/read-all", markAllNotificationsAsRead);

router.put("/:id/read", markNotificationAsRead);

module.exports = router;
