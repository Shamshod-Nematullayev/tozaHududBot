import { Notification } from "../../models/Notification.js";

export const getAllNotifications = async (req, res) => {
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

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const notifications = await Notification.updateMany(
      { "receiver.id": req.user.id },
      { $set: { status: "read", updated_at: new Date() } }
    );
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

export const markNotificationAsRead = async (req, res) => {
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
