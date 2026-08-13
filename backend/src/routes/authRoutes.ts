import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/authController";
import { validate } from "../middleware/validate";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/authValidators";
import { authLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", authLimiter, validate(resetPasswordSchema), resetPassword);
router.patch("/change-password", protect, validate(changePasswordSchema), changePassword);

export default router;
