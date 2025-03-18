const { usersMapSocket, io } = require("../config/socketConfig");
const { Notification } = require("../models/Notification");

async function createNotification({ message, type, params, sender, receiver }) {
  const notification = await Notification.create({
    message,
    type,
    params,
    sender,
    receiver,
  });
  if (usersMapSocket[receiver.id]) {
    io.to(usersMapSocket[receiver.id]).emit("notification", notification);
  }
  return notification;
}

module.exports = { createNotification };
