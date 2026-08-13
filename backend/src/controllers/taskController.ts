import { Response, NextFunction } from "express";
import Task, { ITask } from "../models/Task";
import User from "../models/User";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { AuthRequest } from "../middleware/auth";

// @route  GET /api/tasks
export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status, priority, search } = req.query;

    const query: Record<string, unknown> = {};

    // Filter by assigned user or global department tasks
    if (userId) {
      query.$or = [{ assignedTo: userId }, { assignedTo: { $exists: false } }, { assignedTo: null }];
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (search && typeof search === "string") {
      query.title = { $regex: search, $options: "i" };
    }

    let tasks = await Task.find(query).sort({ createdAt: -1 });

    // If user has 0 tasks, seed initial default tasks for a great out-of-the-box experience
    if (tasks.length === 0 && (!status || status === "all") && !search) {
      const user = userId ? await User.findById(userId) : null;
      const dept = user?.department || "Engineering";

      const defaultTasks: Array<Partial<ITask>> = [
        {
          title: "Complete EmpSphere onboarding & security overview",
          description: "Review enterprise team security guidelines, 2FA setup, and department access policies.",
          status: "in_progress",
          priority: "high",
          assignedTo: userId as never,
          department: dept,
          tags: ["Onboarding", "Security"],
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Align with team lead on Q3 sprint deliverables",
          description: "Sync with product manager and design team on upcoming task milestone roadmaps.",
          status: "todo",
          priority: "urgent",
          assignedTo: userId as never,
          department: dept,
          tags: ["Sprint", "Roadmap"],
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Review daily task manager analytics report",
          description: "Analyze cross-functional team productivity metrics and resolve pending pull requests.",
          status: "review",
          priority: "medium",
          assignedTo: userId as never,
          department: dept,
          tags: ["Analytics", "Review"],
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Setup development workspace and API credentials",
          description: "Configure local environment variables, MongoDB access, and JWT token authentication.",
          status: "completed",
          priority: "low",
          assignedTo: userId as never,
          department: dept,
          tags: ["DevOps", "Setup"],
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      tasks = (await Task.insertMany(defaultTasks)) as never;
    }

    sendSuccess(res, 200, "Tasks fetched successfully.", { tasks });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/tasks
export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, status, priority, dueDate, department, tags } = req.body;

    if (!title || title.trim().length === 0) {
      throw new ApiError(400, "Task title is required.");
    }

    const user = req.user?.id ? await User.findById(req.user.id) : null;

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      status: status || "in_progress",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      assignedTo: req.user?.id,
      department: department || user?.department || "Engineering",
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t: string) => t.trim()) : [],
    });

    sendSuccess(res, 201, "Task created successfully.", { task });
  } catch (error) {
    next(error);
  }
};

// @route  PATCH /api/tasks/:id
export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, tags } = req.body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
    if (tags !== undefined) updates.tags = tags;

    const task = await Task.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!task) throw new ApiError(404, "Task not found.");

    sendSuccess(res, 200, "Task updated successfully.", { task });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/tasks/:id
export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) throw new ApiError(404, "Task not found.");

    sendSuccess(res, 200, "Task deleted successfully.", { id });
  } catch (error) {
    next(error);
  }
};
