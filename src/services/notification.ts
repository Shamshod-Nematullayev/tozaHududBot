import { Notification } from "@models/Notification.js";
import { io, usersMapSocket } from "config/socketConfig.js";
import { Server } from "socket.io";

export class NotificationService {
  constructor(private readonly io: Server) {
    this.io = io;
  }

  async createNotification({
    message,
    type,
    sender,
    receiver,
    data = {},
  }: {
    message: string;
    type: "alert" | "info" | "task";
    sender: {
      id: string | "system";
      name?: string;
      role?: string;
    };
    receiver: {
      id: string;
      name: string;
    };
    data?: any;
  }) {
    console.log(usersMapSocket);
    const notification = await Notification.create({
      data,
      message,
      type,
      sender,
      receiver,
    });
    this.io.to(usersMapSocket[receiver.id]).emit("notification", {
      message,
      type,
      sender,
      receiver,
      createdAt: new Date(),
      data,
      status: "new",
      _id: notification._id,
    });
  }
}

export const notificationService = new NotificationService(io);
