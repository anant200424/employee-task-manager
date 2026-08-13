import { Router } from "express";
import { getTasks, createTask, updateTask, deleteTask } from "../controllers/taskController";
import { authenticate } from "../middleware/auth";

const router = Router();

// All task routes require authentication
router.use(authenticate);

router.route("/")
  .get(getTasks)
  .post(createTask);

router.route("/:id")
  .patch(updateTask)
  .delete(deleteTask);

export default router;
