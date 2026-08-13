import { Router } from "express";
import { getProfile, updateProfile, getDashboardSummary } from "../controllers/userController";
import { validate } from "../middleware/validate";
import { updateProfileSchema } from "../validators/authValidators";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);
router.get("/me", getProfile);
router.patch("/me", validate(updateProfileSchema), updateProfile);
router.get("/dashboard", getDashboardSummary);

export default router;
