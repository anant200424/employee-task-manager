import { Router } from "express";
import { authenticate, restrictTo } from "../middleware/auth";
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
} from "../controllers/projectController";

const router = Router();

router.use(authenticate);

router.get("/", getProjects);
router.post("/", restrictTo("super_admin", "admin"), createProject);
router.get("/:id", getProjectById);
router.patch("/:id", restrictTo("super_admin", "admin"), updateProject);

export default router;
