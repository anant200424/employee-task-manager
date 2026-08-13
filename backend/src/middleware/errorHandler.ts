import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = err instanceof ApiError ? err.statusCode : 500;
  let message = err.message || "Internal server error";
  let errors: Record<string, string> | undefined = err instanceof ApiError ? err.errors : undefined;

  // Mongoose duplicate key error (e.g. duplicate email)
  if ((err as unknown as { code?: number }).code === 11000) {
    statusCode = 409;
    const keyValue = (err as unknown as { keyValue?: Record<string, string> }).keyValue || {};
    const field = Object.keys(keyValue)[0] || "field";
    message = `An account with this ${field} already exists.`;
    errors = { [field]: message };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = "Validation failed";
    const validationErr = err as unknown as { errors: Record<string, { message: string }> };
    errors = Object.fromEntries(
      Object.entries(validationErr.errors).map(([key, val]) => [key, val.message])
    );
  }

  // Mongoose bad ObjectId cast
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid identifier supplied.";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};
