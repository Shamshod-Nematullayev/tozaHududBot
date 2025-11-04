import { AxiosError } from "axios";
import AppError from "errors/AppError.js";
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

  if (err instanceof AxiosError) {
    return res.status(400).json({
      ok: false,
      message: err.response?.data?.message || "Axios error",
      issues: err.response?.data,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      message: err.message,
      issues: err.details,
    });
  }

  console.error("🔥 Unhandled Error:", err);
  res.status(500).json({
    ok: false,
    message: "Internal server error",
  });
};
