import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "./auth";
import { ApiError } from "../utils/ApiError";
import Task from "../models/Task";
import User from "../models/User";

export type SystemRole = "super_admin" | "system_admin" | "admin" | "manager" | "employee";

export type Permission =
  | "platform:manage"
  | "security:manage"
  | "system:health"
  | "audit:read"
  | "user:create"
  | "user:read"
  | "user:update"
  | "user:deactivate"
  | "task:create"
  | "task:read"
  | "task:update"
  | "task:assign"
  | "task:delete"
  | "team:manage"
  | "project:manage"
  | "report:read";

export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  super_admin: [
    "platform:manage",
    "security:manage",
    "system:health",
    "audit:read",
    "user:create",
    "user:read",
    "user:update",
    "user:deactivate",
    "task:create",
    "task:read",
    "task:update",
    "task:assign",
    "task:delete",
    "team:manage",
    "project:manage",
    "report:read",
  ],
  system_admin: [
    "platform:manage",
    "security:manage",
    "system:health",
    "audit:read",
    "user:create",
    "user:read",
    "user:update",
    "user:deactivate",
    "task:create",
    "task:read",
    "task:update",
    "task:assign",
    "task:delete",
    "team:manage",
    "project:manage",
    "report:read",
  ],
  admin: [
    "system:health",
    "audit:read",
    "user:create",
    "user:read",
    "user:update",
    "user:deactivate",
    "task:create",
    "task:read",
    "task:update",
    "task:assign",
    "task:delete",
    "team:manage",
    "project:manage",
    "report:read",
  ],
  manager: [
    "task:create",
    "task:read",
    "task:update",
    "task:assign",
    "user:read",
    "report:read",
    "project:manage",
  ],
  employee: [
    "task:read",
    "task:update",
    "user:read",
    "report:read",
  ],
};

/**
 * Derives canonical system role from raw user role and systemRole fields.
 * Guarantees backward-compatibility for existing accounts without title bleeding.
 */
export const resolveSystemRole = (rawRole?: string, systemRole?: string): SystemRole => {
  if (systemRole && ["super_admin", "system_admin", "admin", "manager", "employee"].includes(systemRole)) {
    return systemRole as SystemRole;
  }
  const clean = (rawRole || "").toLowerCase().trim();
  if (clean === "super_admin" || clean === "superadmin" || clean === "super administrator") return "super_admin";
  if (clean === "system_admin" || clean === "systemadmin" || clean === "system administrator") return "system_admin";
  if (clean === "admin" || clean === "administrator") return "admin";
  if (clean === "manager") return "manager";
  return "employee";
};

/**
 * Checks if a given role has a specific permission.
 */
export const hasPermission = (role: SystemRole, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Middleware: Enforces permission-based authorization.
 */
export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required."));
    }

    const systemRole = resolveSystemRole(req.user.role, req.user.systemRole);
    if (!hasPermission(systemRole, permission)) {
      return next(
        new ApiError(
          403,
          `Access Denied: You do not possess the required '${permission}' enterprise permission.`
        )
      );
    }
    next();
  };
};

/**
 * Middleware: Enforces role-based hierarchy check.
 */
export const requireAnyRole = (...allowedRoles: SystemRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required."));
    }

    const systemRole = resolveSystemRole(req.user.role, req.user.systemRole);
    if (!allowedRoles.includes(systemRole)) {
      return next(
        new ApiError(
          403,
          `Access Denied: Your role '${systemRole}' is not authorized to access this resource.`
        )
      );
    }
    next();
  };
};

/**
 * Resource-Level IDOR Guard for Tasks.
 * Verifies that the authenticated user has legitimate ownership or managerial scope
 * over the requested task before allowing mutations, comments, or sensitive reads.
 */
export const verifyTaskResourceAccess = (action: "read" | "update" | "delete" | "comment") => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.params.id;
      if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid task identifier provided.");
      }

      const task = await Task.findById(taskId);
      if (!task || task.isDeleted) {
        throw new ApiError(404, "Task not found or has been archived.");
      }

      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, "Authentication required.");
      }

      const systemRole = resolveSystemRole(req.user?.role, req.user?.systemRole);

      // Super Admin, System Admin, and Admin have organization-wide authority
      if (systemRole === "super_admin" || systemRole === "system_admin" || systemRole === "admin") {
        return next();
      }

      // Deletion: Admins, or Managers for tasks they created within their department
      if (action === "delete") {
        if (systemRole === "manager") {
          const isCreator = task.createdBy && task.createdBy.toString() === userId;
          if (isCreator) {
            return next();
          }
        }
        throw new ApiError(403, "Only workspace administrators or task creators are permitted to archive tasks.");
      }

      // Fetch user's department for managerial scope
      const currentUser = await User.findById(userId).select("department");
      const userDept = currentUser?.department || "";

      // Manager scope: tasks within their department, or tasks they created, or assigned to them
      if (systemRole === "manager") {
        const isDeptTask = task.department && task.department.toLowerCase() === userDept.toLowerCase();
        const isCreator = task.createdBy && task.createdBy.toString() === userId;
        const isAssignee = (task.assignedTo || []).some((a) => a.toString() === userId);

        if (isDeptTask || isCreator || isAssignee) {
          return next();
        }
        throw new ApiError(403, "Managerial scope violation: You can only access tasks within your department.");
      }

      // Employee scope: only tasks assigned to the employee
      const isAssignee = (task.assignedTo || []).some((a) => a.toString() === userId);
      if (!isAssignee) {
        throw new ApiError(403, "Access Denied: You are not assigned to this task.");
      }

      // If updating, employee cannot modify managerial/admin fields (assignees, dueDate, priority, title, department)
      if (action === "update") {
        const { title, priority, dueDate, department, assignedTo } = req.body;
        if (
          title !== undefined ||
          priority !== undefined ||
          dueDate !== undefined ||
          department !== undefined ||
          assignedTo !== undefined
        ) {
          throw new ApiError(
            403,
            "Employee scope constraint: You can only update task progress status, comments, or checklist items."
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
