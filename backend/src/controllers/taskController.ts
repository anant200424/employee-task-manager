import { Response, NextFunction } from "express";
import Task, { ITask } from "../models/Task";
import User from "../models/User";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { AuthRequest } from "../middleware/auth";

/**
 * Retrieves a list of tasks for the authenticated user based on query filters.
 * Automatically seeds default onboarding tasks if the user has no tasks yet.
 * 
 * @route  GET /api/tasks
 * @query  status - Filter by task status (e.g., 'todo', 'in_progress')
 * @query  priority - Filter by task priority
 * @query  search - Text search query for task title
 */
export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status, priority, search } = req.query;

    const query: Record<string, unknown> = {};

    // Filter by assigned user or global department tasks
    if (userId && req.user?.role !== "admin") {
      query.$or = [
        { assignedTo: userId },
        { assignedTo: { $exists: false } },
        { assignedTo: null },
      ];
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

    let tasks = await Task.find(query).sort({ createdAt: -1 }).lean();

    // If user has 0 tasks, seed initial default tasks for a great out-of-the-box experience
    if (tasks.length === 0 && (!status || status === "all") && !search) {
      const user = userId ? await User.findById(userId) : null;
      const dept = user?.department || "Engineering";

      const defaultTasks: Array<Partial<ITask>> = [
        {
          title: "Complete EmpSphere onboarding & security overview",
          description:
            "Review enterprise team security guidelines, 2FA setup, and department access policies.",
          status: "in_progress",
          priority: "high",
          assignedTo: userId as never,
          department: dept,
          tags: ["Onboarding", "Security"],
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Align with team lead on Q3 sprint deliverables",
          description:
            "Sync with product manager and design team on upcoming task milestone roadmaps.",
          status: "todo",
          priority: "urgent",
          assignedTo: userId as never,
          department: dept,
          tags: ["Sprint", "Roadmap"],
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Review daily task manager analytics report",
          description:
            "Analyze cross-functional team productivity metrics and resolve pending pull requests.",
          status: "review",
          priority: "medium",
          assignedTo: userId as never,
          department: dept,
          tags: ["Analytics", "Review"],
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Setup development workspace and API credentials",
          description:
            "Configure local environment variables, MongoDB access, and JWT token authentication.",
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

/**
 * Creates a new task and assigns it to the authenticated user.
 * 
 * @route  POST /api/tasks
 * @body   title, description, status, priority, dueDate, department, tags
 */
export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, description, status, priority, dueDate, department, tags } =
      req.body;

    if (!title || String(title).trim().length === 0) {
      throw new ApiError(400, "Task title is required.");
    }

    let user = null;
    if (req.user?.id) {
      user = await User.findById(req.user.id);
    }

    let parsedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days from now
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        parsedDueDate = parsed;
      }
    }

    let parsedTags: string[] = [];
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === "string" && tags.trim().length > 0) {
      parsedTags = tags.split(",").map((t: string) => t.trim());
    }

    const task = await Task.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      status: status || "in_progress",
      priority: priority || "medium",
      dueDate: parsedDueDate,
      assignedTo: req.user?.id || undefined,
      department: department || user?.department || "Engineering",
      tags: parsedTags,
    });

    sendSuccess(res, 201, "Task created successfully.", { task });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an existing task by its ID.
 * 
 * @route  PATCH /api/tasks/:id
 * @param  id - The task ID to update
 * @body   title, description, status, priority, dueDate, tags
 */
export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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

/**
 * Deletes an existing task by its ID.
 * 
 * @route  DELETE /api/tasks/:id
 * @param  id - The task ID to delete
 */
export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) throw new ApiError(404, "Task not found.");

    sendSuccess(res, 200, "Task deleted successfully.", { id });
  } catch (error) {
    next(error);
  }
};
