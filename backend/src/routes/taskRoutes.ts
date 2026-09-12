import { Router } from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
  addTaskComment,
  addChecklistItem,
  toggleChecklistItem,
} from "../controllers/taskController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { verifyTaskResourceAccess } from "../middleware/rbac";
import {
  createTaskSchema,
  updateTaskSchema,
  addCommentSchema,
  addChecklistSchema,
} from "../validators/taskValidators";

const router = Router();

// All task routes require authentication
router.use(authenticate);

router
  .route("/")
  .get(getTasks)
  .post(validate(createTaskSchema), createTask);

router
  .route("/:id")
  .get(verifyTaskResourceAccess("read"), getTaskById)
  .patch(verifyTaskResourceAccess("update"), validate(updateTaskSchema), updateTask)
  .delete(verifyTaskResourceAccess("delete"), deleteTask);

router.post("/:id/restore", verifyTaskResourceAccess("delete"), restoreTask);
router.post("/:id/comments", verifyTaskResourceAccess("comment"), validate(addCommentSchema), addTaskComment);
router.post("/:id/checklist", verifyTaskResourceAccess("update"), validate(addChecklistSchema), addChecklistItem);
router.patch("/:id/checklist/:itemId", verifyTaskResourceAccess("update"), toggleChecklistItem);

export default router;
