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
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../utils/generateToken";

import {
  sendEmail,
  passwordResetEmailTemplate,
  otpVerificationEmailTemplate,
} from "../services/email.service";

import { sendSms, verifySmsOtp } from "../services/sms.service";
import { generateOTP, hashOTP, verifyOTP } from "../services/otp.service";
import { AuthRequest } from "../middleware/auth";

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
        {
          email: "An account with this email already exists.",
        },
      );
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
      employeeId:
        employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      dateOfBirth,
      password,
      avatarUrl: avatarUrl || "",
      coverUrl: coverUrl || "",
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    user.refreshTokens = [refreshToken];

    await user.save({
      validateBeforeSave: false,
    });

    setRefreshTokenCookie(res, refreshToken);

    sendSuccess(
      res,
      201,
      "Account created successfully. Welcome to EmpSphere!",
      {
        user,
        accessToken,
      },
    );
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
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password +loginAttempts +lockUntil",
    );

    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
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

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      }

      await user.save({
        validateBeforeSave: false,
      });

      throw new ApiError(401, "Invalid email or password.");
    }

    // Successful login — reset brute force counters
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    user.refreshTokens = [
      ...(user.refreshTokens || []).slice(-4),
      refreshToken,
    ];

    await user.save({
      validateBeforeSave: false,
    });

    setRefreshTokenCookie(res, refreshToken);

    const safeUser = await User.findById(user.id);

    sendSuccess(res, 200, "Logged in successfully.", {
      user: safeUser,
      accessToken,
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

    if (!user || !user.refreshTokens.includes(token)) {
      throw new ApiError(
        401,
        "Session expired. Please log in again.",
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
    ];

    await user.save({
      validateBeforeSave: false,
    });

    setRefreshTokenCookie(res, newRefreshToken);

    sendSuccess(res, 200, "Session refreshed.", {
      accessToken: newAccessToken,
    });
  } catch {
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

    if (token) {
      const decoded = jwt.decode(token) as {
        userId: string;
      } | null;

      if (decoded?.userId) {
        await User.findByIdAndUpdate(decoded.userId, {
          $pull: {
            refreshTokens: token,
          },
        });
      }
    }

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

    const user = await User.findOne({ email });

    // Always respond the same way, whether or not the account exists,
    // to avoid leaking which emails are registered (user enumeration).
    const genericMessage =
      "If an account exists for this email, a password reset link has been sent.";

    if (!user) {
      sendSuccess(res, 200, genericMessage);
      return;
    }

    const resetToken = user.createPasswordResetToken();

    await user.save({
      validateBeforeSave: false,
    });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Nexus password",
        html: passwordResetEmailTemplate(
          user.firstName,
          resetUrl,
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
        "Could not send password reset email. Please try again later.",
      );
    }

    sendSuccess(res, 200, genericMessage);
  } catch (error) {
    next(error);
  }
};


// ============================================================
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// ============================================================

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
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
        401,
        "Current password is incorrect.",
        {
          currentPassword: "Current password is incorrect.",
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

    const now = Date.now();
    const emailOtpExpires = new Date(
      now + 5 * 60 * 1000,
    ); // 5 mins

    const bcrypt = require("bcryptjs");

    const passwordHash = await bcrypt.hash(
      password,
      12,
    );

    await PendingRegistration.findOneAndDelete({
      email,
    });

    await PendingRegistration.create({
      firstName,
      lastName,
      email,
      countryCode,
      dialCode,
      phoneNumber,
      department: department || "Engineering",
      role: role || "Software Engineer",
      employeeId:
        employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      dateOfBirth,
      passwordHash,
      avatarUrl: avatarUrl || "",
      coverUrl: coverUrl || "",
      emailOtpHash,
      emailOtpExpires,
      emailOtpAttempts: 0,
      phoneOtpAttempts: 0,
      isDraftAllowed: Boolean(allowSaveDraft),
    });

    await Promise.all([
      sendEmail({
        to: email,
        subject: "EmpSphere - Verify your email",
        html: otpVerificationEmailTemplate(emailOtp),
      }),

      sendSms(dialCode + phoneNumber),
    ]);

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

    if (!verifyOTP(emailOtp, pending.emailOtpHash)) {
      pending.emailOtpAttempts += 1;

      await pending.save();

      throw new ApiError(400, "Invalid Email OTP.", {
        emailOtp: "Invalid OTP",
      });
    }

    isEmailValid = true;


    // Check Phone OTP via Twilio Verify

    const fullPhoneNumber =
      pending.dialCode + pending.phoneNumber;

    const isPhoneVerified = await verifySmsOtp(
      fullPhoneNumber,
      phoneOtp,
    );

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
      const userObj = {
        firstName: pending.firstName,
        lastName: pending.lastName,
        email: pending.email,
        countryCode: pending.countryCode,
        dialCode: pending.dialCode,
        phoneNumber: pending.phoneNumber,
        department: pending.department,
        role: pending.role,
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
          accessToken,
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

    pending.phoneOtpAttempts = 0;

    await pending.save();

    await sendSms(
      pending.dialCode + pending.phoneNumber,
    );

    sendSuccess(
      res,
      200,
      "A new Phone OTP has been sent.",
    );
  } catch (error) {
    next(error);
  }
};