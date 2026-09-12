import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import User from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    systemRole?: string;
    email?: string;
    department?: string;
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
      : req.cookies?.accessToken;

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

    if (currentUser.isDeleted) {
      throw new ApiError(
        403,
        "This account has been deactivated or removed from the workspace."
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

    let derivedSystemRole = currentUser.systemRole;
    if (!derivedSystemRole) {
      const roleLower = String(currentUser.role || "").toLowerCase().trim();
      if (roleLower === "super_admin" || roleLower === "super administrator") {
        derivedSystemRole = "super_admin";
      } else if (roleLower === "system_admin" || roleLower === "system administrator") {
        derivedSystemRole = "system_admin";
      } else if (roleLower === "admin" || roleLower === "administrator") {
        derivedSystemRole = "admin";
      } else if (roleLower === "manager") {
        derivedSystemRole = "manager";
      } else {
        derivedSystemRole = "employee";
      }
    }

    req.user = {
      id: currentUser.id,
      role: currentUser.role || "Software Engineer",
      systemRole: derivedSystemRole,
      email: currentUser.email,
      department: currentUser.department || "Engineering",
    };
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
    if (!req.user) {
      return next(
        new ApiError(401, "Authentication required."),
      );
    }

    const userSystemRole = (req.user.systemRole || "employee").toLowerCase().trim();

    // Super Admin has universal administrative permission across all protected routes
    if (userSystemRole === "super_admin") {
      return next();
    }

    const normalizedRequired = roles.map((r) => r.toLowerCase().trim());
    const hasRole = normalizedRequired.includes(userSystemRole);
    if (!hasRole) {
      return next(
        new ApiError(403, "You do not have permission to perform this action."),
      );
    }
    next();
  };
