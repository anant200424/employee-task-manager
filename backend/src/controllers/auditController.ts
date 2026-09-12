import { Response, NextFunction } from "express";
import AuditLog from "../models/AuditLog";
import { AuthRequest } from "../middleware/auth";
import { resolveSystemRole } from "../middleware/rbac";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";

/**
 * Retrieves paginated audit logs with search and filtering.
 * @route GET /api/audit-logs
 */
export const getAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const systemRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    const isPrivileged =
      ["super_admin", "system_admin", "admin"].includes(systemRole) ||
      req.user?.role === "admin" ||
      req.user?.role === "Super Administrator" ||
      req.user?.role === "System Administrator" ||
      req.user?.systemRole === "super_admin";

    if (!isPrivileged) {
      throw new ApiError(403, "Access Denied: Only administrators can review audit trails.");
    }

    const {
      page = "1",
      limit = "25",
      action,
      resourceType,
      actorEmail,
      search,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    if (action && action !== "all" && typeof action === "string") {
      query.action = action;
    }

    if (resourceType && resourceType !== "all" && typeof resourceType === "string") {
      query.resourceType = resourceType;
    }

    if (actorEmail && typeof actorEmail === "string") {
      query.actorEmail = { $regex: actorEmail.trim(), $options: "i" };
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { action: searchRegex },
        { actorName: searchRegex },
        { actorEmail: searchRegex },
        { resourceId: searchRegex },
      ];
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        const start = new Date(String(startDate));
        if (!isNaN(start.getTime())) dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(String(endDate));
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          dateFilter.$lte = end;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        query.timestamp = dateFilter;
      }
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    sendSuccess(res, 200, "Audit logs retrieved successfully.", {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves audit event action types for UI filter dropdowns.
 * @route GET /api/audit-logs/actions
 */
export const getAuditActions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actions = await AuditLog.distinct("action");
    sendSuccess(res, 200, "Audit action types retrieved.", { actions });
  } catch (error) {
    next(error);
  }
};
