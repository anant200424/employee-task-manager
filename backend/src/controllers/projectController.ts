import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import Project from "../models/Project";
import Task from "../models/Task";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { recordAuditLog } from "../services/auditService";
import { escapeRegex } from "../utils/sanitize";

/**
 * Helper to generate a unique project code (e.g., PRJ-ENG-01)
 */
const generateProjectCode = async (department: string): Promise<string> => {
  const deptCode = department.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, "") || "PRJ";
  const count = await Project.countDocuments({ department: { $regex: new RegExp(escapeRegex(deptCode), "i") } });
  const num = String(count + 1).padStart(2, "0");
  return `PRJ-${deptCode}-${num}`;
};

/**
 * Seed initial real projects from existing DB users & tasks if 0 exist
 */
const seedInitialProjectsIfEmpty = async () => {
  const existingCount = await Project.countDocuments();
  if (existingCount > 0) return;

  const users = await User.find({}).lean();
  if (users.length === 0) return;

  const findManager = (deptKeyword: string, fallbackIdx = 0) => {
    return (
      users.find(
        (u: any) =>
          (u.systemRole === "manager" || (u.role && /manager|lead|director|head/i.test(u.role))) &&
          (u.department || "").toLowerCase().includes(deptKeyword.toLowerCase())
      ) ||
      users.find((u: any) => (u.department || "").toLowerCase().includes(deptKeyword.toLowerCase())) ||
      users[fallbackIdx % users.length]
    );
  };

  const findTeam = (deptKeyword: string) => {
    return users
      .filter((u: any) => (u.department || "").toLowerCase().includes(deptKeyword.toLowerCase()))
      .map((u: any) => u._id);
  };

  const initialSeedData = [
    {
      code: "PRJ-ENG-01",
      name: "Workflow Engine & RBAC Gateway",
      department: "Engineering",
      priority: "Critical",
      status: "On Track",
      targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      budgetHealth: "Resource Optimized",
      description: "Distributed permission governance, task routing pipeline, and multi-tenant authentication.",
      manager: findManager("eng", 0)._id,
      assignedTeam: findTeam("eng"),
    },
    {
      code: "PRJ-OPS-02",
      name: "Cloud Infrastructure & Zero-Trust",
      department: "Operations",
      priority: "High",
      status: "On Track",
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      budgetHealth: "On Track",
      description: "Container vulnerability hardening, automated failover, and continuous platform uptime.",
      manager: findManager("operat", 1)._id,
      assignedTeam: findTeam("operat"),
    },
    {
      code: "PRJ-DSN-03",
      name: "Design System 2.0 & Mobile Cockpit",
      department: "Design",
      priority: "Medium",
      status: "In Execution",
      targetDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      budgetHealth: "Under Budget",
      description: "Adaptive enterprise design tokens, responsive component architecture, and AA compliance.",
      manager: findManager("design", 2)._id,
      assignedTeam: findTeam("design"),
    },
    {
      code: "PRJ-SAL-04",
      name: "Partner Integrations & Client Portal",
      department: "Sales & Business Dev",
      priority: "High",
      status: "In Execution",
      targetDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
      budgetHealth: "Ahead of Schedule",
      description: "Self-service enterprise client onboarding pipeline and partner revenue telemetry.",
      manager: findManager("sales", 3)._id,
      assignedTeam: findTeam("sales"),
    },
    {
      code: "PRJ-HR-05",
      name: "Workforce Lifecycle & Talent Engine",
      department: "Human Resources",
      priority: "Medium",
      status: "On Track",
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      budgetHealth: "Resource Optimized",
      description: "Automated onboarding verification, managerial appointments, and capacity analytics.",
      manager: findManager("human", 4)._id,
      assignedTeam: findTeam("human"),
    },
    {
      code: "PRJ-FIN-06",
      name: "Financial Auditing & Statutory Vault",
      department: "Finance",
      priority: "Critical",
      status: "On Track",
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      budgetHealth: "On Target",
      description: "Automated tax compliance reports, payroll ledger reconciliation, and statutory audits.",
      manager: findManager("fin", 5)._id,
      assignedTeam: findTeam("fin"),
    },
  ];

  await Project.insertMany(initialSeedData);
};

/**
 * GET /api/projects
 * Retrieves all enterprise projects with live manager, team, and task progress
 */
export const getProjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Ensure initial real projects are seeded if database has none
    await seedInitialProjectsIfEmpty();

    const { department, status, priority, search } = req.query;
    const filter: Record<string, any> = {};

    if (department && department !== "all") {
      filter.department = { $regex: new RegExp(escapeRegex(String(department)), "i") };
    }
    if (status && status !== "all") {
      filter.status = status;
    }
    if (priority && priority !== "all") {
      filter.priority = priority;
    }
    if (search && typeof search === "string" && search.trim() !== "") {
      const sanitized = escapeRegex(search);
      filter.$or = [
        { name: { $regex: sanitized, $options: "i" } },
        { code: { $regex: sanitized, $options: "i" } },
        { department: { $regex: sanitized, $options: "i" } },
      ];
    }

    const projects = await Project.find(filter)
      .populate("manager", "firstName lastName email avatarUrl role department employeeId systemRole")
      .populate("assignedTeam", "firstName lastName email avatarUrl role department employeeId")
      .populate("createdBy", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all active tasks to calculate exact live completion metrics per project
    const allTasks = await Task.find({ isDeleted: { $ne: true } })
      .select("title priority status dueDate department assignedTo taskCode")
      .lean();

    // Map projects with dynamic task calculation from live MongoDB task collection
    const enrichedProjects = projects.map((p: any) => {
      const deptKey = (p.department || "").toLowerCase().slice(0, 4);
      const deptTasks = allTasks.filter((t: any) =>
        (t.department || "").toLowerCase().includes(deptKey)
      );
      const totalTasks = Math.max(deptTasks.length, 1);
      const completedTasks = deptTasks.filter((t: any) => t.status === "completed").length;
      const inProgressTasks = deptTasks.filter((t: any) => t.status === "in_progress").length;
      const progress = Math.round((completedTasks / totalTasks) * 100);

      // Target Date formatting
      const targetStr = p.targetDate
        ? new Date(p.targetDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Nov 30, 2026";

      // Contributor team count & preview
      const teamList = Array.isArray(p.assignedTeam) && p.assignedTeam.length > 0 ? p.assignedTeam : [];
      const contributorsCount = Math.max(teamList.length, 1);
      const contributorsPreview = teamList.slice(0, 4).map((c: any) => ({
        id: c._id || c.id,
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email,
        avatarUrl: c.avatarUrl || "",
        initials: `${(c.firstName?.[0] || "")}${(c.lastName?.[0] || "")}`.toUpperCase() || "TM",
      }));

      return {
        ...p,
        id: p._id.toString(),
        targetDate: targetStr,
        totalTasks,
        completedTasks,
        inProgressTasks,
        progress,
        contributorsCount,
        contributorsPreview,
        departmentTasks: deptTasks.slice(0, 8),
      };
    });

    sendSuccess(res, 200, "Projects retrieved successfully", {
      projects: enrichedProjects,
      totalCount: enrichedProjects.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects
 * Dispatches a new project directly from Super Admin or Admin
 */
export const createProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, department, managerId, priority, targetDate, description, budgetHealth } = req.body;

    if (!name || !name.trim()) {
      throw new ApiError(400, "Project name is required.");
    }
    if (!department || !department.trim()) {
      throw new ApiError(400, "Department is required.");
    }
    if (!managerId || !mongoose.Types.ObjectId.isValid(managerId)) {
      throw new ApiError(400, "A valid appointed department manager is required.");
    }

    const code = await generateProjectCode(department.trim());

    // Gather existing team members from that department
    const sanitizedDeptPrefix = escapeRegex(department.slice(0, 4));
    const teamMembers = await User.find({
      department: { $regex: new RegExp(sanitizedDeptPrefix, "i") },
    }).select("_id");

    const newProject = await Project.create({
      code,
      name: name.trim(),
      description: (description || "").trim(),
      department: department.trim(),
      priority: priority || "High",
      status: "In Execution",
      targetDate: targetDate ? new Date(targetDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      budgetHealth: budgetHealth || "On Track",
      manager: managerId,
      assignedTeam: teamMembers.map((u) => u._id),
      createdBy: req.user?.id,
    });

    // Also dispatch an initial root task in Task collection so it is tracked organization-wide
    const countTasks = await Task.countDocuments();
    const taskCode = `TSK-${1000 + countTasks + 1}`;
    await Task.create({
      taskCode,
      title: `${name.trim()} — Strategic Execution Gate`,
      description: description || `Primary initiative deliverable assigned to ${department}.`,
      priority: (priority || "high").toLowerCase(),
      status: "in_progress",
      dueDate: newProject.targetDate,
      department: newProject.department,
      assignedTo: [managerId],
      createdBy: req.user?.id,
      tags: ["project", "initiative", department.toLowerCase()],
    });

    // Record audit log
    if (req.user) {
      await recordAuditLog({
        req,
        action: "DISPATCH_PROJECT_INITIATIVE",
        resourceType: "department",
        resourceId: newProject._id.toString(),
        details: {
          code: newProject.code,
          name: newProject.name,
          department: newProject.department,
          manager: managerId,
        },
      });
    }

    const populatedProject = await Project.findById(newProject._id)
      .populate("manager", "firstName lastName email avatarUrl role department employeeId")
      .populate("assignedTeam", "firstName lastName email avatarUrl role department employeeId")
      .lean();

    sendSuccess(res, 201, "Project initiative created and dispatched successfully.", {
      project: populatedProject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 */
export const getProjectById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid project ID.");
    }

    const project = await Project.findById(id)
      .populate("manager", "firstName lastName email avatarUrl role department employeeId")
      .populate("assignedTeam", "firstName lastName email avatarUrl role department employeeId")
      .populate("createdBy", "firstName lastName email role")
      .lean();

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    sendSuccess(res, 200, "Project retrieved.", { project });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/projects/:id
 */
export const updateProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid project ID.");
    }

    const updated = await Project.findByIdAndUpdate(id, req.body, { new: true })
      .populate("manager", "firstName lastName email avatarUrl role department")
      .populate("assignedTeam", "firstName lastName email avatarUrl role department")
      .lean();

    if (!updated) {
      throw new ApiError(404, "Project not found.");
    }

    sendSuccess(res, 200, "Project updated successfully.", { project: updated });
  } catch (error) {
    next(error);
  }
};
