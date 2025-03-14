const { Notification } = require("../../models/Notification");

module.exports.getAllNotifications = async (req, res) => {
  try {
    const filters = req.query;
    const notifications = await Notification.find({
      ...filters,
      "receiver.id": req.user.id,
    });
    res.status(200).json({
      ok: true,
      notifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Internal Server Error",
    });
  }
};

module.exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "read",
          updated_at: new Date(),
        },
      },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({
        ok: false,
        message: "Notification not found",
      });
    }
    res.status(200).json({
      ok: true,
      notification,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Internal Server Error",
    });
  }
};
