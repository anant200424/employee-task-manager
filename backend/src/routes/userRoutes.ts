import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getDashboardSummary,
  getAllUsers,
  getAnalyticsSummary,
  blockUser,
  unblockUser,
  getUserPerformance,
  updateUserByAdmin,
  deleteUserByAdmin,
  sendEmailToUsers,
  requestEmailChange,
  verifyEmailChange,
  requestPhoneChange,
  verifyPhoneChange,
  exportUserData,
  getSystemSettings,
  updateSystemSettings,
  deleteMyAccount,
  createUserByAdmin,
} from "../controllers/userController";
import { validate } from "../middleware/validate";
import { updateProfileSchema } from "../validators/authValidators";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protect);
router.get("/", getAllUsers);
router.post("/", restrictTo("super_admin", "system_admin", "admin"), createUserByAdmin);
router.get("/analytics", getAnalyticsSummary);
router.get("/me", getProfile);
router.delete("/me", deleteMyAccount);
router.get("/me/export", exportUserData);
router.patch("/me", validate(updateProfileSchema), updateProfile);
router.get("/system/settings", getSystemSettings);
router.patch("/system/settings", restrictTo("super_admin", "system_admin"), updateSystemSettings);
router.get("/dashboard", getDashboardSummary);

// Profile Credential Changes (Two-Way Verification with OTP)
router.post("/profile/request-email-change", requestEmailChange);
router.post("/profile/verify-email-change", verifyEmailChange);
router.post("/profile/request-phone-change", requestPhoneChange);
router.post("/profile/verify-phone-change", verifyPhoneChange);

// Admin-only Email Dispatch
router.post("/send-email", restrictTo("admin", "super_admin", "system_admin"), sendEmailToUsers);

// Admin-only Block / Unblock & Performance & Edit & Delete
router.patch("/:id/block", restrictTo("admin", "super_admin", "system_admin"), blockUser);
router.patch("/:id/unblock", restrictTo("admin", "super_admin", "system_admin"), unblockUser);
router.get("/:id/performance", restrictTo("admin", "super_admin", "system_admin"), getUserPerformance);
router.patch("/:id", restrictTo("admin", "super_admin", "system_admin"), updateUserByAdmin);
router.delete("/:id", restrictTo("admin", "super_admin", "system_admin"), deleteUserByAdmin);

export default router;

