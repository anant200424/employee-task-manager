import { Response, NextFunction } from "express";
import Task, { ITask } from "../models/Task";
import User from "../models/User";
import Notification from "../models/Notification";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";

/**
 * Generates a unique task code (e.g., TSK-1042)
 */
const generateUniqueTaskCode = async (): Promise<string> => {
  let isUnique = false;
  let code = "";
  while (!isUnique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    code = `TSK-${randomNum}`;
    const existing = await Task.findOne({ taskCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

/**
 * Retrieves a list of tasks for the authenticated user based on query filters.
 * 
 * @route  GET /api/tasks
 * @query  status - Filter by task status (e.g., 'todo', 'in_progress', 'review', 'completed')
 * @query  priority - Filter by task priority (e.g., 'low', 'medium', 'high', 'urgent')
 * @query  search - Text search query for taskCode, title, or description
 * @query  dateFilter - 'today' | 'week' | 'month' | 'overdue'
 * @query  sort - 'latest' | 'oldest' | 'dueDate' | 'priority'
 */
export const getTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status, priority, search, dateFilter, sort, assignedTo } = req.query;

    const query: Record<string, unknown> = {};

    // If employee (non-admin), ONLY show tasks where assignedTo contains user's ID
    if (userId && req.user?.role !== "admin") {
      query.assignedTo = new mongoose.Types.ObjectId(userId);
    } else if (assignedTo && assignedTo !== "all" && typeof assignedTo === "string") {
      // If admin filters by specific assigned user
      query.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { taskCode: searchRegex },
        { department: searchRegex },
      ];
    }

    // Date filtering
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      if (dateFilter === "today") {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        query.dueDate = { $gte: startOfDay, $lte: endOfDay };
      } else if (dateFilter === "week") {
        const startOfWeek = new Date(now.setHours(0, 0, 0, 0));
        const endOfWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        query.dueDate = { $gte: startOfWeek, $lte: endOfWeek };
      } else if (dateFilter === "overdue") {
        query.dueDate = { $lt: new Date() };
        if (!status || status === "all") {
          query.status = { $ne: "completed" };
        }
      }
    }

    // Sorting
    let sortOptions: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "oldest") {
      sortOptions = { createdAt: 1 };
    } else if (sort === "dueDate") {
      sortOptions = { dueDate: 1 };
    } else if (sort === "latest") {
      sortOptions = { createdAt: -1 };
    }

    let tasks = await Task.find(query)
      .populate("assignedTo", "firstName lastName email avatarUrl department role employeeId")
      .populate("createdBy", "firstName lastName email role")
      .sort(sortOptions)
      .lean();

    // Priority custom sort if requested
    if (sort === "priority") {
      const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      tasks.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
    }

    // If user has 0 tasks and is first time, seed default tasks with taskCodes
    if (tasks.length === 0 && (!status || status === "all") && !search && !dateFilter) {
      const user = userId ? await User.findById(userId) : null;
      const dept = user?.department || "Engineering";

      const seedCodes = ["TSK-1001", "TSK-1002", "TSK-1003", "TSK-1004"];
      const defaultTasks: Array<Partial<ITask>> = [
        {
          taskCode: seedCodes[0],
          title: "Complete EmpSphere onboarding & security overview",
          description:
            "Review enterprise team security guidelines, 2FA setup, and department access policies.",
          status: "in_progress",
          priority: "high",
          assignedTo: userId ? [new mongoose.Types.ObjectId(userId) as never] : [],
          department: dept,
          tags: ["Onboarding", "Security"],
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
        {
          taskCode: seedCodes[1],
          title: "Align with team lead on Q3 sprint deliverables",
          description:
            "Sync with product manager and design team on upcoming task milestone roadmaps.",
          status: "todo",
          priority: "urgent",
          assignedTo: userId ? [new mongoose.Types.ObjectId(userId) as never] : [],
          department: dept,
          tags: ["Sprint", "Roadmap"],
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          taskCode: seedCodes[2],
          title: "Review daily task manager analytics report",
          description:
            "Analyze cross-functional team productivity metrics and resolve pending pull requests.",
          status: "review",
          priority: "medium",
          assignedTo: userId ? [new mongoose.Types.ObjectId(userId) as never] : [],
          department: dept,
          tags: ["Analytics", "Review"],
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
        {
          taskCode: seedCodes[3],
          title: "Setup development workspace and API credentials",
          description:
            "Configure local environment variables, MongoDB access, and JWT token authentication.",
          status: "completed",
          priority: "low",
          assignedTo: userId ? [new mongoose.Types.ObjectId(userId) as never] : [],
          department: dept,
          tags: ["DevOps", "Setup"],
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      // Ensure seed codes don't collide
      for (const t of defaultTasks) {
        const exists = await Task.findOne({ taskCode: t.taskCode });
        if (exists) {
          t.taskCode = await generateUniqueTaskCode();
        }
      }

      await Task.insertMany(defaultTasks);

      tasks = await Task.find(query)
        .populate("assignedTo", "firstName lastName email avatarUrl department role employeeId")
        .populate("createdBy", "firstName lastName email role")
        .sort(sortOptions)
        .lean();
    }

    sendSuccess(res, 200, "Tasks fetched successfully.", { tasks });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new task and assigns it to specified employee(s).
 * Dispatches notifications to all assigned employees.
 * 
 * @route  POST /api/tasks
 * @body   title, description, status, priority, dueDate, department, tags, assignedTo
 */
export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      department,
      tags,
      assignedTo,
    } = req.body;

    if (req.user?.role !== "admin") {
      throw new ApiError(403, "Only administrators can create and assign enterprise tasks.");
    }

    if (!title || String(title).trim().length === 0) {
      throw new ApiError(400, "Task title is required.");
    }

    let creator = null;
    if (req.user?.id) {
      creator = await User.findById(req.user.id);
    }

    const taskCode = await generateUniqueTaskCode();

    let parsedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        parsedDueDate = parsed;
      }
    }

    let parsedTags: string[] = [];
    if (Array.isArray(tags)) {
      parsedTags = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === "string" && tags.trim().length > 0) {
      parsedTags = tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }

    // Parse assignedTo array (single or multiple employee IDs)
    let assignedIds: mongoose.Types.ObjectId[] = [];
    if (Array.isArray(assignedTo)) {
      assignedIds = assignedTo
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    } else if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
      assignedIds = [new mongoose.Types.ObjectId(assignedTo)];
    } else if (req.user?.id) {
      assignedIds = [new mongoose.Types.ObjectId(req.user.id)];
    }

    const task = await Task.create({
      taskCode,
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      status: status || "in_progress",
      priority: priority || "medium",
      dueDate: parsedDueDate,
      assignedTo: assignedIds,
      createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      department: department || creator?.department || "Engineering",
      tags: parsedTags,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "firstName lastName email avatarUrl department role employeeId")
      .populate("createdBy", "firstName lastName email role")
      .lean();

    // Create notifications for each assigned employee
    const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : "Admin";
    if (assignedIds.length > 0) {
      const notificationsToCreate = assignedIds.map((assigneeId) => ({
        recipient: assigneeId,
        sender: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
        senderName: creatorName,
        title: "New Task Assigned",
        message: `Task ${taskCode} - "${title}" has been assigned to you by ${creatorName}.`,
        type: "task",
        task: task._id,
        taskCode: taskCode,
        read: false,
      }));

      await Notification.insertMany(notificationsToCreate);
    }

    sendSuccess(res, 201, "Task created successfully.", { task: populatedTask });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates an existing task by its ID.
 * Dispatches notifications if new assignees are added.
 * 
 * @route  PATCH /api/tasks/:id
 * @param  id - The task ID to update
 * @body   title, description, status, priority, dueDate, department, tags, assignedTo
 */
export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      department,
      tags,
      assignedTo,
    } = req.body;

    const existingTask = await Task.findById(id);
    if (!existingTask) {
      throw new ApiError(404, "Task not found.");
    }

    const updates: Record<string, unknown> = {};
    const isAdmin = req.user?.role === "admin";

    // All authenticated users can update progress status
    if (status !== undefined) updates.status = status;

    // Only Admin can edit title, description, priority, department, dueDate, tags, assignees
    if (isAdmin) {
      if (title !== undefined) updates.title = String(title).trim();
      if (description !== undefined) updates.description = String(description).trim();
      if (priority !== undefined) updates.priority = priority;
      if (department !== undefined) updates.department = department;
      if (dueDate !== undefined) updates.dueDate = new Date(dueDate);

      if (tags !== undefined) {
        if (Array.isArray(tags)) {
          updates.tags = tags.map((t) => String(t).trim()).filter(Boolean);
        } else if (typeof tags === "string") {
          updates.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        }
      }
    }

    let newlyAssigned: string[] = [];
    if (assignedTo !== undefined) {
      let assignedIds: mongoose.Types.ObjectId[] = [];
      if (Array.isArray(assignedTo)) {
        assignedIds = assignedTo
          .filter((aId) => mongoose.Types.ObjectId.isValid(aId))
          .map((aId) => new mongoose.Types.ObjectId(aId));
      } else if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
        assignedIds = [new mongoose.Types.ObjectId(assignedTo)];
      }
      updates.assignedTo = assignedIds;

      // Check newly assigned users
      const existingAssigneeStrs = (existingTask.assignedTo || []).map((a) => a.toString());
      newlyAssigned = assignedIds
        .map((a) => a.toString())
        .filter((aStr) => !existingAssigneeStrs.includes(aStr));
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("assignedTo", "firstName lastName email avatarUrl department role employeeId")
      .populate("createdBy", "firstName lastName email role")
      .lean();

    // If new assignees were added, send them notifications
    if (newlyAssigned.length > 0 && req.user?.id) {
      const updater = await User.findById(req.user.id);
      const updaterName = updater ? `${updater.firstName} ${updater.lastName}` : "Admin";

      const notifications = newlyAssigned.map((assigneeId) => ({
        recipient: new mongoose.Types.ObjectId(assigneeId),
        sender: new mongoose.Types.ObjectId(req.user!.id),
        senderName: updaterName,
        title: "New Task Assigned",
        message: `Task ${existingTask.taskCode} - "${updatedTask?.title || existingTask.title}" has been assigned to you by ${updaterName}.`,
        type: "task",
        task: existingTask._id,
        taskCode: existingTask.taskCode,
        read: false,
      }));

      await Notification.insertMany(notifications);
    }

    // If task status was updated (e.g. Completed, In Progress, Review), notify admins & creator
    if (status !== undefined && status !== existingTask.status && req.user?.id) {
      const updater = await User.findById(req.user.id);
      const updaterName = updater ? `${updater.firstName} ${updater.lastName}` : "Team Member";
      
      const adminUsers = await User.find({ role: "admin", _id: { $ne: req.user.id } }).select("_id");
      const recipientIds: mongoose.Types.ObjectId[] = adminUsers.map((a) => a._id as mongoose.Types.ObjectId);

      if (
        existingTask.createdBy &&
        existingTask.createdBy.toString() !== req.user.id &&
        !recipientIds.some((r) => r.toString() === existingTask.createdBy!.toString())
      ) {
        recipientIds.push(new mongoose.Types.ObjectId(existingTask.createdBy));
      }

      const statusTitle =
        status === "completed"
          ? "Task Completed 🎉"
          : status === "review"
          ? "Task Under Review"
          : `Task Status: ${status.replace("_", " ")}`;

      const statusNotifications = recipientIds.map((rId) => ({
        recipient: rId,
        sender: new mongoose.Types.ObjectId(req.user!.id),
        senderName: updaterName,
        title: statusTitle,
        message: `${updaterName} marked task ${existingTask.taskCode} ("${existingTask.title}") as ${status.replace("_", " ")}.`,
        type: "task",
        task: existingTask._id,
        taskCode: existingTask.taskCode,
        read: false,
      }));

      if (statusNotifications.length > 0) {
        await Notification.insertMany(statusNotifications);
      }
    }

    sendSuccess(res, 200, "Task updated successfully.", { task: updatedTask });
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
    if (req.user?.role !== "admin") {
      throw new ApiError(403, "Only administrators can delete tasks.");
    }

    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      throw new ApiError(404, "Task not found.");
    }

    // Clean up notifications for this task
    await Notification.deleteMany({ task: id });

    sendSuccess(res, 200, "Task deleted successfully.", { id });
  } catch (error) {
    next(error);
  }
};
