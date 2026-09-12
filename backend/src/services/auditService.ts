import { Request } from "express";
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog";
import { AuthRequest } from "../middleware/auth";

export interface LogAuditParams {
  req?: Request | AuthRequest;
  action: string;
  resourceType: "user" | "task" | "auth" | "system" | "security" | "department" | "team";
  resourceId?: string;
  details?: Record<string, unknown> | string;
  actor?: {
    id?: string | mongoose.Types.ObjectId;
    name?: string;
    email?: string;
    role?: string;
  };
}

/**
 * Enterprise Audit Logger.
 * Records security and business-critical operations asynchronously.
 * Never throws an uncaught exception to disrupt the caller's response flow.
 */
export const recordAuditLog = async (params: LogAuditParams): Promise<void> => {
  try {
    const { req, action, resourceType, resourceId, details, actor } = params;

    let actorId: mongoose.Types.ObjectId | undefined;
    let actorName = "System";
    let actorEmail = "";
    let actorRole = "system";

    const authReq = req as AuthRequest | undefined;
    if (authReq?.user) {
      if (mongoose.Types.ObjectId.isValid(authReq.user.id)) {
        actorId = new mongoose.Types.ObjectId(authReq.user.id);
      }
      actorRole = authReq.user.systemRole || authReq.user.role || "employee";
      if (authReq.user.email) {
        actorEmail = authReq.user.email;
        actorName = authReq.user.email.split("@")[0];
      }
      const anyUser = authReq.user as any;
      if (anyUser.name) {
        actorName = anyUser.name;
      } else if (anyUser.firstName) {
        actorName = `${anyUser.firstName} ${anyUser.lastName || ""}`.trim();
      }
    }

    if (actor) {
      if (actor.id && mongoose.Types.ObjectId.isValid(actor.id.toString())) {
        actorId = new mongoose.Types.ObjectId(actor.id.toString());
      }
      if (actor.name) actorName = actor.name;
      if (actor.email) actorEmail = actor.email;
      if (actor.role) actorRole = actor.role;
    }

    // Extract IP safely
    let ipAddress = "";
    if (req) {
      const forwarded = req.headers["x-forwarded-for"];
      if (typeof forwarded === "string") {
        ipAddress = forwarded.split(",")[0].trim();
      } else if (Array.isArray(forwarded)) {
        ipAddress = forwarded[0];
      } else {
        ipAddress = req.socket?.remoteAddress || "";
      }
    }

    const userAgent = req?.headers["user-agent"] || "";

    // Sanitize details to guarantee zero leakage of passwords, tokens, or OTP hashes
    let sanitizedDetails: Record<string, unknown> | string | undefined = details;
    if (details && typeof details === "object") {
      const clean = { ...(details as Record<string, unknown>) };
      delete clean.password;
      delete clean.passwordHash;
      delete clean.confirmPassword;
      delete clean.token;
      delete clean.refreshToken;
      delete clean.otp;
      delete clean.emailOtp;
      delete clean.phoneOtp;
      delete clean.emailOtpHash;
      delete clean.phoneOtpHash;
      sanitizedDetails = clean;
    }

    await AuditLog.create({
      actorId,
      actorName,
      actorEmail,
      actorRole,
      action,
      resourceType,
      resourceId,
      details: sanitizedDetails,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    // Non-blocking logging failure fallback
    console.error("[AuditService] Failed to record audit log:", (error as Error).message);
  }
};
