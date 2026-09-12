import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  terminateOtherSessions,
  startRegistration,
  verifyOtp,
  resendEmailOtp,
  resendPhoneOtp,
  getDraft,
} from "../controllers/authController";
import { validate } from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from "../validators/authValidators";
import { authLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter";
import { protect } from "../middleware/auth";

const router = Router();

router.post(
  "/register/start",
  authLimiter,
  validate(registerSchema),
  startRegistration,
);
router.get("/draft/:email", authLimiter, getDraft);
router.post("/verify-otp", authLimiter, validate(verifyOtpSchema), verifyOtp);
router.post(
  "/resend-email-otp",
  authLimiter,
  validate(resendOtpSchema),
  resendEmailOtp,
);
router.post(
  "/resend-phone-otp",
  authLimiter,
  validate(resendOtpSchema),
  resendPhoneOtp,
);

// Keep existing register if it's used elsewhere, but ideally we only use startRegistration now
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/verify-reset-otp",
  authLimiter,
  validate(verifyResetOtpSchema),
  verifyResetOtp,
);
router.post(
  "/resend-forgot-password-otp",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);
router.post(
  "/reset-password/:token",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword,
);
router.patch(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  changePassword,
);
router.post(
  "/terminate-other-sessions",
  protect,
  terminateOtherSessions,
);

export default router;
