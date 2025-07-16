import { usersMapSocket, io } from "../config/socketConfig";

import { Notification } from "@models/Notification.js";

export async function createNotification({
  message,
  type,
  params,
  sender,
  receiver,
}) {
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
