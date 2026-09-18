import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getCountryCallingCode } from "libphonenumber-js";

import User from "../models/User";
import PendingRegistration from "../models/PendingRegistration";

import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";

import {
  generateAccessToken,
  generateRefreshToken,
  setAccessTokenCookie,
  clearAccessTokenCookie,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/generateToken";
import { uploadImageToCloudinary } from "../config/cloudinary";
import { decryptPassword } from "../utils/crypto";

import {
  sendEmail,
  passwordResetOtpEmailTemplate,
  otpVerificationEmailTemplate,
} from "../services/email.service";

import { sendSms, verifySmsOtp } from "../services/sms.service";
import { generateOTP, hashOTP, verifyOTP } from "../services/otp.service";
import { AuthRequest } from "../middleware/auth";
import { recordAuditLog } from "../services/auditService";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// ============================================================
// REGISTER
// POST /api/auth/register
// ============================================================

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      countryCode,
      phoneNumber,
      department,
      role,
      employeeId,
      dateOfBirth,
      password,
      avatarUrl,
      coverUrl,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(
        409,
        "An account with this email already exists.",
        { email: "An account with this email already exists." },
      );
    }

    const dialCode = `+${getCountryCallingCode(countryCode)}`;

    // Prevent privilege escalation via role field
    let cleanRole = role ? String(role).trim() : "Software Engineer";
    if (/admin|super|system_admin|manager/i.test(cleanRole)) {
      cleanRole = "Software Engineer";
    }

    let cleanAvatarUrl = "";
    if (avatarUrl && typeof avatarUrl === "string") {
      cleanAvatarUrl = avatarUrl.startsWith("data:image/")
        ? (await uploadImageToCloudinary(avatarUrl, "empsphere/avatars", "reg-avatar")).url
        : avatarUrl.trim();
    }

    let cleanCoverUrl = "";
    if (coverUrl && typeof coverUrl === "string") {
      cleanCoverUrl = coverUrl.startsWith("data:image/")
        ? (await uploadImageToCloudinary(coverUrl, "empsphere/covers", "reg-cover")).url
        : coverUrl.trim();
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      countryCode,
      dialCode,
      phoneNumber,
      department: department || "Engineering",
      role: cleanRole,
      systemRole: "employee",
      employeeId: employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      dateOfBirth,
      password,
      avatarUrl: cleanAvatarUrl,
      coverUrl: cleanCoverUrl,
    });

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    user.refreshTokens = [refreshToken];
    await user.save({ validateBeforeSave: false });

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    sendSuccess(res, 201, "Account created successfully. Welcome to EmpSphere!", { user });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// LOGIN
// POST /api/auth/login
// ============================================================

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password: rawPassword, rememberMe } = req.body;
    const shouldRemember = rememberMe === true; // true = 30d session, false = 7d

    // Input validation (before any DB query)
    if (!email || typeof email !== "string" || !email.trim()) {
      throw new ApiError(400, "Email address is required.");
    }
    if (!rawPassword || typeof rawPassword !== "string") {
      throw new ApiError(400, "Password is required.");
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new ApiError(400, "Please provide a valid email address.");
    }

    const cleanPassword = decryptPassword(rawPassword);
    if (!cleanPassword || cleanPassword.trim().length === 0) {
      throw new ApiError(400, "Invalid password format or decryption failed.");
    }

    // Database query (only after input is clean)
    const user = await User.findOne({
      email: cleanEmail,
      isDeleted: { $ne: true },
    }).select("+password +loginAttempts +lockUntil +refreshTokens");

    // Account status checks (before bcrypt — saves CPU on blocked/locked accounts)
    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    if (user.isBlocked) {
      throw new ApiError(
        403,
        "Your account has been deactivated/blocked by the administrator. Please contact HR or IT support.",
      );
    }

    if (user.isLocked) {
      const minutesLeft = Math.ceil(
        ((user.lockUntil as Date).getTime() - Date.now()) / 60000,
      );
      throw new ApiError(
        423,
        `Account temporarily locked due to multiple failed attempts. Try again in ${minutesLeft} minute(s).`,
      );
    }

    // Password verification & brute-force protection
    const isMatch = await user.comparePassword(cleanPassword);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      }
      await user.save({ validateBeforeSave: false });

      await recordAuditLog({
        req,
        action: "LOGIN_FAILED",
        resourceType: "auth",
        actor: { email: cleanEmail },
        details: { reason: "Invalid password", attempts: user.loginAttempts, maxAttempts: MAX_LOGIN_ATTEMPTS },
      });

      throw new ApiError(401, "Invalid email or password.");
    }

    // Successful login — reset counters, generate session tokens
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role }, shouldRemember);

    // Keep max 5 concurrent device sessions
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await user.save({ validateBeforeSave: false });

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken, shouldRemember);

    await recordAuditLog({
      req,
      action: "LOGIN_SUCCESS",
      resourceType: "auth",
      actor: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
      },
    });

    sendSuccess(res, 200, "Logged in successfully.", {
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// REFRESH TOKEN
// POST /api/auth/refresh
// ============================================================

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new ApiError(
        401,
        "Session expired. Please log in again.",
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET as string,
    ) as {
      userId: string;
      role: string;
    };

    const user = await User.findById(decoded.userId).select(
      "+refreshTokens",
    );

    if (!user || !user.refreshTokens || !user.refreshTokens.includes(token)) {
      clearRefreshTokenCookie(res);
      throw new ApiError(
        401,
        "Session expired. Please log in again.",
      );
    }

    if (user.isBlocked) {
      clearRefreshTokenCookie(res);
      throw new ApiError(
        403,
        "Your account has been deactivated/blocked by the administrator.",
      );
    }

    const newAccessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    user.refreshTokens = [
      ...user.refreshTokens.filter((t) => t !== token),
      newRefreshToken,
    ].slice(-5);

    await user.save({
      validateBeforeSave: false,
    });

    setAccessTokenCookie(res, newAccessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    sendSuccess(res, 200, "Session refreshed.", {
      user,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    next(
      new ApiError(
        401,
        "Session expired. Please log in again.",
      ),
    );
  }
};


// ============================================================
// LOGOUT
// POST /api/auth/logout
// ============================================================

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    let userId: string | null = null;

    if (token) {
      const decoded = jwt.decode(token) as {
        userId: string;
      } | null;
      if (decoded?.userId) {
        userId = decoded.userId;
      }
    }

    // Fallback: check access token in Authorization header
    if (!userId && req.headers.authorization?.startsWith("Bearer ")) {
      try {
        const accessToken = req.headers.authorization.split(" ")[1];
        const decodedAccess = jwt.decode(accessToken) as {
          userId: string;
        } | null;
        if (decodedAccess?.userId) {
          userId = decodedAccess.userId;
        }
      } catch {
        // ignore decode errors
      }
    }

    if (userId) {
      if (token) {
        await User.findByIdAndUpdate(userId, {
          $pull: {
            refreshTokens: token,
          },
        });
      } else {
        // Invalidate all refresh tokens for this session user
        await User.findByIdAndUpdate(userId, {
          $set: {
            refreshTokens: [],
          },
        });
      }

      await recordAuditLog({
        req,
        action: "LOGOUT",
        resourceType: "auth",
        actor: { id: userId },
      });
    }

    clearAccessTokenCookie(res);
    clearRefreshTokenCookie(res);

    sendSuccess(res, 200, "Logged out successfully.");
  } catch (error) {
    next(error);
  }
};


// ============================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ============================================================

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || "").toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    // Anti-enumeration: Return generic message if user doesn't exist
    const genericMessage =
      "If an account exists for this email, a 6-digit verification code has been sent.";

    if (!user) {
      sendSuccess(res, 200, genericMessage);
      return;
    }

    // Generate secure 6-digit OTP and store SHA-256 hash
    const otp = generateOTP();
    const hashedOtp = hashOTP(otp);

    user.passwordResetToken = hashedOtp;
    // OTP valid for 10 minutes
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save({
      validateBeforeSave: false,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: "EmpSphere - Password Reset Verification Code",
        html: passwordResetOtpEmailTemplate(
          user.firstName,
          otp,
        ),
      });
    } catch {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({
        validateBeforeSave: false,
      });

      throw new ApiError(
        500,
        "Could not send password reset verification code. Please try again later.",
      );
    }

    sendSuccess(res, 200, genericMessage);
  } catch (error) {
    next(error);
  }
};


// ============================================================
// VERIFY RESET OTP
// POST /api/auth/verify-reset-otp
// ============================================================

export const verifyResetOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = (email || "").toLowerCase().trim();
    const hashedOtp = hashOTP((otp || "").trim());

    const user = await User.findOne({
      email: normalizedEmail,
      passwordResetToken: hashedOtp,
      passwordResetExpires: {
        $gt: new Date(),
      },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      // Check if code has expired
      const userExists = await User.findOne({ email: normalizedEmail }).select("+passwordResetExpires");
      if (userExists && userExists.passwordResetExpires && userExists.passwordResetExpires <= new Date()) {
        throw new ApiError(400, "Verification code has expired. Please request a new code.");
      }
      throw new ApiError(400, "Invalid verification code. Please check and try again.");
    }

    sendSuccess(res, 200, "Verification code confirmed successfully.");
  } catch (error) {
    next(error);
  }
};


// ============================================================
// RESET PASSWORD
// POST /api/auth/reset-password (or /:token for legacy link)
// ============================================================

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token } = req.params;
    const { email, otp, password } = req.body;

    let user;

    if (email && otp) {
      const normalizedEmail = email.toLowerCase().trim();
      const hashedOtp = hashOTP((otp || "").trim());

      user = await User.findOne({
        email: normalizedEmail,
        passwordResetToken: hashedOtp,
        passwordResetExpires: {
          $gt: new Date(),
        },
      }).select("+passwordResetToken +passwordResetExpires");

      if (!user) {
        throw new ApiError(
          400,
          "Invalid or expired verification code. Please request a new code.",
        );
      }
    } else if (token) {
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          $gt: new Date(),
        },
      }).select("+passwordResetToken +passwordResetExpires");

      if (!user) {
        throw new ApiError(
          400,
          "This password reset link is invalid or has expired.",
        );
      }
    } else {
      throw new ApiError(400, "Missing reset verification credentials.");
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Invalidate all existing sessions
    user.refreshTokens = [];

    await user.save();

    sendSuccess(
      res,
      200,
      "Password reset successfully. Please log in with your new password.",
    );
  } catch (error) {
    next(error);
  }
};


// ============================================================
// CHANGE PASSWORD
// PATCH /api/auth/change-password
// Authenticated
// ============================================================

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.id).select(
      "+password +refreshTokens",
    );

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      throw new ApiError(
        400,
        "The current password you entered is incorrect.",
        {
          currentPassword: "The current password you entered is incorrect.",
        },
      );
    }

    if (currentPassword === newPassword) {
      throw new ApiError(
        400,
        "New password must be different from current password.",
        {
          newPassword: "New password must be different from current password.",
        },
      );
    }

    user.password = newPassword;
    user.refreshTokens = [];

    await user.save();

    clearRefreshTokenCookie(res);

    sendSuccess(
      res,
      200,
      "Password changed successfully. Please log in again.",
    );
  } catch (error) {
    next(error);
  }
};

// ============================================================
// TERMINATE OTHER SESSIONS
// POST /api/auth/terminate-other-sessions
// Authenticated
// ============================================================

export const terminateOtherSessions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select("+refreshTokens");
    if (!user) throw new ApiError(404, "User not found.");

    // Generate fresh session tokens for the current active device
    const newAccessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    // Invalidate old access tokens on other devices by setting passwordChangedAt
    user.passwordChangedAt = new Date();
    user.refreshTokens = [newRefreshToken];
    await user.save({ validateBeforeSave: false });

    setAccessTokenCookie(res, newAccessToken);
    setRefreshTokenCookie(res, newRefreshToken);

    sendSuccess(res, 200, "All other device sessions have been terminated.");
  } catch (error) {
    next(error);
  }
};


// ============================================================
// START REGISTRATION
// POST /api/auth/register/start
// ============================================================

export const startRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      countryCode,
      phoneNumber,
      department,
      role,
      employeeId,
      dateOfBirth,
      password,
      avatarUrl,
      coverUrl,
      allowSaveDraft,
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ApiError(
        409,
        "An account with this email already exists.",
        {
          email: "An account with this email already exists.",
        },
      );
    }

    const dialCode = `+${getCountryCallingCode(countryCode)}`;

    const emailOtp = generateOTP();
    const emailOtpHash = hashOTP(emailOtp);

    const phoneOtp = generateOTP();
    const phoneOtpHash = hashOTP(phoneOtp);

    const now = Date.now();
    const emailOtpExpires = new Date(now + 5 * 60 * 1000); // 5 mins
    const phoneOtpExpires = new Date(now + 5 * 60 * 1000); // 5 mins

    const bcrypt = require("bcryptjs");

    const passwordHash = await bcrypt.hash(
      password,
      12,
    );

    await PendingRegistration.findOneAndDelete({
      email,
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");

    let cleanRole = role ? String(role).trim() : "Software Engineer";
    if (/admin|super|system_admin|manager/i.test(cleanRole)) {
      cleanRole = "Software Engineer";
    }

    let cleanAvatarUrl = "";
    if (avatarUrl && typeof avatarUrl === "string") {
      if (avatarUrl.startsWith("data:image/")) {
        const cloudRes = await uploadImageToCloudinary(avatarUrl, "empsphere/avatars", "draft-avatar");
        cleanAvatarUrl = cloudRes.url;
      } else {
        cleanAvatarUrl = avatarUrl.trim();
      }
    }

    let cleanCoverUrl = "";
    if (coverUrl && typeof coverUrl === "string") {
      if (coverUrl.startsWith("data:image/")) {
        const cloudRes = await uploadImageToCloudinary(coverUrl, "empsphere/covers", "draft-cover");
        cleanCoverUrl = cloudRes.url;
      } else {
        cleanCoverUrl = coverUrl.trim();
      }
    }

    await PendingRegistration.create({
      firstName,
      lastName,
      email,
      countryCode,
      dialCode,
      phoneNumber,
      department: department || "Engineering",
      role: cleanRole,
      employeeId:
        employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      dateOfBirth,
      passwordHash,
      avatarUrl: cleanAvatarUrl,
      coverUrl: cleanCoverUrl,
      verificationToken,
      emailOtpHash,
      phoneOtpHash,
      emailOtpExpires,
      phoneOtpExpires,
      emailOtpAttempts: 0,
      phoneOtpAttempts: 0,
      isDraftAllowed: Boolean(allowSaveDraft),
    });

    const fullPhone = dialCode + phoneNumber;

    const [_, smsResult] = await Promise.all([
      sendEmail({
        to: email,
        subject: "EmpSphere - Verify your email",
        html: otpVerificationEmailTemplate(emailOtp),
      }),

      sendSms(fullPhone),
    ]);

    // If SMS could not be delivered to carrier (e.g. Twilio Trial restriction), dispatch Phone OTP to email backup
    if (!smsResult.success) {
      await sendEmail({
        to: email,
        subject: "EmpSphere - Your Phone Verification Code (SMS Backup)",
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #4355cc; margin-bottom: 8px;">EmpSphere Mobile Verification</h2>
          <p style="color: #475569; font-size: 14px;">You are registering with mobile number <strong>${fullPhone}</strong>.</p>
          <p style="color: #475569; font-size: 14px;">Your 6-digit Phone Verification OTP is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; padding: 16px; background: #f8fafc; border: 2px dashed #cbd5e1; text-align: center; border-radius: 8px; margin: 16px 0;">
            ${phoneOtp}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 16px;">
            Delivered to your email as an automatic carrier backup for unverified trial phones. Valid for 5 minutes.
          </p>
        </div>`,
      });
    }

    sendSuccess(
      res,
      200,
      "Verification codes sent to your email and phone.",
    );
  } catch (error) {
    next(error);
  }
};


// ============================================================
// GET REGISTRATION DRAFT
// GET /api/auth/draft/:email
// ============================================================

export const getDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.params;

    const pending = await PendingRegistration.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!pending) {
      sendSuccess(res, 200, "No draft found", {
        draft: null,
      });

      return;
    }

    const safeData = {
      firstName: pending.firstName,
      lastName: pending.lastName,
      email: pending.email,
      countryCode: pending.countryCode,
      phoneNumber: pending.phoneNumber,
      department: pending.department,
      role: pending.role,
      employeeId: pending.employeeId,
      dateOfBirth: pending.dateOfBirth ? new Date(pending.dateOfBirth).toISOString().split("T")[0] : "",
    };

    sendSuccess(res, 200, "Draft found", {
      draft: safeData,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// VERIFY OTP
// POST /api/auth/verify-otp
// ============================================================

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      email,
      emailOtp,
      phoneOtp,
    } = req.body;

    const pending = await PendingRegistration.findOne({
      email,
    });

    if (!pending) {
      throw new ApiError(
        400,
        "Registration session expired or not found. Please register again.",
      );
    }

    if (
      pending.emailOtpAttempts >= 5 ||
      pending.phoneOtpAttempts >= 5
    ) {
      await PendingRegistration.deleteOne({
        email,
      });

      throw new ApiError(
        400,
        "Too many failed attempts. Please register again.",
      );
    }

    let isEmailValid = false;
    let isPhoneValid = false;


    // Check Email OTP

    if (pending.emailOtpExpires.getTime() < Date.now()) {
      throw new ApiError(
        400,
        "Email OTP has expired. Please request a new one.",
        {
          emailOtp: "Expired OTP",
        },
      );
    }

    if (
      process.env.NODE_ENV === "development" &&
      emailOtp === "123456"
    ) {
      // Master OTP for development to bypass SMTP errors
    } else if (!verifyOTP(emailOtp, pending.emailOtpHash)) {
      pending.emailOtpAttempts += 1;

      await pending.save();

      throw new ApiError(400, "Invalid Email OTP.", {
        emailOtp: "Invalid OTP",
      });
    }

    isEmailValid = true;


    // Check Phone OTP via Twilio Verify or local hash fallback
    const fullPhoneNumber =
      pending.dialCode + pending.phoneNumber;

    let isPhoneVerified = false;
    try {
      isPhoneVerified = await verifySmsOtp(
        fullPhoneNumber,
        phoneOtp,
      );
    } catch {
      isPhoneVerified = false;
    }

    if (!isPhoneVerified && pending.phoneOtpHash) {
      if (verifyOTP(phoneOtp, pending.phoneOtpHash)) {
        isPhoneVerified = true;
      }
    }

    if (!isPhoneVerified) {
      pending.phoneOtpAttempts += 1;

      await pending.save();

      throw new ApiError(400, "Invalid Phone OTP.", {
        phoneOtp: "Invalid OTP",
      });
    }

    isPhoneValid = true;


    // Both OTPs are valid — create the real user

    if (isEmailValid && isPhoneValid) {
      let cleanRole = pending.role || "Software Engineer";
      if (/admin|super|system_admin|manager/i.test(cleanRole)) {
        cleanRole = "Software Engineer";
      }

      const userObj = {
        firstName: pending.firstName,
        lastName: pending.lastName,
        email: pending.email,
        countryCode: pending.countryCode,
        dialCode: pending.dialCode,
        phoneNumber: pending.phoneNumber,
        department: pending.department,
        role: cleanRole,
        systemRole: "employee",
        isDeleted: false,
        employeeId: pending.employeeId,
        dateOfBirth: pending.dateOfBirth,
        avatarUrl: pending.avatarUrl,
        coverUrl: pending.coverUrl,
        password: pending.passwordHash,
        isEmailVerified: true,
        loginAttempts: 0,
        refreshTokens: [] as string[],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await User.collection.insertOne(userObj);

      const savedUser = await User.findOne({
        email,
      });

      if (!savedUser) {
        throw new ApiError(
          500,
          "Failed to create user.",
        );
      }

      await recordAuditLog({
        req,
        action: "USER_REGISTERED",
        resourceType: "auth",
        actor: {
          id: savedUser.id,
          name: `${savedUser.firstName} ${savedUser.lastName}`,
          email: savedUser.email,
          role: savedUser.role,
        },
      });

      const accessToken = generateAccessToken({
        userId: savedUser.id,
        role: savedUser.role,
      });

      const refreshToken = generateRefreshToken({
        userId: savedUser.id,
        role: savedUser.role,
      });

      savedUser.refreshTokens = [refreshToken];

      await savedUser.save({
        validateBeforeSave: false,
      });

      setAccessTokenCookie(
        res,
        accessToken,
      );
      setRefreshTokenCookie(
        res,
        refreshToken,
      );

      await PendingRegistration.deleteOne({
        email,
      });

      sendSuccess(
        res,
        201,
        "Account verified and created successfully!",
        {
          user: savedUser,
        },
      );
    }
  } catch (error) {
    next(error);
  }
};


// ============================================================
// RESEND EMAIL OTP
// POST /api/auth/resend-email-otp
// ============================================================

export const resendEmailOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;

    const pending = await PendingRegistration.findOne({
      email,
    });

    if (!pending) {
      throw new ApiError(
        400,
        "Registration session expired. Please register again.",
      );
    }

    const emailOtp = generateOTP();

    pending.emailOtpHash = hashOTP(emailOtp);
    pending.emailOtpExpires = new Date(
      Date.now() + 5 * 60 * 1000,
    );
    pending.emailOtpAttempts = 0;

    await pending.save();

    await sendEmail({
      to: email,
      subject: "EmpSphere - Verify your email",
      html: otpVerificationEmailTemplate(emailOtp),
    });

    sendSuccess(
      res,
      200,
      "A new Email OTP has been sent.",
    );
  } catch (error) {
    next(error);
  }
};


// ============================================================
// RESEND PHONE OTP
// POST /api/auth/resend-phone-otp
// ============================================================

export const resendPhoneOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;

    const pending = await PendingRegistration.findOne({
      email,
    });

    if (!pending) {
      throw new ApiError(
        400,
        "Registration session expired. Please register again.",
      );
    }

    const phoneOtp = generateOTP();
    pending.phoneOtpHash = hashOTP(phoneOtp);
    pending.phoneOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
    pending.phoneOtpAttempts = 0;

    await pending.save();

    const fullPhone = pending.dialCode + pending.phoneNumber;
    const smsResult = await sendSms(fullPhone);

    if (!smsResult.success) {
      await sendEmail({
        to: email,
        subject: "EmpSphere - Your Phone Verification Code (SMS Backup)",
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #4355cc; margin-bottom: 8px;">EmpSphere Mobile Verification</h2>
          <p style="color: #475569; font-size: 14px;">Your 6-digit Phone Verification OTP for <strong>${fullPhone}</strong> is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; padding: 16px; background: #f8fafc; border: 2px dashed #cbd5e1; text-align: center; border-radius: 8px; margin: 16px 0;">
            ${phoneOtp}
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 16px;">
            Delivered to your email as an automatic carrier backup. Valid for 5 minutes.
          </p>
        </div>`,
      });
    }

    sendSuccess(
      res,
      200,
      "A new Phone OTP has been sent.",
    );
  } catch (error) {
    next(error);
  }
};