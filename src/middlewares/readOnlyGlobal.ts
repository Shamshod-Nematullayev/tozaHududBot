import { Handler } from "express";

const BLOCKED_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

export const readOnlyGlobal: Handler = (req, res, next) => {
  if (BLOCKED_METHODS.includes(req.method) && req.user?.isTestUser === true) {
    res.status(403).json({
      code: "READ_ONLY_MODE",
      message: "Demo account. Write operations are disabled.",
    });
    return;
  }

  next();
};
