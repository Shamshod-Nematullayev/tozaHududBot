import { Role } from "@models/Admin.js";
import { NextFunction, Request, Response } from "express";

export default function (allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (allowedRoles.some((role) => req.user.roles.includes(role))) {
      return next();
    }
    return res.status(403).json({
      error: "Access denied",
      message: "Sizning ushbu amaliyotni bajarish uchun huquqingiz yo'q",
    });
  };
}
