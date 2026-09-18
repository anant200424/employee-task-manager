/**
 * Enterprise Role-Based Access Control (RBAC) Utilities
 * 
 * Provides centralized, server-authoritative role evaluation logic.
 * Enforces pure RBAC without hardcoded email overrides or personal backdoors.
 */

import { User } from "@/types/auth";

export type SystemRole = "super_admin" | "system_admin" | "admin" | "manager" | "employee";

/**
 * Resolves canonical system role from User object.
 * Checks typed `systemRole` first, falling back to legacy `role` title strings.
 */
export const resolveSystemRole = (
  user?: Partial<User> | null | { role?: string; systemRole?: string }
): SystemRole => {
  if (!user) return "employee";

  const sysRole = String(user.systemRole || "").toLowerCase().trim();
  if (sysRole === "super_admin") return "super_admin";
  if (sysRole === "system_admin") return "system_admin";
  if (sysRole === "admin") return "admin";
  if (sysRole === "manager") return "manager";
  if (sysRole === "employee") return "employee";

  // Fallback to title string if systemRole is not set
  const rawRole = String(user.role || "").toLowerCase().trim();
  if (rawRole === "super_admin" || rawRole === "superadmin" || rawRole.includes("super administrator") || rawRole.includes("super admin") || rawRole.includes("master")) {
    return "super_admin";
  }
  if (rawRole === "system_admin" || rawRole === "systemadmin" || rawRole.includes("system administrator") || rawRole.includes("system admin")) {
    return "system_admin";
  }
  if (rawRole === "admin" || rawRole.includes("administrator")) {
    return "admin";
  }
  if (rawRole === "manager" || rawRole.includes("manager") || rawRole.includes("team lead") || rawRole.includes("lead")) {
    return "manager";
  }

  return "employee";
};

/**
 * Returns true if the user possesses Root Super Administrator authority.
 */
export const isSuperAdminUser = (user?: Partial<User> | null | { role?: string; systemRole?: string }): boolean => {
  return resolveSystemRole(user) === "super_admin";
};

/**
 * Returns true if the user possesses System Administrator or higher authority.
 */
export const isSystemAdminUser = (user?: Partial<User> | null | { role?: string; systemRole?: string }): boolean => {
  const role = resolveSystemRole(user);
  return role === "super_admin" || role === "system_admin";
};

/**
 * Returns true if the user possesses Administrator or higher authority.
 */
export const isAdminUser = (user?: Partial<User> | null | { role?: string; systemRole?: string }): boolean => {
  const role = resolveSystemRole(user);
  return role === "super_admin" || role === "system_admin" || role === "admin";
};

/**
 * Returns true if the user possesses Manager authority.
 */
export const isManagerUser = (user?: Partial<User> | null | { role?: string; systemRole?: string }): boolean => {
  return resolveSystemRole(user) === "manager";
};

/**
 * Returns true if the user is a standard employee without elevated administrative roles.
 */
export const isEmployeeUser = (user?: Partial<User> | null | { role?: string; systemRole?: string }): boolean => {
  return resolveSystemRole(user) === "employee";
};

/**
 * Formats a canonical system role into a human-readable enterprise title.
 */
export const formatRoleName = (role?: string): string => {
  switch (role) {
    case "super_admin":
      return "Super Administrator";
    case "system_admin":
      return "System Administrator";
    case "admin":
      return "Administrator";
    case "manager":
      return "Manager";
    case "employee":
      return "Employee";
    default:
      return role || "Employee";
  }
};
