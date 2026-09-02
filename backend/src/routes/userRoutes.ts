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
} from "../controllers/userController";
import { validate } from "../middleware/validate";
import { updateProfileSchema } from "../validators/authValidators";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

router.use(protect);
router.get("/", getAllUsers);
router.get("/analytics", getAnalyticsSummary);
router.get("/me", getProfile);
router.patch("/me", validate(updateProfileSchema), updateProfile);
router.get("/dashboard", getDashboardSummary);

// Admin-only Block / Unblock & Performance & Edit & Delete
router.patch("/:id/block", restrictTo("admin"), blockUser);
router.patch("/:id/unblock", restrictTo("admin"), unblockUser);
router.get("/:id/performance", restrictTo("admin"), getUserPerformance);
router.patch("/:id", restrictTo("admin"), updateUserByAdmin);
router.delete("/:id", restrictTo("admin"), deleteUserByAdmin);

export default router;
