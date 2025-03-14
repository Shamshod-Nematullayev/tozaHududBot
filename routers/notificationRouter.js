const router = require("express").Router();
const {
  getAllNotifications,
  markNotificationAsRead,
} = require("./controllers/notification.controller");

router.get("/", getAllNotifications);

router.put("/:id/read", markNotificationAsRead);

module.exports = router;
