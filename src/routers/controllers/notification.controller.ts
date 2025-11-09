import { Request, Response } from "express";
import { Notification } from "../../models/Notification.js";
import z from "zod";
import { notificationService } from "@services/notification.js";
import { Admin } from "@models/Admin.js";

export const getAllNotifications = async (req: Request, res: Response) => {
  const filters = req.query;
  const notifications = await Notification.find({
    ...filters,
    "receiver.id": req.user.id,
  });
  res.status(200).json({
    ok: true,
    notifications,
  });
};

export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
) => {
  const notifications = await Notification.deleteMany({
    "receiver.id": req.user.id,
  });
  res.status(200).json({
    ok: true,
    notifications,
  });
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response
): Promise<any> => {
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
};

export const createNotification = async (req: Request, res: Response) => {
  const body = z
    .object({
      message: z.string(),
      receiver: z.object({
        id: z.string(),
        name: z.string(),
      }),
      type: z.enum(["alert", "info", "task"]),
      data: z.object().optional(),
    })
    .parse(req.body);

  const admin = await Admin.findById(req.user.id);
  await notificationService.createNotification({
    message: body.message,
    receiver: body.receiver,
    sender: {
      id: req.user.id,
      name: req.user.fullName,
      role: admin?.roles[0],
    },
    type: body.type,
    data: body.data,
  });
  res.json({
    ok: true,
  });
};
