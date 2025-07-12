import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
): any => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      message: "Invalid request data",
      issues: err.issues,
    });
  }

  console.error(err);
  res.status(500).json({
    ok: false,
    message: "Internal server error",
  });
};
