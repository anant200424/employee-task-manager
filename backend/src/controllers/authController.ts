import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getCountryCallingCode } from "libphonenumber-js";
import User from "../models/User";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie, clearRefreshTokenCookie } from "../utils/generateToken";
import { sendEmail, passwordResetEmailTemplate } from "../utils/sendEmail";
import { AuthRequest } from "../middleware/auth";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// @route  POST /api/auth/register
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, email, countryCode, phoneNumber, department, role, employeeId, dateOfBirth, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists.", {
        email: "An account with this email already exists.",
      });
    }

    const dialCode = `+${getCountryCallingCode(countryCode)}`;

    const user = await User.create({
      firstName,
      lastName,
      email,
      countryCode,
      dialCode,
      phoneNumber,
      department: department || "Engineering",
      role: role || "Software Engineer",
      employeeId: employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      dateOfBirth,
      password,
    });

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    user.refreshTokens = [refreshToken];
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    sendSuccess(res, 201, "Account created successfully. Welcome to EmpSphere!", {
      user,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password +loginAttempts +lockUntil");
    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    if (user.isLocked) {
      const minutesLeft = Math.ceil(((user.lockUntil as Date).getTime() - Date.now()) / 60000);
      throw new ApiError(423, `Account temporarily locked due to multiple failed attempts. Try again in ${minutesLeft} minute(s).`);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      }
      await user.save({ validateBeforeSave: false });
      throw new ApiError(401, "Invalid email or password.");
    }

    // Successful login — reset brute force counters
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    const safeUser = await User.findById(user.id);
    sendSuccess(res, 200, "Logged in successfully.", { user: safeUser, accessToken });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/refresh
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new ApiError(401, "Session expired. Please log in again.");
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as {
      userId: string;
      role: string;
    };

    const user = await User.findById(decoded.userId).select("+refreshTokens");
    if (!user || !user.refreshTokens.includes(token)) {
      throw new ApiError(401, "Session expired. Please log in again.");
    }

    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    user.refreshTokens = [...user.refreshTokens.filter((t) => t !== token), newRefreshToken];
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, newRefreshToken);
    sendSuccess(res, 200, "Session refreshed.", { accessToken: newAccessToken });
  } catch (error) {
    clearRefreshTokenCookie(res);
    next(new ApiError(401, "Session expired. Please log in again."));
  }
};

// @route  POST /api/auth/logout
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const decoded = jwt.decode(token) as { userId: string } | null;
      if (decoded?.userId) {
        await User.findByIdAndUpdate(decoded.userId, { $pull: { refreshTokens: token } });
      }
    }
    clearRefreshTokenCookie(res);
    sendSuccess(res, 200, "Logged out successfully.");
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond the same way, whether or not the account exists,
    // to avoid leaking which emails are registered (user enumeration).
    const genericMessage = "If an account exists for this email, a password reset link has been sent.";

    if (!user) {
      sendSuccess(res, 200, genericMessage);
      return;
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Nexus password",
        html: passwordResetEmailTemplate(user.firstName, resetUrl),
      });
    } catch (mailErr) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new ApiError(500, "Could not send password reset email. Please try again later.");
    }

    sendSuccess(res, 200, genericMessage);
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/reset-password/:token
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      throw new ApiError(400, "This password reset link is invalid or has expired.");
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // invalidate all existing sessions
    await user.save();

    sendSuccess(res, 200, "Password reset successfully. Please log in with your new password.");
  } catch (error) {
    next(error);
  }
};

// @route  PATCH /api/auth/change-password (authenticated)
export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?.id).select("+password +refreshTokens");
    if (!user) throw new ApiError(404, "User not found.");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(401, "Current password is incorrect.", { currentPassword: "Current password is incorrect." });
    }

    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();

    clearRefreshTokenCookie(res);
    sendSuccess(res, 200, "Password changed successfully. Please log in again.");
  } catch (error) {
    next(error);
  }
};
