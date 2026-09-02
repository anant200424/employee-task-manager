import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import User from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

    if (!token) {
      throw new ApiError(
        401,
        "You are not logged in. Please log in to continue.",
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as {
      userId: string;
      role: string;
      iat: number;
    };

    const currentUser = await User.findById(decoded.userId).select(
      "+passwordChangedAt",
    );
    if (!currentUser) {
      throw new ApiError(
        401,
        "The account belonging to this session no longer exists.",
      );
    }

    if (currentUser.passwordChangedAt) {
      const changedTimestamp = Math.floor(
        currentUser.passwordChangedAt.getTime() / 1000,
      );
      if (decoded.iat < changedTimestamp) {
        throw new ApiError(
          401,
          "Password was recently changed. Please log in again.",
        );
      }
    }

    if (currentUser.isBlocked) {
      throw new ApiError(
        403,
        "Your account has been deactivated/blocked by the administrator. Access is disabled."
      );
    }

    req.user = { id: currentUser.id, role: currentUser.role || "employee" };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, "Session expired. Please log in again."));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, "Invalid session. Please log in again."));
    }
    next(error);
  }
};

export const authenticate = protect;

export const restrictTo =
  (...roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to perform this action."),
      );
    }
    next();
  };
