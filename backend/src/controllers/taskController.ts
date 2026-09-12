import { Response, NextFunction } from "express";
import Task, { ITask } from "../models/Task";
import User from "../models/User";
import Notification from "../models/Notification";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { AuthRequest } from "../middleware/auth";
import mongoose from "mongoose";
import { sendEmail, taskAssignmentEmailTemplate } from "../services/email.service";
import { recordAuditLog } from "../services/auditService";
import { resolveSystemRole } from "../middleware/rbac";
import { emitNewNotification } from "../services/socketService";

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
    const systemRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    const { status, priority, search, dateFilter, sort, assignedTo, department, trash } = req.query;

    const query: Record<string, unknown> = {};

    // Soft delete filtering: only show trash to admins if requested
    if (trash === "true" && (systemRole === "admin" || systemRole === "super_admin" || systemRole === "system_admin")) {
      query.isDeleted = true;
    } else {
      query.isDeleted = { $ne: true };
    }

    // Role-based resource scoping
    if (systemRole === "employee") {
      // Employees ONLY see tasks explicitly assigned to them
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        query.assignedTo = new mongoose.Types.ObjectId(userId);
      }
    } else if (systemRole === "manager") {
      // Managers see tasks in their department, or created by them, or assigned to them
      const userDept = req.user?.department || "Engineering";
      const uId = userId ? new mongoose.Types.ObjectId(userId) : null;
      query.$or = [
        { department: userDept },
        ...(uId ? [{ createdBy: uId }, { assignedTo: uId }] : []),
      ];
    } else {
      // Super Admin and Admin: full organization visibility with filter support
      if (assignedTo && assignedTo !== "all" && typeof assignedTo === "string") {
        if (mongoose.Types.ObjectId.isValid(assignedTo)) {
          query.assignedTo = new mongoose.Types.ObjectId(assignedTo);
        }
      }
      if (department && department !== "all" && typeof department === "string") {
        query.department = department;
      }
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
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        query.dueDate = { $gte: startOfDay, $lte: endOfDay };
      } else if (dateFilter === "week") {
        const startOfWeek = new Date();
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        query.dueDate = { $gte: startOfWeek, $lte: endOfWeek };
      } else if (dateFilter === "month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        query.dueDate = { $gte: startOfMonth, $lte: endOfMonth };
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
      .populate("comments.user", "firstName lastName avatarUrl")
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

    const systemRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    if (!["super_admin", "admin", "manager"].includes(systemRole)) {
      throw new ApiError(403, "Only administrators and managers can create enterprise tasks.");
    }

    const cleanTitle = String(title || "").trim();
    if (!cleanTitle) {
      throw new ApiError(400, "Task title is required.");
    }
    if (cleanTitle.length < 3) {
      throw new ApiError(400, "Task title must be at least 3 characters.");
    }
    if (cleanTitle.length > 120) {
      throw new ApiError(400, "Task title cannot exceed 120 characters.");
    }

    const validPriorities = ["low", "medium", "high", "urgent"];
    if (priority && !validPriorities.includes(priority)) {
      throw new ApiError(400, "Priority must be low, medium, high, or urgent.");
    }

    const validStatuses = ["todo", "in_progress", "review", "completed"];
    if (status && !validStatuses.includes(status)) {
      throw new ApiError(400, "Status must be todo, in_progress, review, or completed.");
    }

    if (description && String(description).length > 3000) {
      throw new ApiError(400, "Task description cannot exceed 3,000 characters.");
    }

    let creator = null;
    if (req.user?.id) {
      creator = await User.findById(req.user.id);
    }

    const creatorName = creator ? `${creator.firstName} ${creator.lastName}` : "Admin";
    const taskCode = await generateUniqueTaskCode();

    let parsedDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    if (dueDate) {
      const parsed = new Date(dueDate);
      if (!isNaN(parsed.getTime())) {
        parsedDueDate = parsed;
      } else {
        throw new ApiError(400, "Invalid due date format provided.");
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
    }

    if (assignedIds.length === 0) {
      if (systemRole === "admin" || systemRole === "super_admin" || systemRole === "manager") {
        throw new ApiError(400, "Please assign the task to at least one employee.");
      } else if (req.user?.id) {
        assignedIds = [new mongoose.Types.ObjectId(req.user.id)];
      } else {
        throw new ApiError(400, "Please assign the task to at least one employee.");
      }
    }

    // Enterprise Safeguard: Non-superadmins cannot assign tasks to Administrator accounts
    if (systemRole !== "super_admin" && assignedIds.length > 0) {
      const assignedAdmins = await User.find({
        _id: { $in: assignedIds },
        $or: [
          { systemRole: { $in: ["super_admin", "admin", "system_admin"] } },
          { role: { $regex: /admin/i } },
        ],
      });
      if (assignedAdmins.length > 0) {
        throw new ApiError(
          403,
          "Enterprise Governance Safeguard: Tasks cannot be assigned to Administrator accounts.",
        );
      }
    }

    const task = await Task.create({
      taskCode,
      title: cleanTitle,
      description: description ? String(description).trim() : "",
      status: status || "in_progress",
      priority: priority || "medium",
      dueDate: parsedDueDate,
      assignedTo: assignedIds,
      createdBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      department: (department ? String(department).trim() : "") || creator?.department || "Engineering",
      tags: parsedTags,
      isDeleted: false,
      activityLog: [
        {
          action: "CREATED",
          performedBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
          performerName: creatorName,
          timestamp: new Date(),
          details: `Task initialized with priority ${priority || "medium"}.`,
        },
      ],
    });

    await recordAuditLog({
      req,
      action: "TASK_CREATED",
      resourceType: "task",
      resourceId: task._id.toString(),
      details: {
        taskCode,
        title: cleanTitle,
        priority: priority || "medium",
        assignedToCount: assignedIds.length,
      },
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "firstName lastName email avatarUrl department role employeeId")
      .populate("createdBy", "firstName lastName email role")
      .lean();

    // Create notifications for each assigned employee
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
      notificationsToCreate.forEach((notif) => {
        emitNewNotification(notif.recipient.toString(), notif);
      });

      // Dispatch professional task assignment email to all assigned employees via SMTP
      try {
        const assignees = await User.find({ _id: { $in: assignedIds } }).select(
          "firstName lastName email department"
        );
        for (const emp of assignees) {
          if (emp.email) {
            const recipientName =
              `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Employee";
            const html = taskAssignmentEmailTemplate({
              recipientName,
              assignerName: creatorName,
              taskCode,
              taskTitle: cleanTitle,
              taskDescription: description ? String(description).trim() : "",
              priority: priority || "medium",
              dueDate: parsedDueDate,
              department:
                (department ? String(department).trim() : "") ||
                creator?.department ||
                "Engineering",
            });

            await sendEmail({
              to: emp.email,
              subject: `[Task Assigned] ${taskCode}: ${cleanTitle}`,
              html,
            });
          }
        }
      } catch (mailErr) {
        console.error("[Mailer] Error dispatching task assignment email:", mailErr);
      }
    }

    sendSuccess(res, 201, "Task created successfully.", { task: populatedTask });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a single task by ID with full populated assignees and comments.
 * Scoped by verifyTaskResourceAccess("read").
 * 
 * @route  GET /api/tasks/:id
 */
export const getTaskById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate("assignedTo", "firstName lastName email avatarUrl department role employeeId")
      .populate("createdBy", "firstName lastName email role")
      .populate("comments.user", "firstName lastName email avatarUrl");

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found.");
    }

    sendSuccess(res, 200, "Task retrieved successfully.", { task });
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
    if (!existingTask || existingTask.isDeleted) {
      throw new ApiError(404, "Task not found.");
    }

    const updates: Record<string, unknown> = {};
    const systemRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    const isAdmin = systemRole === "admin" || systemRole === "super_admin";
    const isManager = systemRole === "manager";
    const isAssignee = (existingTask.assignedTo || []).some(
      (aId) => aId.toString() === req.user?.id
    );

    // IDOR / BOLA Authorization Security Guard
    if (!isAdmin) {
      if (isManager) {
        const isDeptTask =
          existingTask.department?.toLowerCase() === req.user?.department?.toLowerCase();
        const isCreator = existingTask.createdBy?.toString() === req.user?.id;
        if (!isDeptTask && !isCreator && !isAssignee) {
          throw new ApiError(
            403,
            "Managerial scope violation: You can only update tasks within your department or assigned to you."
          );
        }
      } else {
        // Employee scope: strictly assigned tasks only
        if (!isAssignee) {
          throw new ApiError(403, "Access Denied: You are not assigned to this task.");
        }
        if (
          title !== undefined ||
          priority !== undefined ||
          dueDate !== undefined ||
          department !== undefined ||
          assignedTo !== undefined
        ) {
          throw new ApiError(
            403,
            "Employees can only update task progress status, comments, or checklist items."
          );
        }
      }
    }

    // All authorized users can update progress status
    if (status !== undefined) {
      const validStatuses = ["todo", "in_progress", "review", "completed"];
      if (!validStatuses.includes(status)) {
        throw new ApiError(400, "Status must be todo, in_progress, review, or completed.");
      }
      updates.status = status;
    }

    // Admins and Managers can edit title, description, priority, department, dueDate, tags, assignees
    if (isAdmin || isManager) {
      if (title !== undefined) {
        const cleanTitle = String(title).trim();
        if (!cleanTitle) throw new ApiError(400, "Task title is required.");
        if (cleanTitle.length < 3) throw new ApiError(400, "Task title must be at least 3 characters.");
        if (cleanTitle.length > 120) throw new ApiError(400, "Task title cannot exceed 120 characters.");
        updates.title = cleanTitle;
      }
      if (description !== undefined) {
        const cleanDesc = String(description).trim();
        if (cleanDesc.length > 3000) throw new ApiError(400, "Task description cannot exceed 3,000 characters.");
        updates.description = cleanDesc;
      }
      if (priority !== undefined) {
        const validPriorities = ["low", "medium", "high", "urgent"];
        if (!validPriorities.includes(priority)) {
          throw new ApiError(400, "Priority must be low, medium, high, or urgent.");
        }
        updates.priority = priority;
      }
      if (department !== undefined) {
        const cleanDept = String(department).trim();
        if (!cleanDept) throw new ApiError(400, "Department is required.");
        if (cleanDept.length > 50) throw new ApiError(400, "Department name cannot exceed 50 characters.");
        updates.department = cleanDept;
      }
      if (dueDate !== undefined) {
        const parsed = new Date(dueDate);
        if (isNaN(parsed.getTime())) throw new ApiError(400, "Invalid due date format.");
        updates.dueDate = parsed;
      }

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

      if (assignedIds.length === 0) {
        throw new ApiError(400, "Please select at least one assignee for this task.");
      }

      // Enterprise Safeguard: Non-superadmins cannot assign tasks to Administrator accounts
      if (systemRole !== "super_admin" && assignedIds.length > 0) {
        const assignedAdmins = await User.find({
          _id: { $in: assignedIds },
          $or: [
            { systemRole: { $in: ["super_admin", "admin", "system_admin"] } },
            { role: { $regex: /admin/i } },
          ],
        });
        if (assignedAdmins.length > 0) {
          throw new ApiError(
            403,
            "Enterprise Governance Safeguard: Tasks cannot be assigned to Administrator accounts.",
          );
        }
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
      notifications.forEach((notif) => {
        emitNewNotification(notif.recipient.toString(), notif);
      });

      // Dispatch task assignment email to newly assigned employees via SMTP
      try {
        const newlyAssignedUsers = await User.find({
          _id: { $in: newlyAssigned.map((id) => new mongoose.Types.ObjectId(id)) },
        }).select("firstName lastName email department");

        for (const emp of newlyAssignedUsers) {
          if (emp.email) {
            const recipientName =
              `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Employee";
            const html = taskAssignmentEmailTemplate({
              recipientName,
              assignerName: updaterName,
              taskCode: existingTask.taskCode,
              taskTitle: updatedTask?.title || existingTask.title,
              taskDescription: updatedTask?.description || existingTask.description,
              priority: updatedTask?.priority || existingTask.priority || "medium",
              dueDate: updatedTask?.dueDate || existingTask.dueDate || new Date(),
              department: updatedTask?.department || existingTask.department || "Engineering",
            });

            await sendEmail({
              to: emp.email,
              subject: `[Task Assigned] ${existingTask.taskCode}: ${updatedTask?.title || existingTask.title}`,
              html,
            });
          }
        }
      } catch (mailErr) {
        console.error("[Mailer] Error dispatching assignment email for updated task:", mailErr);
      }
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
        statusNotifications.forEach((notif) => {
          emitNewNotification(notif.recipient.toString(), notif);
        });
      }
    }

    sendSuccess(res, 200, "Task updated successfully.", { task: updatedTask });
  } catch (error) {
    next(error);
  }
};

/**
 * Archives (soft-deletes) an existing task by its ID.
 * 
 * @route  DELETE /api/tasks/:id
 * @param  id - The task ID to archive
 */
export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const systemRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    if (!["super_admin", "admin"].includes(systemRole)) {
      throw new ApiError(403, "Only workspace administrators are permitted to archive or delete tasks.");
    }

    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found.");
    }

    const deleter = req.user?.id ? await User.findById(req.user.id) : null;
    const deleterName = deleter ? `${deleter.firstName} ${deleter.lastName}` : "Administrator";

    task.isDeleted = true;
    task.deletedAt = new Date();
    task.deletedBy = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined;
    task.activityLog.push({
      action: "ARCHIVED",
      performedBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      performerName: deleterName,
      timestamp: new Date(),
      details: "Task archived to trash.",
    });

    await task.save();

    await recordAuditLog({
      req,
      action: "TASK_ARCHIVED",
      resourceType: "task",
      resourceId: task._id.toString(),
      details: { taskCode: task.taskCode, title: task.title },
    });

    sendSuccess(res, 200, `Task ${task.taskCode} archived successfully.`, { id });
  } catch (error) {
    next(error);
  }
};

/**
 * Restores a soft-deleted task from trash.
 * @route  POST /api/tasks/:id/restore
 */
export const restoreTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const systemRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    if (!["super_admin", "admin"].includes(systemRole)) {
      throw new ApiError(403, "Only administrators are permitted to restore archived tasks.");
    }

    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      throw new ApiError(404, "Task not found.");
    }

    const restorer = req.user?.id ? await User.findById(req.user.id) : null;
    const restorerName = restorer ? `${restorer.firstName} ${restorer.lastName}` : "Administrator";

    task.isDeleted = false;
    task.deletedAt = undefined;
    task.deletedBy = undefined;
    task.activityLog.push({
      action: "RESTORED",
      performedBy: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
      performerName: restorerName,
      timestamp: new Date(),
      details: "Task restored from trash.",
    });

    await task.save();

    await recordAuditLog({
      req,
      action: "TASK_RESTORED",
      resourceType: "task",
      resourceId: task._id.toString(),
      details: { taskCode: task.taskCode, title: task.title },
    });

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "firstName lastName email avatarUrl department role employeeId")
      .populate("createdBy", "firstName lastName email role")
      .populate("comments.user", "firstName lastName avatarUrl")
      .lean();

    sendSuccess(res, 200, `Task ${task.taskCode} restored successfully.`, { task: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * Appends a comment to a task.
 * @route  POST /api/tasks/:id/comments
 */
export const addTaskComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      throw new ApiError(400, "Comment text is required.");
    }

    const task = await Task.findById(id);
    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found.");
    }

    const user = await User.findById(req.user?.id);
    if (!user) throw new ApiError(401, "User not found.");

    const authorName = `${user.firstName} ${user.lastName}`.trim();
    const comment = {
      _id: new mongoose.Types.ObjectId(),
      user: user._id,
      authorName,
      authorAvatar: user.avatarUrl || "",
      text: String(text).trim(),
      createdAt: new Date(),
    };

    task.comments.push(comment as never);
    task.activityLog.push({
      action: "COMMENT_ADDED",
      performedBy: user._id,
      performerName: authorName,
      timestamp: new Date(),
      details: "Comment posted.",
    });

    await task.save();

    await recordAuditLog({
      req,
      action: "TASK_COMMENT_ADDED",
      resourceType: "task",
      resourceId: task._id.toString(),
      details: { taskCode: task.taskCode },
    });

    sendSuccess(res, 201, "Comment added successfully.", { comment });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggles completion status of a checklist item.
 * @route  PATCH /api/tasks/:id/checklist/:itemId
 */
export const toggleChecklistItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id, itemId } = req.params;
    const task = await Task.findById(id);
    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found.");
    }

    const item = task.checklist.find((c) => c._id?.toString() === itemId);
    if (!item) {
      throw new ApiError(404, "Checklist item not found.");
    }

    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : undefined;
    item.completedBy = item.completed && req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined;

    await task.save();

    sendSuccess(res, 200, "Checklist item updated.", { checklist: task.checklist });
  } catch (error) {
    next(error);
  }
};

/**
 * Adds a new item to task checklist.
 * @route  POST /api/tasks/:id/checklist
 */
export const addChecklistItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !String(title).trim()) {
      throw new ApiError(400, "Checklist item title is required.");
    }

    const task = await Task.findById(id);
    if (!task || task.isDeleted) {
      throw new ApiError(404, "Task not found.");
    }

    const newItem = {
      _id: new mongoose.Types.ObjectId(),
      title: String(title).trim(),
      completed: false,
    };

    task.checklist.push(newItem as never);
    await task.save();

    sendSuccess(res, 201, "Checklist item added.", { item: newItem, checklist: task.checklist });
  } catch (error) {
    next(error);
  }
};
