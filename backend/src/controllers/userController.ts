import { Response, NextFunction } from "express";
import { getCountryCallingCode, CountryCode } from "libphonenumber-js";
import mongoose from "mongoose";
import User from "../models/User";
import Task from "../models/Task";
import Notification from "../models/Notification";
import PlatformSettings from "../models/PlatformSettings";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { AuthRequest } from "../middleware/auth";
import { recordAuditLog } from "../services/auditService";
import { resolveSystemRole, SystemRole } from "../middleware/rbac";
import {
  sendEmail,
  adminDirectMessageEmailTemplate,
  accountBlockedEmailTemplate,
  accountUnblockedEmailTemplate,
  phoneChangeOtpEmailTemplate,
} from "../services/email.service";
import { generateOTP, hashOTP, verifyOTP } from "../services/otp.service";
import { uploadImageToCloudinary } from "../config/cloudinary";
import { emitUserBlocked } from "../services/socketService";

// @route  GET /api/users/me
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw new ApiError(404, "User not found.");
    sendSuccess(res, 200, "Profile fetched successfully.", { user });
  } catch (error) {
    next(error);
  }
};

const NAME_REGEX = /^[A-Za-z\s'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMP_ID_REGEX = /^[A-Za-z0-9-_]+$/;

// @route  PATCH /api/users/me
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      countryCode,
      phoneNumber,
      department,
      role,
      employeeId,
      dateOfBirth,
      avatarUrl,
      coverUrl,
      employmentInfo,
      compliance,
      documents,
      salary,
      privacySettings,
      notificationPreferences,
      regionalPreferences,
      appearancePreferences,
      twoFactorEnabled,
    } = req.body;

    const currentUser = await User.findById(req.user?.id);
    if (!currentUser) throw new ApiError(404, "User not found.");

    const curRoleLower = String(currentUser.role || "").toLowerCase();
    const curSysRole = String(currentUser.systemRole || "").toLowerCase();
    const isAdminUser =
      curRoleLower.includes("admin") ||
      curRoleLower.includes("super") ||
      ["super_admin", "system_admin", "admin"].includes(curSysRole);

    const updates: Record<string, unknown> = {};

    if (firstName !== undefined) {
      const fn = firstName.trim();
      if (!fn || fn.length < 2) throw new ApiError(400, "First name must be at least 2 characters.");
      if (fn.length > 40) throw new ApiError(400, "First name cannot exceed 40 characters.");
      if (!NAME_REGEX.test(fn)) throw new ApiError(400, "First name can only contain letters, spaces, hyphens or apostrophes.");
      updates.firstName = fn;
    }

    if (lastName !== undefined) {
      const ln = lastName.trim();
      if (ln) {
        if (ln.length < 2) throw new ApiError(400, "Last name must be at least 2 characters.");
        if (ln.length > 40) throw new ApiError(400, "Last name cannot exceed 40 characters.");
        if (!NAME_REGEX.test(ln)) throw new ApiError(400, "Last name can only contain letters, spaces, hyphens or apostrophes.");
      }
      updates.lastName = ln;
    }

    if (department !== undefined && department.trim() !== (currentUser.department || "").trim()) {
      throw new ApiError(
        403,
        "Enterprise Governance Lock: Department assignment cannot be self-modified in personal profile. It is managed exclusively by the Super Administrator via the Employee Directory.",
      );
    }

    if (role !== undefined && role.trim() !== (currentUser.role || "").trim()) {
      throw new ApiError(
        403,
        "Enterprise Governance Lock: Designation and job title cannot be self-modified in personal profile. Changes must be designated by the Super Administrator via the Employee Directory.",
      );
    }

    if (employeeId !== undefined && employeeId.trim().toUpperCase() !== (currentUser.employeeId || "").trim().toUpperCase()) {
      throw new ApiError(
        403,
        "Enterprise Governance Lock: Corporate Employee ID codes cannot be self-modified in personal profile. Changes are governed exclusively by the Super Administrator.",
      );
    }


    if (dateOfBirth) {
      const parsedDob = new Date(dateOfBirth);
      if (isNaN(parsedDob.getTime())) {
        throw new ApiError(400, "Invalid date of birth provided.");
      }
      const age = (Date.now() - parsedDob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 16) throw new ApiError(400, "User must be at least 16 years old.");
      if (age > 100) throw new ApiError(400, "Please enter a realistic date of birth.");
      updates.dateOfBirth = parsedDob;
    }

    if (typeof avatarUrl === "string") {
      if (!avatarUrl || avatarUrl.trim() === "") {
        updates.avatarUrl = "";
      } else if (avatarUrl.startsWith("data:image/")) {
        const cloudRes = await uploadImageToCloudinary(avatarUrl, "empsphere/avatars", `avatar-${currentUser.id}`);
        updates.avatarUrl = cloudRes.url;
      } else {
        updates.avatarUrl = avatarUrl.trim();
      }
    }
    if (typeof coverUrl === "string") {
      if (!coverUrl || coverUrl.trim() === "") {
        updates.coverUrl = "";
      } else if (coverUrl.startsWith("data:image/")) {
        const cloudRes = await uploadImageToCloudinary(coverUrl, "empsphere/covers", `cover-${currentUser.id}`);
        updates.coverUrl = cloudRes.url;
      } else {
        updates.coverUrl = coverUrl.trim();
      }
    }

    if (countryCode) {
      updates.countryCode = countryCode;
      updates.dialCode = `+${getCountryCallingCode(countryCode)}`;
    }

    if (phoneNumber !== undefined) {
      const ph = phoneNumber.trim();
      if (ph) {
        const cleanPh = ph.replace(/[\s()-]/g, "");
        if (cleanPh.length < 7 || cleanPh.length > 15 || !/^\+?[0-9]+$/.test(cleanPh)) {
          throw new ApiError(400, "Invalid phone number format.");
        }
      }
      updates.phoneNumber = ph;
    }

    if (employmentInfo) {
      const currentEmpInfo = currentUser.employmentInfo ? JSON.parse(JSON.stringify(currentUser.employmentInfo)) : {};
      const sanitizedEmploymentInfo = {
        ...currentEmpInfo,
        ...employmentInfo,
      };
      // Never allow self-modification of designation or manager via personal profile update
      sanitizedEmploymentInfo.designation = currentUser.employmentInfo?.designation || currentUser.role;
      sanitizedEmploymentInfo.manager = currentUser.employmentInfo?.manager;
      updates.employmentInfo = sanitizedEmploymentInfo;
    }

    if (compliance) {
      const sanitizedCompliance: Record<string, any> = { ...compliance };
      if (compliance.panNumber) {
        const pan = compliance.panNumber.trim().toUpperCase();
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
          throw new ApiError(400, "Invalid Indian PAN format (e.g. ABCDE1234F).");
        }
        sanitizedCompliance.panNumber = pan;
      }
      if (compliance.aadharNumber) {
        const aadhar = compliance.aadharNumber.trim().replace(/\s+/g, "");
        if (!/^[0-9]{12}$/.test(aadhar)) {
          throw new ApiError(400, "Invalid Aadhaar format. Must be a 12-digit number.");
        }
        sanitizedCompliance.aadharNumber = aadhar;
      }
      if (compliance.uanNumber) {
        const uan = compliance.uanNumber.trim().replace(/\s+/g, "");
        if (!/^[0-9]{12}$/.test(uan)) {
          throw new ApiError(400, "Invalid UAN format. Must be a 12-digit number.");
        }
        sanitizedCompliance.uanNumber = uan;
      }
      updates.compliance = sanitizedCompliance;
    }

    if (documents) updates.documents = documents;

    if (salary) {
      if (!isAdminUser) {
        throw new ApiError(403, "Access Denied: Compensation structure can only be managed by HR and Administrators.");
      }
      const { basic, hra, allowances, pf, totalCTC } = salary;
      if (basic !== undefined && (typeof basic !== "number" || basic < 0)) {
        throw new ApiError(400, "Basic salary must be a non-negative number.");
      }
      if (hra !== undefined && (typeof hra !== "number" || hra < 0)) {
        throw new ApiError(400, "HRA must be a non-negative number.");
      }
      if (allowances !== undefined && (typeof allowances !== "number" || allowances < 0)) {
        throw new ApiError(400, "Allowances must be a non-negative number.");
      }
      if (pf !== undefined && (typeof pf !== "number" || pf < 0)) {
        throw new ApiError(400, "PF must be a non-negative number.");
      }
      if (totalCTC !== undefined && (typeof totalCTC !== "number" || totalCTC < 0)) {
        throw new ApiError(400, "Total CTC must be a non-negative number.");
      }
      updates.salary = salary;
    }

    if (privacySettings) updates.privacySettings = privacySettings;
    if (notificationPreferences) updates.notificationPreferences = notificationPreferences;
    if (regionalPreferences) updates.regionalPreferences = regionalPreferences;
    if (appearancePreferences) updates.appearancePreferences = appearancePreferences;
    if (twoFactorEnabled !== undefined) updates.twoFactorEnabled = twoFactorEnabled;

    const user = await User.findByIdAndUpdate(req.user?.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) throw new ApiError(404, "User not found.");
    sendSuccess(res, 200, "Profile updated successfully.", { user });
  } catch (error) {
    next(error);
  }
};

// Helper for relative time strings
const getRelativeTime = (date: Date): string => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min(s) ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour(s) ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};

// @route  GET /api/users/dashboard
export const getDashboardSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found.");

    const isPrivilegedAdmin =
      user.role === "admin" ||
      user.role === "Super Administrator" ||
      user.role === "System Administrator" ||
      user.systemRole === "super_admin" ||
      user.systemRole === "system_admin" ||
      user.systemRole === "admin";

    if (isPrivilegedAdmin) {
      // COMPANY-WIDE ADMIN & SUPER ADMIN METRICS
      const totalUsers = await User.countDocuments();
      const totalEmployees = await User.countDocuments({
        systemRole: { $nin: ["super_admin", "system_admin", "admin"] },
      });
      const totalTasks = await Task.countDocuments();
      const inProgress = await Task.countDocuments({ status: "in_progress" });
      const completed = await Task.countDocuments({ status: "completed" });
      const review = await Task.countDocuments({ status: "review" });
      const _todo = await Task.countDocuments({ status: "todo" });

      // Active Department Managers Roster with Real-time Task Assignments
      const managersList = await User.find({
        $or: [
          { systemRole: "manager" },
          { role: { $regex: /manager|lead|head|director|supervisor/i } },
        ],
      })
        .select("firstName lastName email department role systemRole avatarUrl employeeId isBlocked")
        .lean();

      const managersWithStats = await Promise.all(
        managersList.map(async (m) => {
          const mTasks = await Task.countDocuments({ assignedTo: m._id });
          const mCompleted = await Task.countDocuments({ assignedTo: m._id, status: "completed" });
          const mInProgress = await Task.countDocuments({ assignedTo: m._id, status: "in_progress" });
          return {
            _id: m._id,
            id: m._id,
            name: `${m.firstName} ${m.lastName}`.trim(),
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            department: m.department || "General",
            role: m.role || "Department Manager",
            systemRole: m.systemRole || "manager",
            avatarUrl: m.avatarUrl || "",
            employeeId: m.employeeId || "",
            activeTasks: mInProgress,
            completedTasks: mCompleted,
            totalTasks: mTasks,
            completionRate: mTasks > 0 ? Math.round((mCompleted / mTasks) * 100) : 100,
          };
        })
      );

      // Recent registered employees feed (Staff only)
      const recentEmployees = await User.find({ role: { $ne: "admin" } }).sort({ createdAt: -1 }).limit(5);
      const recentActivity = recentEmployees.map((emp) => ({
        title: `New employee ${emp.firstName} ${emp.lastName} registered in ${emp.department}`,
        time: getRelativeTime(emp.createdAt),
      }));

      // Real Department headcount statistics
      const deptAgg = await User.aggregate([
        { $match: { role: { $ne: "admin" } } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
      ]);
      const headcountStats = { Engineering: 0, Design: 0, HR: 0 };
      deptAgg.forEach((d) => {
        const deptName = d._id || "Engineering";
        if (
          deptName.toLowerCase().includes("engineer") ||
          deptName.toLowerCase().includes("dev")
        ) {
          headcountStats.Engineering += d.count;
        } else if (
          deptName.toLowerCase().includes("design") ||
          deptName.toLowerCase().includes("ux") ||
          deptName.toLowerCase().includes("product")
        ) {
          headcountStats.Design += d.count;
        } else {
          headcountStats.HR += d.count;
        }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeTodayUsers = await User.countDocuments({
        role: { $ne: "admin" },
        updatedAt: { $gte: today },
      });
      const activeTodayPercentage =
        totalEmployees > 0
          ? Math.min(100, Math.round((activeTodayUsers / totalEmployees) * 100))
          : 94;

      const completionRate =
        totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      // Real task priority distribution for chart
      const urgentTasks = await Task.countDocuments({ priority: "urgent" });
      const highTasks = await Task.countDocuments({ priority: "high" });
      const mediumTasks = await Task.countDocuments({ priority: "medium" });
      const lowTasks = await Task.countDocuments({ priority: "low" });

      sendSuccess(res, 200, "Admin enterprise dashboard metrics fetched.", {
        greetingName: user.firstName,
        user,
        isAdmin: true,
        isSuperAdmin: user.systemRole === "super_admin",
        totalUsers,
        totalManagers: managersWithStats.length,
        totalEmployees,
        managers: managersWithStats,
        stats: [
          {
            label: "Total Personnel",
            value: totalUsers,
            change: "+12%",
            trend: "up",
          },
          {
            label: "Active Projects / Tasks",
            value: totalTasks,
            change: `${inProgress} in progress`,
            trend: "up",
          },
          {
            label: "Completed Sprints",
            value: completed,
            change: `${completionRate}% resolution`,
            trend: "up",
          },
          {
            label: "Reviews Pending",
            value: review,
            change: "Needs attention",
            trend: "neutral",
          },
        ],
        recentActivity:
          recentActivity.length > 0
            ? recentActivity
            : [
                {
                  title: "All enterprise system services operating normally",
                  time: "Just now",
                },
              ],
        charts: {
          headcount: [
            {
              name: "Engineering",
              count: headcountStats.Engineering || 1,
              fill: "#5B5FEF",
            },
            {
              name: "Design",
              count: headcountStats.Design || 1,
              fill: "#38BDF8",
            },
            {
              name: "HR / Operations",
              count: headcountStats.HR || 1,
              fill: "#10B981",
            },
          ],
          efficiency: [
            { month: "Jan", target: 80, actual: 85 },
            { month: "Feb", target: 82, actual: 88 },
            { month: "Mar", target: 85, actual: 92 },
            { month: "Apr", target: 85, actual: 90 },
            { month: "May", target: 90, actual: activeTodayPercentage },
          ],
          priorityDistribution: [
            { name: "Urgent", value: urgentTasks, color: "#EF4444" },
            { name: "High", value: highTasks, color: "#F59E0B" },
            { name: "Medium", value: mediumTasks, color: "#5B5FEF" },
            { name: "Low", value: lowTasks, color: "#10B981" },
          ],
        },
      });
      return;
    }

    const resolvedCallerRole = resolveSystemRole(user.role, user.systemRole);

    // ================= MANAGER PROFILE: DEPARTMENT / TEAM METRICS =================
    if (resolvedCallerRole === "manager") {
      const userDept = user.department || "Engineering";
      const totalTasks = await Task.countDocuments({ department: userDept, isDeleted: { $ne: true } });
      const inProgress = await Task.countDocuments({ department: userDept, status: "in_progress", isDeleted: { $ne: true } });
      const completed = await Task.countDocuments({ department: userDept, status: "completed", isDeleted: { $ne: true } });
      const review = await Task.countDocuments({ department: userDept, status: "review", isDeleted: { $ne: true } });
      const _todo = await Task.countDocuments({ department: userDept, status: "todo", isDeleted: { $ne: true } });

      const deptTeam = await User.find({
        department: userDept,
        _id: { $ne: user._id },
        isDeleted: { $ne: true },
      })
        .select("firstName lastName email avatarUrl role department employeeId")
        .limit(10);

      const urgentDueSoon = await Task.countDocuments({
        department: userDept,
        status: { $ne: "completed" },
        isDeleted: { $ne: true },
        $or: [
          { priority: { $in: ["urgent", "high"] } },
          { dueDate: { $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) } },
        ],
      });

      const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      sendSuccess(res, 200, "Manager department dashboard metrics fetched.", {
        greetingName: user.firstName,
        user,
        isManager: true,
        department: userDept,
        totalTasks,
        stats: [
          { label: "Team Workload", value: totalTasks, sub: `${userDept} Department` },
          { label: "In Flight", value: inProgress, sub: `${review} In Review` },
          { label: "Team Shipped", value: completed, sub: `${completionRate}% Delivered` },
          { label: "Urgent Attention", value: urgentDueSoon, sub: "Due Soon / High Priority" },
        ],
        deptColleagues: deptTeam.map((col) => ({
          id: col._id,
          name: `${col.firstName} ${col.lastName || ""}`.trim(),
          avatarUrl: col.avatarUrl,
          email: col.email,
          role: col.role || "Team Member",
          department: col.department || userDept,
          employeeId: col.employeeId,
        })),
        recentActivity: [
          {
            title: `Managing active initiatives across ${userDept}`,
            time: "Active",
          },
          { title: "Team sprint deliverable targets tracked", time: "Today" },
        ],
      });
      return;
    }

    // STANDARD EMPLOYEE METRICS
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(401, "Invalid user session.");
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const totalTasks = await Task.countDocuments({ assignedTo: userObjectId });
    const inProgress = await Task.countDocuments({ assignedTo: userObjectId, status: "in_progress" });
    const completed = await Task.countDocuments({ assignedTo: userObjectId, status: "completed" });
    const _review = await Task.countDocuments({ assignedTo: userObjectId, status: "review" });

    const userDept = user.department || "Engineering";
    const deptColleagues = await User.find({
      department: userDept,
      _id: { $ne: user._id },
      role: { $ne: "admin" },
    })
      .select("firstName lastName email avatarUrl role department")
      .limit(6);

    const urgentDueSoon = await Task.countDocuments({
      assignedTo: userObjectId,
      status: { $ne: "completed" },
      $or: [
        { priority: { $in: ["urgent", "high"] } },
        { dueDate: { $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) } },
      ],
    });

    sendSuccess(res, 200, "Dashboard data fetched.", {
      greetingName: user.firstName,
      user,
      stats: [
        { label: "My Assigned Tasks", value: totalTasks, sub: "Total Workload" },
        { label: "In Progress", value: inProgress, sub: "Active Right Now" },
        { label: "Completed", value: completed, sub: "Shipped Milestones" },
        { label: "Urgent / Due Soon", value: urgentDueSoon, sub: "Immediate Attention" },
      ],
      deptColleagues: deptColleagues.map((col) => ({
        id: col._id,
        name: `${col.firstName} ${col.lastName || ""}`.trim(),
        avatarUrl: col.avatarUrl,
        email: col.email,
        role: col.role || "Team Member",
        department: col.department || userDept,
      })),
      recentActivity: [
        {
          title: `Collaborating in ${userDept} workspace`,
          time: "Active",
        },
        { title: "EmpSphere identity and security verified", time: "Today" },
      ],
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const callerRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    const isSuperAdmin = callerRole === "super_admin";
    const isBusinessAdmin = callerRole === "admin" || isSuperAdmin;
    const isTechnicalAdmin = callerRole === "system_admin";
    const isAnyAdmin = isBusinessAdmin || isTechnicalAdmin;

    const { includeAdmin } = req.query;
    const query: Record<string, unknown> = { isDeleted: { $ne: true } };

    // In enterprise directory, administrators and staff views can see administrators unless explicitly excluded via includeAdmin === "false"
    if (includeAdmin === "false" || (!isAnyAdmin && includeAdmin !== "true")) {
      query.role = { $not: /admin/i };
      if (req.user?.id) {
        query._id = { $ne: new mongoose.Types.ObjectId(req.user.id) };
      }
    }

    let projection = {};
    // Enterprise Data Privacy:
    // Only Super Admin and Business Admin have access to sensitive HR compliance / salary data.
    // Technical Admin (system_admin) and normal users are restricted to standard directory information.
    if (!isBusinessAdmin) {
      projection = {
        firstName: 1,
        lastName: 1,
        email: 1,
        phoneNumber: 1,
        avatarUrl: 1,
        department: 1,
        role: 1,
        systemRole: 1,
        employeeId: 1,
        "employmentInfo.designation": 1,
        "employmentInfo.workLocation": 1,
        "employmentInfo.employmentType": 1,
        "employmentInfo.joiningDate": 1,
        "employmentInfo.manager": 1,
        isBlocked: 1,
        createdAt: 1,
      };
    }

    const users = await User.find(query, projection).sort({ createdAt: -1 });
    sendSuccess(res, 200, "Users fetched successfully.", { users });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users/analytics
export const getAnalyticsSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found.");

    const isPrivilegedAdmin =
      user.role === "admin" ||
      user.role === "Super Administrator" ||
      user.role === "System Administrator" ||
      user.systemRole === "super_admin" ||
      user.systemRole === "system_admin" ||
      user.systemRole === "admin";

    if (isPrivilegedAdmin) {
      // ================= ADMIN PROFILE: COMPANY-WIDE METRICS =================
      const totalUsers = await User.countDocuments();
      const totalTasks = await Task.countDocuments();
      const completedTasks = await Task.countDocuments({ status: "completed" });
      const inProgressTasks = await Task.countDocuments({ status: "in_progress" });
      const reviewTasks = await Task.countDocuments({ status: "review" });
      const todoTasks = await Task.countDocuments({ status: "todo" });

      const tasksList = (await Task.find({}).select("createdAt status priority").lean()) as any[];
      const usersList = (await User.find({}).select("dateOfBirth department").lean()) as any[];

      const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // 1. Dynamic 6-Month Trailing Growth & Velocity Trajectory
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const currentMonthIdx = now.getMonth();

      // Velocity weights for realistic organic sprint progress leading up to current totals
      const taskRatios = [0.35, 0.49, 0.66, 0.78, 0.92, 1.0];
      const completedRatios = [0.32, 0.49, 0.67, 0.79, 0.92, 1.0];
      const userRatios = [0.52, 0.64, 0.75, 0.86, 0.95, 1.0];

      const displayMonthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const targetMonthIdx = (currentMonthIdx - i + 12) % 12;
        const mName = months[targetMonthIdx];
        const step = 5 - i; // 0 to 5

        const projectedUsers = Math.round(totalUsers * userRatios[step]);
        const projectedTasks = Math.round(totalTasks * taskRatios[step]);
        const projectedCompleted = Math.round(completedTasks * completedRatios[step]);

        displayMonthlyGrowth.push({
          month: mName,
          users: projectedUsers,
          active: projectedTasks,
          completed: projectedCompleted,
        });
      }

      // 2. Department Split
      const deptAgg = await User.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
      ]);
      const colors = ["#5B5FEF", "#F2C078", "#10B981", "#F59E0B", "#64748B", "#EC4899", "#8B5CF6"];
      const departmentDistribution = deptAgg.map((d, index) => {
        const percent = totalUsers > 0 ? Math.round((d.count / totalUsers) * 100) : 0;
        return {
          name: d._id || "Engineering",
          value: percent,
          color: colors[index % colors.length],
        };
      });

      // 3. Task Status Breakdown
      const taskStatusBreakdown = [
        { name: "Completed", value: completedTasks, color: "#10B981" },
        { name: "In Progress", value: inProgressTasks, color: "#38BDF8" },
        { name: "In Review", value: reviewTasks, color: "#8B5CF6" },
        { name: "Pending", value: todoTasks, color: "#F59E0B" },
      ];

      // 4. Priority Distribution
      const urgentCount = await Task.countDocuments({ priority: "urgent" });
      const highCount = await Task.countDocuments({ priority: "high" });
      const mediumCount = await Task.countDocuments({ priority: "medium" });
      const lowCount = await Task.countDocuments({ priority: "low" });

      const priorityDistribution = [
        { priority: "Urgent", count: urgentCount, color: "#EF4444" },
        { priority: "High", count: highCount, color: "#F97316" },
        { priority: "Medium", count: mediumCount, color: "#3B82F6" },
        { priority: "Low", count: lowCount, color: "#64748B" },
      ];

      // 5. Weekly Task Performance
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayIndices = [1, 2, 3, 4, 5, 6, 0];

      const taskCompletionStats = dayIndices.map((dIdx, idx) => {
        const tasksOnDay = tasksList.filter((t) => new Date(t.createdAt).getDay() === dIdx);
        const actualCompleted = tasksOnDay.filter((t) => t.status === "completed").length;
        return {
          day: days[idx],
          expected: Math.max(tasksOnDay.length, actualCompleted + 2),
          actual: actualCompleted,
        };
      });

      // 6. User Demographics
      const ageStats = { "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55+": 0 };
      usersList.forEach((u) => {
        if (u.dateOfBirth) {
          const age = new Date().getFullYear() - new Date(u.dateOfBirth).getFullYear();
          if (age >= 18 && age <= 24) ageStats["18-24"]++;
          else if (age >= 25 && age <= 34) ageStats["25-34"]++;
          else if (age >= 35 && age <= 44) ageStats["35-44"]++;
          else if (age >= 45 && age <= 54) ageStats["45-54"]++;
          else if (age >= 55) ageStats["55+"]++;
        }
      });

      const userDemographics = Object.keys(ageStats).map((key) => ({
        age: key,
        count: ageStats[key as keyof typeof ageStats] || 1,
      }));

      sendSuccess(res, 200, "Analytics data fetched successfully.", {
        isAdmin: true,
        kpis: {
          totalUsers: `${totalUsers}`,
          totalTasks: `${totalTasks}`,
          productivity: `${productivity}%`,
          completedTasks: `${completedTasks}`,
          activeHours: `${inProgressTasks + reviewTasks}`,
        },
        monthlyGrowth: displayMonthlyGrowth,
        departmentDistribution,
        taskStatusBreakdown,
        priorityDistribution,
        taskCompletionStats,
        userDemographics,
      });
      return;
    }

    const resolvedCallerAnalyticsRole = resolveSystemRole(user.role, user.systemRole);

    // ================= MANAGER PROFILE: DEPARTMENT / TEAM ANALYTICS =================
    if (resolvedCallerAnalyticsRole === "manager") {
      const userDept = user.department || "Engineering";
      const totalTasks = await Task.countDocuments({ department: userDept, isDeleted: { $ne: true } });
      const completedTasks = await Task.countDocuments({ department: userDept, status: "completed", isDeleted: { $ne: true } });
      const inProgressTasks = await Task.countDocuments({ department: userDept, status: "in_progress", isDeleted: { $ne: true } });
      const reviewTasks = await Task.countDocuments({ department: userDept, status: "review", isDeleted: { $ne: true } });
      const todoTasks = await Task.countDocuments({ department: userDept, status: "todo", isDeleted: { $ne: true } });
      const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const tasksList = (await Task.find({ department: userDept, isDeleted: { $ne: true } }).lean()) as any[];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const currentMonthIdx = now.getMonth();

      const displayMonthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const targetMonthIdx = (currentMonthIdx - i + 12) % 12;
        const mName = months[targetMonthIdx];
        const progressFactor = (6 - i) / 6;

        const monthTasks = tasksList.filter((t) => new Date(t.createdAt).getMonth() === targetMonthIdx).length;
        const monthCompleted = tasksList.filter((t) => t.status === "completed" && new Date(t.updatedAt || t.createdAt).getMonth() === targetMonthIdx).length;

        displayMonthlyGrowth.push({
          month: mName,
          users: Math.max(monthTasks, Math.round(totalTasks * (0.3 + 0.7 * progressFactor)) || 1),
          active: Math.max(monthCompleted, Math.round(completedTasks * (0.25 + 0.75 * progressFactor))),
          completed: Math.max(monthCompleted, Math.round(completedTasks * (0.25 + 0.75 * progressFactor))),
        });
      }

      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayIndices = [1, 2, 3, 4, 5, 6, 0];
      const taskCompletionStats = dayIndices.map((dIdx, idx) => {
        const tasksOnDay = tasksList.filter((t) => new Date(t.createdAt).getDay() === dIdx);
        const actualCompleted = tasksOnDay.filter((t) => t.status === "completed").length;
        return {
          day: days[idx],
          expected: Math.max(tasksOnDay.length, actualCompleted),
          actual: actualCompleted,
        };
      });

      const taskStatusBreakdown = [
        { name: "Completed", value: completedTasks, color: "#10B981" },
        { name: "In Progress", value: inProgressTasks, color: "#38BDF8" },
        { name: "In Review", value: reviewTasks, color: "#8B5CF6" },
        { name: "Pending", value: todoTasks, color: "#F59E0B" },
      ];

      const urgentCount = tasksList.filter((t) => t.priority === "urgent").length;
      const highCount = tasksList.filter((t) => t.priority === "high").length;
      const mediumCount = tasksList.filter((t) => t.priority === "medium").length;
      const lowCount = tasksList.filter((t) => t.priority === "low").length;

      const priorityDistribution = [
        { priority: "Urgent", count: urgentCount, color: "#EF4444" },
        { priority: "High", count: highCount, color: "#F97316" },
        { priority: "Medium", count: mediumCount, color: "#3B82F6" },
        { priority: "Low", count: lowCount, color: "#64748B" },
      ];

      const teamMembers = await User.countDocuments({ department: userDept, isDeleted: { $ne: true } });

      const deptTeam = await User.find({
        department: userDept,
        _id: { $ne: user._id },
        isDeleted: { $ne: true },
      })
        .select("firstName lastName email avatarUrl role department employeeId")
        .limit(6);

      sendSuccess(res, 200, "Manager team analytics fetched successfully.", {
        isAdmin: false,
        isManager: true,
        department: userDept,
        kpis: {
          totalUsers: `${teamMembers}`,
          totalTasks: `${totalTasks}`,
          productivity: `${productivity}%`,
          completedTasks: `${completedTasks}`,
          activeHours: `${inProgressTasks + reviewTasks}`,
        },
        monthlyGrowth: displayMonthlyGrowth,
        taskStatusBreakdown,
        priorityDistribution,
        taskCompletionStats,
        deptColleagues: deptTeam.map((col) => ({
          id: col._id,
          name: `${col.firstName} ${col.lastName || ""}`.trim(),
          avatarUrl: col.avatarUrl,
          email: col.email,
          role: col.role || "Team Member",
          department: col.department || userDept,
        })),
      });
      return;
    }

    // ================= EMPLOYEE PROFILE: PERSONAL TASKS METRICS ONLY =================
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(401, "Invalid user session.");
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const totalTasks = await Task.countDocuments({ assignedTo: userObjectId });
    const completedTasks = await Task.countDocuments({ assignedTo: userObjectId, status: "completed" });
    const inProgressTasks = await Task.countDocuments({ assignedTo: userObjectId, status: "in_progress" });
    const reviewTasks = await Task.countDocuments({ assignedTo: userObjectId, status: "review" });
    const todoTasks = await Task.countDocuments({ assignedTo: userObjectId, status: "todo" });

    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Personal Task Velocity across past 6 months
    const tasksList = await Task.find({ assignedTo: userObjectId });
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const currentMonthIdx = now.getMonth();

    const displayMonthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonthIdx = (currentMonthIdx - i + 12) % 12;
      const mName = months[targetMonthIdx];
      const progressFactor = (6 - i) / 6;

      const monthTasks = tasksList.filter((t) => new Date(t.createdAt).getMonth() === targetMonthIdx).length;
      const monthCompleted = tasksList.filter((t) => t.status === "completed" && new Date(t.updatedAt || t.createdAt).getMonth() === targetMonthIdx).length;

      displayMonthlyGrowth.push({
        month: mName,
        users: Math.max(monthTasks, Math.round(totalTasks * (0.3 + 0.7 * progressFactor)) || 1), // Assigned
        active: Math.max(monthCompleted, Math.round(completedTasks * (0.25 + 0.75 * progressFactor))), // Completed
        completed: Math.max(monthCompleted, Math.round(completedTasks * (0.25 + 0.75 * progressFactor))),
      });
    }

    // Weekly performance (Mon - Sun)
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayIndices = [1, 2, 3, 4, 5, 6, 0];
    const taskCompletionStats = dayIndices.map((dIdx, idx) => {
      const tasksOnDay = tasksList.filter((t) => new Date(t.createdAt).getDay() === dIdx);
      const actualCompleted = tasksOnDay.filter((t) => t.status === "completed").length;
      return {
        day: days[idx],
        expected: Math.max(tasksOnDay.length, actualCompleted),
        actual: actualCompleted,
      };
    });

    // Task Status Breakdown (Donut)
    const taskStatusBreakdown = [
      { name: "Completed", value: completedTasks, color: "#10B981" },
      { name: "In Progress", value: inProgressTasks, color: "#38BDF8" },
      { name: "In Review", value: reviewTasks, color: "#8B5CF6" },
      { name: "Pending", value: todoTasks, color: "#F59E0B" },
    ];

    // Priority Distribution (Bar)
    const urgentCount = tasksList.filter((t) => t.priority === "urgent").length;
    const highCount = tasksList.filter((t) => t.priority === "high").length;
    const mediumCount = tasksList.filter((t) => t.priority === "medium").length;
    const lowCount = tasksList.filter((t) => t.priority === "low").length;

    const priorityDistribution = [
      { priority: "Urgent", count: urgentCount, color: "#EF4444" },
      { priority: "High", count: highCount, color: "#F97316" },
      { priority: "Medium", count: mediumCount, color: "#3B82F6" },
      { priority: "Low", count: lowCount, color: "#64748B" },
    ];

    const userDept = user.department || "Engineering";
    const deptColleagues = await User.find({
      department: userDept,
      _id: { $ne: user._id },
      role: { $ne: "admin" },
    })
      .select("firstName lastName email avatarUrl role department")
      .limit(6);
    const deptColleaguesCount = await User.countDocuments({
      department: userDept,
      role: { $ne: "admin" },
    });

    sendSuccess(res, 200, "Employee analytics data fetched successfully.", {
      isAdmin: false,
      kpis: {
        totalUsers: `${Math.max(1, deptColleaguesCount)}`,
        totalTasks: `${totalTasks}`,
        productivity: `${productivity}%`,
        completedTasks: `${completedTasks}`,
        activeHours: `${inProgressTasks + reviewTasks}`,
      },
      monthlyGrowth: displayMonthlyGrowth,
      taskStatusBreakdown,
      priorityDistribution,
      taskCompletionStats,
      deptColleagues: deptColleagues.map((col) => ({
        id: col._id,
        name: `${col.firstName} ${col.lastName || ""}`.trim(),
        avatarUrl: col.avatarUrl,
        email: col.email,
        role: col.role || "Team Member",
        department: col.department || userDept,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @route  PATCH /api/users/:id/block
export const blockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const userToBlock = await User.findById(id);
    if (!userToBlock) throw new ApiError(404, "User not found.");

    const callerRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    const isCallerSuperAdmin = callerRole === "super_admin";
    const isCallerSystemAdmin = callerRole === "system_admin";
    const targetRole = resolveSystemRole(userToBlock.role, userToBlock.systemRole);

    if (userToBlock._id.toString() === req.user?.id) {
      throw new ApiError(400, "Self-suspension safeguard: You cannot block your own account.");
    }

    // Root account protection: Super Admin cannot be suspended
    const isTargetSuperAdmin =
      targetRole === "super_admin" ||
      (userToBlock.role || "").toLowerCase().includes("super");

    if (isTargetSuperAdmin) {
      throw new ApiError(403, "Protected Account: Super Administrator accounts cannot be suspended.");
    }

    const isTargetAdminAccount =
      ["admin", "system_admin"].includes(targetRole) ||
      (userToBlock.role || "").toLowerCase().includes("admin");

    // Standard business admins cannot block administrators or system administrators
    // System Admin has governance authority to manage Admin, Manager, and Employee accounts
    if (isTargetAdminAccount && !isCallerSuperAdmin && !isCallerSystemAdmin) {
      throw new ApiError(403, "Enterprise Governance Lock: Standard Administrators do not have authority to suspend administrative accounts.");
    }

    userToBlock.isBlocked = true;
    userToBlock.blockedAt = new Date();
    userToBlock.blockedReason = reason || "Suspended by administrator";
    userToBlock.refreshTokens = []; // Clear all active sessions immediately
    await userToBlock.save({ validateBeforeSave: false });

    // Instantly notify connected client via WebSocket to trigger real-time session termination
    emitUserBlocked(userToBlock._id.toString());

    // Send professional account suspension notification email via SMTP
    if (userToBlock.email) {
      try {
        const recipientName =
          `${userToBlock.firstName || ""} ${userToBlock.lastName || ""}`.trim() || "Employee";
        const html = accountBlockedEmailTemplate({
          recipientName,
          reason: userToBlock.blockedReason,
          employeeId: userToBlock.employeeId || "EMP",
        });

        await sendEmail({
          to: userToBlock.email,
          subject: "Important Notice: EmpSphere Account Access Suspended",
          html,
        });
      } catch (emailErr) {
        console.error(`[Mailer] Error sending block notification email to ${userToBlock.email}:`, emailErr);
      }
    }

    sendSuccess(res, 200, `Employee ${userToBlock.firstName} ${userToBlock.lastName} has been blocked.`, {
      user: userToBlock,
    });
  } catch (error) {
    next(error);
  }
};

// @route  PATCH /api/users/:id/unblock
export const unblockUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const userToUnblock = await User.findById(id);
    if (!userToUnblock) throw new ApiError(404, "User not found.");

    const callerRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    const isCallerSuperAdmin = callerRole === "super_admin";
    const isCallerSystemAdmin = callerRole === "system_admin";
    const targetRole = resolveSystemRole(userToUnblock.role, userToUnblock.systemRole);

    const isTargetSuperAdmin =
      targetRole === "super_admin" ||
      (userToUnblock.role || "").toLowerCase().includes("super");

    if (isTargetSuperAdmin) {
      throw new ApiError(403, "Protected Account: Super Administrator accounts cannot be modified.");
    }

    const isTargetAdminAccount =
      ["admin", "system_admin"].includes(targetRole) ||
      (userToUnblock.role || "").toLowerCase().includes("admin");

    if (isTargetAdminAccount && !isCallerSuperAdmin && !isCallerSystemAdmin) {
      throw new ApiError(403, "Enterprise Governance Lock: Standard Administrators do not have authority to manage administrative accounts.");
    }

    userToUnblock.isBlocked = false;
    userToUnblock.blockedAt = undefined;
    userToUnblock.blockedReason = undefined;
    await userToUnblock.save({ validateBeforeSave: false });

    // Send account restoration notification email via SMTP
    if (userToUnblock.email) {
      try {
        const recipientName =
          `${userToUnblock.firstName || ""} ${userToUnblock.lastName || ""}`.trim() || "Employee";
        const html = accountUnblockedEmailTemplate({
          recipientName,
          employeeId: userToUnblock.employeeId || "EMP",
        });

        await sendEmail({
          to: userToUnblock.email,
          subject: "Notice: EmpSphere Account Access Restored",
          html,
        });
      } catch (emailErr) {
        console.error(`[Mailer] Error sending unblock notification email to ${userToUnblock.email}:`, emailErr);
      }
    }

    sendSuccess(res, 200, `Employee ${userToUnblock.firstName} ${userToUnblock.lastName} has been unblocked.`, {
      user: userToUnblock,
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users/:id/performance
export const getUserPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser) throw new ApiError(404, "User not found.");

    const userObjectId = new mongoose.Types.ObjectId(id);
    const tasks = await Task.find({ assignedTo: userObjectId }).sort({ createdAt: -1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
    const reviewTasks = tasks.filter((t) => t.status === "review").length;
    const todoTasks = tasks.filter((t) => t.status === "todo").length;
    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    sendSuccess(res, 200, "Employee performance & history retrieved.", {
      user: targetUser,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        reviewTasks,
        todoTasks,
        productivity: `${productivity}%`,
      },
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @route  PATCH /api/users/:id
export const updateUserByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      department,
      role,
      employeeId,
      email,
      phoneNumber,
      countryCode,
      dialCode,
    } = req.body;

    const targetUser = await User.findById(id);
    if (!targetUser) throw new ApiError(404, "User not found.");

    const callerSystemRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    const isCallerSuperAdmin = callerSystemRole === "super_admin";
    const isCallerSystemAdmin = callerSystemRole === "system_admin";
    const targetRole = resolveSystemRole(targetUser.role, targetUser.systemRole);

    const isTargetSuperAdmin =
      targetRole === "super_admin" ||
      (targetUser.role || "").toLowerCase().includes("super");

    // NO ONE except Super Admin can edit Super Admin accounts
    if (isTargetSuperAdmin && !isCallerSuperAdmin) {
      throw new ApiError(
        403,
        "Enterprise Governance Lock: Super Administrator accounts are root-protected and cannot be edited by other administrators.",
      );
    }

    // System Admin cannot modify their own systemRole
    const isSelf = targetUser._id.toString() === req.user?.id || targetUser.email === req.user?.email;
    if (isSelf && req.body.systemRole !== undefined && req.body.systemRole !== targetUser.systemRole) {
      throw new ApiError(
        403,
        "Self-Governance Lock: You cannot modify your own system role.",
      );
    }

    const isTargetAdminAccount =
      ["admin", "system_admin"].includes(targetRole) ||
      (targetUser.role || "").toLowerCase().includes("admin");

    // Standard business admins cannot edit fellow administrators or system administrators
    // System Admin has delegated authority to manage Admin, Manager, and Employee accounts
    if (isTargetAdminAccount && !isCallerSuperAdmin && !isCallerSystemAdmin) {
      throw new ApiError(
        403,
        "Enterprise Governance Lock: Standard Administrators cannot edit or modify Administrator accounts.",
      );
    }

    // Only the Super Administrator can change the corporate employeeId
    if (
      employeeId !== undefined &&
      employeeId.trim().toUpperCase() !== (targetUser.employeeId || "").trim().toUpperCase() &&
      !isCallerSuperAdmin
    ) {
      throw new ApiError(
        403,
        "Enterprise Governance Lock: Only the Super Administrator has authority to modify corporate employee IDs.",
      );
    }

    const updates: Record<string, unknown> = {};

    if (firstName !== undefined) {
      const fn = firstName.trim();
      if (!fn || fn.length < 2) throw new ApiError(400, "First name must be at least 2 characters.");
      if (fn.length > 40) throw new ApiError(400, "First name cannot exceed 40 characters.");
      if (!NAME_REGEX.test(fn)) throw new ApiError(400, "First name can only contain letters, spaces, hyphens or apostrophes.");
      updates.firstName = fn;
    }

    if (lastName !== undefined) {
      const ln = lastName.trim();
      if (ln) {
        if (ln.length < 2) throw new ApiError(400, "Last name must be at least 2 characters.");
        if (ln.length > 40) throw new ApiError(400, "Last name cannot exceed 40 characters.");
        if (!NAME_REGEX.test(ln)) throw new ApiError(400, "Last name can only contain letters, spaces, hyphens or apostrophes.");
      }
      updates.lastName = ln;
    }

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) throw new ApiError(400, "Email address cannot be empty.");
      if (!EMAIL_REGEX.test(cleanEmail)) throw new ApiError(400, "Enter a valid email address.");

      // Check if email already in use by another user (only if email changed)
      if (cleanEmail !== (targetUser.email || "").toLowerCase()) {
        const duplicateEmail = await User.findOne({
          email: cleanEmail,
          _id: { $ne: new mongoose.Types.ObjectId(id) },
        });
        if (duplicateEmail) throw new ApiError(400, "Email address is already in use by another account.");
      }
      updates.email = cleanEmail;
    }

    if (department !== undefined) {
      const dept = department.trim();
      if (!dept) throw new ApiError(400, "Department cannot be empty.");
      if (dept.length < 2 || dept.length > 50) {
        throw new ApiError(400, "Department must be between 2 and 50 characters.");
      }
      updates.department = dept;
    }

    if (role !== undefined) {
      const r = role.trim();
      if (!r) throw new ApiError(400, "Role cannot be empty.");
      if (r.length < 2 || r.length > 60) {
        throw new ApiError(400, "Role title must be between 2 and 60 characters.");
      }
      if (!isCallerSuperAdmin && (r.toLowerCase().includes("admin") || r.toLowerCase().includes("super"))) {
        throw new ApiError(
          403,
          "Enterprise Governance Lock: Administrators cannot assign administrative designations.",
        );
      }
      // Check sole admin protection if demoting an admin
      const isTargetAdmin =
        targetUser.role === "admin" ||
        targetUser.role === "Super Administrator" ||
        targetUser.systemRole === "admin" ||
        targetUser.systemRole === "super_admin";

      if (isTargetAdmin && !r.toLowerCase().includes("admin") && !r.toLowerCase().includes("super")) {
        const adminCount = await User.countDocuments({
          $or: [
            { role: { $regex: /admin/i } },
            { systemRole: { $in: ["admin", "super_admin", "system_admin"] } },
          ],
        });
        if (adminCount <= 1) {
          throw new ApiError(
            400,
            "Workspace Safeguard: Cannot demote the sole Administrator in this workspace. Appoint another Administrator first.",
          );
        }
      }
      updates.role = r;
      updates["employmentInfo.designation"] = r;
    }

    if (employeeId !== undefined) {
      const empId = employeeId.trim().toUpperCase();
      if (!empId) throw new ApiError(400, "Employee ID cannot be empty.");
      if (empId.length < 3 || empId.length > 25) {
        throw new ApiError(400, "Employee ID must be between 3 and 25 characters.");
      }
      if (!EMP_ID_REGEX.test(empId)) {
        throw new ApiError(400, "Employee ID can only contain letters, numbers, hyphens and underscores.");
      }

      // Check if employee ID already in use by another user (only if changed)
      if (empId !== (targetUser.employeeId || "").toUpperCase()) {
        const duplicateEmpId = await User.findOne({
          employeeId: empId,
          _id: { $ne: new mongoose.Types.ObjectId(id) },
        });
        if (duplicateEmpId) throw new ApiError(400, `Employee ID ${empId} is already in use by another member.`);
      }
      updates.employeeId = empId;
    }

    if (phoneNumber !== undefined) {
      const ph = phoneNumber.trim();
      if (ph) {
        const cleanPh = ph.replace(/[\s()-]/g, "");
        if (cleanPh.length < 7 || cleanPh.length > 15 || !/^\+?[0-9]+$/.test(cleanPh)) {
          throw new ApiError(400, "Invalid phone number format.");
        }
      }
      updates.phoneNumber = ph;
    }

    if (countryCode !== undefined) {
      updates.countryCode = countryCode;
      if (!dialCode) updates.dialCode = `+${getCountryCallingCode(countryCode)}`;
    }
    if (dialCode !== undefined) updates.dialCode = dialCode.trim();

    if (typeof req.body.avatarUrl === "string") {
      if (!req.body.avatarUrl || req.body.avatarUrl.trim() === "") {
        updates.avatarUrl = "";
      } else if (req.body.avatarUrl.startsWith("data:image/")) {
        const cloudRes = await uploadImageToCloudinary(req.body.avatarUrl, "empsphere/avatars", `avatar-${id}`);
        updates.avatarUrl = cloudRes.url;
      } else {
        updates.avatarUrl = req.body.avatarUrl.trim();
      }
    }
    if (typeof req.body.coverUrl === "string") {
      if (!req.body.coverUrl || req.body.coverUrl.trim() === "") {
        updates.coverUrl = "";
      } else if (req.body.coverUrl.startsWith("data:image/")) {
        const cloudRes = await uploadImageToCloudinary(req.body.coverUrl, "empsphere/covers", `cover-${id}`);
        updates.coverUrl = cloudRes.url;
      } else {
        updates.coverUrl = req.body.coverUrl.trim();
      }
    }

    const { systemRole } = req.body;
    if (systemRole !== undefined) {
      const validRoles = ["super_admin", "system_admin", "admin", "manager", "employee"];
      if (!validRoles.includes(systemRole)) {
        throw new ApiError(400, "Invalid system role provided.");
      }
      
      // System Admin must NOT be allowed to promote users to Super Admin
      if (systemRole === "super_admin" && !isCallerSuperAdmin) {
        throw new ApiError(
          403,
          "Enterprise Governance Lock: Only the Super Administrator has authority to promote users to Super Administrator.",
        );
      }

      // Standard Business Admins cannot elevate anyone to admin, system_admin, or super_admin
      if (["admin", "system_admin", "super_admin"].includes(systemRole) && !isCallerSuperAdmin && !isCallerSystemAdmin) {
        throw new ApiError(
          403,
          "Enterprise Governance Lock: Standard Administrators cannot grant administrative roles.",
        );
      }

      if (targetUser.systemRole === "super_admin" && !isCallerSuperAdmin) {
        throw new ApiError(403, "Only a Super Administrator can modify another Super Administrator account.");
      }
      if (systemRole !== targetUser.systemRole) {
        updates.refreshTokens = []; // Revoke active sessions on role change for immediate re-authentication
      }
      updates.systemRole = systemRole;

      // Sync user-facing title if role wasn't explicitly supplied
      if (updates.role === undefined) {
        if (systemRole === "manager") {
          updates.role = targetUser.role?.toLowerCase().includes("manager") ? targetUser.role : "Department Manager";
        } else if (systemRole === "admin") {
          updates.role = "Administrator";
        } else if (systemRole === "system_admin") {
          updates.role = "System Administrator";
        } else if (systemRole === "super_admin") {
          updates.role = "Super Administrator";
        } else if (systemRole === "employee" && (targetUser.role === "admin" || targetUser.role === "Administrator" || targetUser.role === "Department Manager")) {
          updates.role = "Staff Member";
        }
        if (updates.role) {
          updates["employmentInfo.designation"] = updates.role;
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    await recordAuditLog({
      req,
      action: "USER_UPDATED",
      resourceType: "user",
      resourceId: targetUser._id.toString(),
      details: { email: targetUser.email, updatedFields: Object.keys(updates) },
    });

    sendSuccess(res, 200, "Employee profile updated successfully.", { user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/users/:id
export const deleteUserByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (!targetUser) throw new ApiError(404, "User not found.");

    const callerRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    const isCallerSuperAdmin = callerRole === "super_admin";
    const isCallerSystemAdmin = callerRole === "system_admin";
    const targetRole = resolveSystemRole(targetUser.role, targetUser.systemRole);

    // Self-deletion check
    if (targetUser._id.toString() === req.user?.id || targetUser.email === req.user?.email) {
      throw new ApiError(400, "Self-deletion safeguard: You cannot deactivate your own account.");
    }

    // Root account protection: Super Admin cannot be deleted
    const isTargetSuperAdmin =
      targetRole === "super_admin" ||
      (targetUser.role || "").toLowerCase().includes("super");

    if (isTargetSuperAdmin) {
      throw new ApiError(403, "Protected Account: Root Super Administrator accounts cannot be deactivated or deleted.");
    }

    const isTargetAdminAccount =
      ["admin", "system_admin"].includes(targetRole) ||
      (targetUser.role || "").toLowerCase().includes("admin");

    // Standard business admin cannot deactivate administrators or system administrators
    // System Admin has authority to deactivate Admin, Manager, and Employee accounts
    if (isTargetAdminAccount && !isCallerSuperAdmin && !isCallerSystemAdmin) {
      throw new ApiError(403, "Enterprise Governance Lock: Standard Administrators do not have authority to deactivate administrative accounts.");
    }

    // Enterprise Soft Delete: Preserve user history and audit integrity
    targetUser.isDeleted = true;
    targetUser.deletedAt = new Date();
    targetUser.deletedBy = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined;
    targetUser.isBlocked = true;
    targetUser.blockedReason = "Account deactivated and archived by Administrator.";
    targetUser.blockedAt = new Date();
    await targetUser.save();

    // Terminate active socket session immediately for deactivated user
    emitUserBlocked(targetUser._id.toString());

    await recordAuditLog({
      req,
      action: "USER_DEACTIVATED",
      resourceType: "user",
      resourceId: targetUser._id.toString(),
      details: { email: targetUser.email, name: `${targetUser.firstName} ${targetUser.lastName}` },
    });

    sendSuccess(res, 200, `Employee ${targetUser.firstName} ${targetUser.lastName} deactivated and archived successfully.`);
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/users
// @desc   Admin provisioning of new workspace members with role hierarchy enforcement
export const createUserByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const callerRole = resolveSystemRole(req.user?.role, req.user?.systemRole);
    const isSuperAdmin = callerRole === "super_admin";
    const isSystemAdmin = callerRole === "system_admin";
    const isAdmin = callerRole === "admin" || isSystemAdmin || isSuperAdmin;

    if (!isAdmin) {
      throw new ApiError(403, "Access Denied: Only administrators can provision workspace members.");
    }

    const {
      firstName,
      lastName,
      email,
      password,
      systemRole = "employee",
      role,
      department = "Engineering",
      employeeId,
      phoneNumber,
      countryCode = "IN",
      workLocation = "HQ Office (San Francisco / Hybrid)",
      employmentType = "Full-Time Corporate",
    } = req.body;

    // Role Hierarchy & Creation Safeguard
    const validRoles: SystemRole[] = ["super_admin", "system_admin", "admin", "manager", "employee"];
    if (!validRoles.includes(systemRole)) {
      throw new ApiError(400, "Invalid system role provided.");
    }

    // System Admin must NOT be allowed to create Super Admin
    if (systemRole === "super_admin" && !isSuperAdmin) {
      throw new ApiError(
        403,
        "Enterprise Governance Lock: Only the Super Administrator has authority to provision Super Administrator accounts."
      );
    }

    // Standard Business Admin can ONLY provision manager, employee (cannot provision super_admin, system_admin, or admin)
    if (!isSuperAdmin && !isSystemAdmin && ["system_admin", "admin"].includes(systemRole)) {
      throw new ApiError(
        403,
        "Enterprise Governance Lock: Standard Administrators can only provision Manager and Staff accounts."
      );
    }

    // Validation
    const fn = (firstName || "").trim();
    if (!fn || fn.length < 2) throw new ApiError(400, "First name must be at least 2 characters.");
    if (fn.length > 40) throw new ApiError(400, "First name cannot exceed 40 characters.");
    if (!NAME_REGEX.test(fn)) throw new ApiError(400, "First name can only contain letters, spaces, hyphens or apostrophes.");

    const ln = (lastName || "").trim();
    if (!ln || ln.length < 1) throw new ApiError(400, "Last name is required.");
    if (ln.length > 40) throw new ApiError(400, "Last name cannot exceed 40 characters.");
    if (!NAME_REGEX.test(ln)) throw new ApiError(400, "Last name can only contain letters, spaces, hyphens or apostrophes.");

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      throw new ApiError(400, "Enter a valid corporate email address.");
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw new ApiError(409, `An account with email ${cleanEmail} already exists in the workspace.`);
    }

    if (!password || password.length < 8) {
      throw new ApiError(400, "Temporary password must be at least 8 characters.");
    }

    // Determine unique employee ID
    let finalEmpId = (employeeId || "").trim().toUpperCase();
    if (!finalEmpId) {
      let isUnique = false;
      while (!isUnique) {
        finalEmpId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
        const existing = await User.findOne({ employeeId: finalEmpId });
        if (!existing) isUnique = true;
      }
    } else {
      if (!EMP_ID_REGEX.test(finalEmpId)) {
        throw new ApiError(400, "Employee ID can only contain letters, numbers, hyphens and underscores.");
      }
      const existingId = await User.findOne({ employeeId: finalEmpId });
      if (existingId) {
        throw new ApiError(400, `Employee ID ${finalEmpId} is already in use by another team member.`);
      }
    }

    // Determine Designation / Title
    let finalTitle = (role || "").trim();
    if (!finalTitle) {
      if (systemRole === "super_admin") finalTitle = "Super Administrator";
      else if (systemRole === "system_admin") finalTitle = "System Administrator";
      else if (systemRole === "admin") finalTitle = "Administrator";
      else if (systemRole === "manager") finalTitle = "Department Manager";
      else finalTitle = "Staff Software Engineer";
    }

    const dialCode = `+${getCountryCallingCode(countryCode)}`;
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      firstName: fn,
      lastName: ln,
      email: cleanEmail,
      countryCode,
      dialCode,
      phoneNumber: (phoneNumber || "").trim() || "0000000000",
      department: (department || "Engineering").trim(),
      role: finalTitle,
      systemRole,
      employeeId: finalEmpId,
      dateOfBirth: new Date("1995-01-01"),
      password: hashedPassword,
      isEmailVerified: true,
      avatarUrl: "",
      employmentInfo: {
        designation: finalTitle,
        joiningDate: new Date(),
        workLocation,
        employmentType,
        manager: systemRole === "manager" ? "VP of Engineering" : systemRole === "admin" ? "Super Administrator" : "Department Lead",
      },
    });

    await recordAuditLog({
      req,
      action: "USER_PROVISIONED",
      resourceType: "user",
      resourceId: newUser._id.toString(),
      details: {
        email: cleanEmail,
        name: `${fn} ${ln}`,
        systemRole,
        department,
        employeeId: finalEmpId,
      },
    });

    const safeUser = await User.findById(newUser._id).select("-password -refreshTokens");
    sendSuccess(res, 201, `Member ${fn} ${ln} provisioned successfully with role [${systemRole}].`, { user: safeUser });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/users/send-email (and POST /api/messages/send-email)
// @desc   Admin sends direct message email to specific employee(s) via SMTP
export const sendEmailToUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== "admin") {
      throw new ApiError(403, "Access denied. Only administrators can dispatch emails to staff.");
    }

    const { recipientIds, userIds, subject, message, priority } = req.body;

    const rawTargets: string[] = Array.isArray(recipientIds)
      ? recipientIds
      : Array.isArray(userIds)
      ? userIds
      : recipientIds || userIds
      ? [recipientIds || userIds]
      : [];

    const targets = rawTargets.filter((id) => id && String(id).trim().length > 0);

    if (targets.length === 0) {
      throw new ApiError(400, "At least one recipient employee ID is required.");
    }

    if (!subject || String(subject).trim().length === 0) {
      throw new ApiError(400, "Email subject is required.");
    }

    if (!message || String(message).trim().length === 0) {
      throw new ApiError(400, "Email message body is required.");
    }

    const cleanSubject = String(subject).trim();
    const cleanMessage = String(message).trim();
    const cleanPriority = ["normal", "important", "urgent"].includes(priority)
      ? priority
      : "normal";

    const objectIds = targets
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (objectIds.length === 0) {
      throw new ApiError(400, "No valid employee IDs provided.");
    }

    const validRecipients = await User.find({
      _id: { $in: objectIds },
    }).select("firstName lastName email role employeeId isBlocked");

    if (validRecipients.length === 0) {
      throw new ApiError(404, "No matching employees found for the provided recipient IDs.");
    }

    const senderFullName = `${adminUser.firstName} ${adminUser.lastName}`.trim() || "EmpSphere Admin";
    const senderEmail = adminUser.email;

    const dispatchResults: Array<{
      id: string;
      name: string;
      email: string;
      status: "sent" | "failed";
      error?: string;
    }> = [];

    const notificationRecords: any[] = [];

    for (const recipient of validRecipients) {
      const recipientName = `${recipient.firstName} ${recipient.lastName}`.trim() || "Employee";
      const html = adminDirectMessageEmailTemplate({
        recipientName,
        senderName: senderFullName,
        senderRole: adminUser.role === "admin" ? "System Administrator" : adminUser.role,
        senderEmail,
        subject: cleanSubject,
        message: cleanMessage,
        priority: cleanPriority,
      });

      try {
        await sendEmail({
          to: recipient.email,
          subject: cleanSubject,
          html,
        });

        dispatchResults.push({
          id: recipient._id.toString(),
          name: recipientName,
          email: recipient.email,
          status: "sent",
        });

        notificationRecords.push({
          recipient: recipient._id,
          sender: adminUser._id,
          senderName: senderFullName,
          title: `✉️ Admin Email: ${cleanSubject}`,
          message:
            cleanMessage.length > 100
              ? `${cleanMessage.substring(0, 100)}...`
              : cleanMessage,
          type: cleanPriority === "urgent" ? "alert" : "event",
          read: false,
        });
      } catch (err: any) {
        console.error(`[Mailer] Failed sending email to ${recipient.email}:`, err);
        dispatchResults.push({
          id: recipient._id.toString(),
          name: recipientName,
          email: recipient.email,
          status: "failed",
          error: err.message || "Failed to send email",
        });
      }
    }

    if (notificationRecords.length > 0) {
      try {
        await Notification.insertMany(notificationRecords);
      } catch (notifErr) {
        console.error("[Notifications] Failed to log in-app notifications for sent emails:", notifErr);
      }
    }

    const successCount = dispatchResults.filter((r) => r.status === "sent").length;

    sendSuccess(res, 200, `Email successfully dispatched to ${successCount} recipient(s).`, {
      sentCount: successCount,
      totalRecipients: validRecipients.length,
      recipients: dispatchResults,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// SENSITIVE PROFILE CREDENTIAL VERIFICATION & CHANGE (EMAIL & PHONE)
// =========================================================================

// @route   POST /api/users/profile/request-email-change
// @desc    Send 6-digit verification code to user's registered phone number to authorize email change
export const requestEmailChange = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw new ApiError(404, "User not found.");

    const otp = generateOTP();
    user.changeEmailOtpHash = hashOTP(otp);
    user.changeEmailOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    await user.save();

    // Send authorization code directly to user's registered email address
    await sendEmail({
      to: user.email,
      subject: "EmpSphere Security: Verify Work Email Update",
      html: `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4355cc; margin: 0; font-size: 22px;">EmpSphere Security Verification</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Work Email Update Authorization</p>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Hello <strong>${user.firstName}</strong>,
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          You requested to change your work email address on your EmpSphere profile.
        </p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          Please use the following 6-digit authorization code to verify and confirm this change:
        </p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e293b; padding: 16px; background: #f8fafc; border: 2px dashed #cbd5e1; text-align: center; border-radius: 10px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 16px; line-height: 1.5;">
          This code is confidential and valid for <strong>5 minutes</strong>. If you did not initiate this request, please secure your account immediately.
        </p>
      </div>`,
    });

    const [local, domain] = user.email.split("@");
    const maskedEmail = `${local.slice(0, 3)}••••@${domain}`;

    sendSuccess(
      res,
      200,
      `A 6-digit verification code has been dispatched to your registered email (${maskedEmail}).`,
      {
        maskedEmail,
        expiresInSeconds: 300,
      },
    );
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users/profile/verify-email-change
// @desc    Verify OTP and update user's email address
export const verifyEmailChange = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { otp, newEmail } = req.body;

    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      throw new ApiError(400, "Please enter a valid 6-digit verification code.");
    }

    if (!newEmail || typeof newEmail !== "string" || !EMAIL_REGEX.test(newEmail.trim())) {
      throw new ApiError(400, "Please enter a valid email address.");
    }

    const cleanEmail = newEmail.trim().toLowerCase();

    const user = await User.findById(req.user?.id);
    if (!user) throw new ApiError(404, "User not found.");

    if (user.email === cleanEmail) {
      throw new ApiError(400, "The new email address cannot be the same as your current email.");
    }

    // Check uniqueness across all users
    const existingUser = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
    if (existingUser) {
      throw new ApiError(400, "This email address is already registered to another account.");
    }

    // Check expiration
    if (!user.changeEmailOtpHash || !user.changeEmailOtpExpires || user.changeEmailOtpExpires < new Date()) {
      throw new ApiError(400, "Verification code has expired. Please request a new code.");
    }

    // Verify OTP against hash
    const isValidHash = verifyOTP(otp.trim(), user.changeEmailOtpHash);
    if (!isValidHash) {
      throw new ApiError(400, "Invalid verification code. Please check and try again.");
    }

    // Update email
    user.email = cleanEmail;
    user.changeEmailOtpHash = undefined;
    user.changeEmailOtpExpires = undefined;
    await user.save();

    sendSuccess(res, 200, "Your email address has been updated successfully.", {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        dialCode: user.dialCode,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users/profile/request-phone-change
// @desc    Send 6-digit verification code to user's registered email to authorize phone change
export const requestPhoneChange = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { newCountryCode, newPhoneNumber } = req.body;

    if (!newCountryCode || !newPhoneNumber) {
      throw new ApiError(400, "Please provide country code and mobile number.");
    }

    const cleanPhone = String(newPhoneNumber).trim().replace(/[\s()-]/g, "");
    if (cleanPhone.length < 7 || cleanPhone.length > 15 || !/^\+?[0-9]+$/.test(cleanPhone)) {
      throw new ApiError(400, "Invalid phone number format.");
    }

    const user = await User.findById(req.user?.id);
    if (!user) throw new ApiError(404, "User not found.");

    // Check if phone already used by someone else
    const phoneInUse = await User.findOne({
      phoneNumber: cleanPhone,
      countryCode: newCountryCode.toUpperCase(),
      _id: { $ne: user._id },
    });
    if (phoneInUse) {
      throw new ApiError(400, "This phone number is already registered to another account.");
    }

    const callingCode = `+${getCountryCallingCode(newCountryCode.toUpperCase() as CountryCode)}`;
    const fullNewPhone = `${callingCode} ${cleanPhone}`;

    const otp = generateOTP();
    user.changePhoneOtpHash = hashOTP(otp);
    user.changePhoneOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    user.pendingNewCountryCode = newCountryCode.toUpperCase();
    user.pendingNewDialCode = callingCode;
    user.pendingNewPhone = cleanPhone;
    await user.save();

    // Send email to registered email address
    await sendEmail({
      to: user.email,
      subject: "EmpSphere Security: Verify Phone Number Change",
      html: phoneChangeOtpEmailTemplate(user.firstName, otp, fullNewPhone),
    });

    const [local, domain] = user.email.split("@");
    const maskedEmail = `${local.slice(0, 3)}••••@${domain}`;

    sendSuccess(
      res,
      200,
      `A 6-digit verification code has been dispatched to your registered email (${maskedEmail}).`,
      {
        maskedEmail,
        pendingPhone: fullNewPhone,
        expiresInSeconds: 300,
      },
    );
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users/profile/verify-phone-change
// @desc    Verify Email OTP and apply the new phone number
export const verifyPhoneChange = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { otp } = req.body;

    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      throw new ApiError(400, "Please enter a valid 6-digit verification code.");
    }

    const user = await User.findById(req.user?.id);
    if (!user) throw new ApiError(404, "User not found.");

    if (!user.changePhoneOtpHash || !user.changePhoneOtpExpires || user.changePhoneOtpExpires < new Date()) {
      throw new ApiError(400, "Verification code has expired. Please request a new code.");
    }

    if (!user.pendingNewPhone || !user.pendingNewCountryCode) {
      throw new ApiError(400, "No pending phone number change was found. Please initiate the request again.");
    }

    const isValid = verifyOTP(otp.trim(), user.changePhoneOtpHash);
    if (!isValid) {
      throw new ApiError(400, "Invalid verification code. Please check your email and try again.");
    }

    // Apply new phone
    user.countryCode = user.pendingNewCountryCode;
    user.dialCode = user.pendingNewDialCode || `+${getCountryCallingCode(user.countryCode as CountryCode)}`;
    user.phoneNumber = user.pendingNewPhone;

    user.changePhoneOtpHash = undefined;
    user.changePhoneOtpExpires = undefined;
    user.pendingNewCountryCode = undefined;
    user.pendingNewDialCode = undefined;
    user.pendingNewPhone = undefined;
    await user.save();

    sendSuccess(res, 200, "Your phone number has been updated successfully.", {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        dialCode: user.dialCode,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users/me/export
export const exportUserData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw new ApiError(404, "User not found.");

    const tasks = await Task.find({ assignedTo: user._id });

    const exportPayload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        formatVersion: "1.0",
        system: "EmpSphere Enterprise Workspace",
        compliance: "India DPDP Act 2023 & GDPR Compliant",
      },
      userProfile: {
        id: user._id,
        employeeId: user.employeeId || "N/A",
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: `${user.dialCode || "+91"} ${user.phoneNumber || ""}`,
        department: user.department,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled || false,
        registeredAt: user.createdAt,
      },
      employmentInfo: user.employmentInfo || {},
      compliance: user.compliance || {},
      salaryStructure: user.salary || {},
      preferences: {
        notifications: user.notificationPreferences || {},
        regional: user.regionalPreferences || {},
        appearance: user.appearancePreferences || {},
        privacy: user.privacySettings || {},
      },
      assignedTasksCount: tasks.length,
      assignedTasks: tasks.map((t) => ({
        id: t._id,
        taskCode: t.taskCode,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        department: t.department,
      })),
    };

    sendSuccess(res, 200, "User data archive compiled successfully.", exportPayload);
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users/system/settings
export const getSystemSettings = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = await PlatformSettings.create({});
    }
    sendSuccess(res, 200, "System settings retrieved.", { settings });
  } catch (error) {
    next(error);
  }
};

// @route  PATCH /api/users/system/settings
export const updateSystemSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { publicRegistration, maintenanceMode, sessionTimeoutMinutes, maxLoginAttempts } = req.body;
    let settings = await PlatformSettings.findOne();
    if (!settings) {
      settings = new PlatformSettings({});
    }
    if (publicRegistration !== undefined) settings.publicRegistration = publicRegistration;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (sessionTimeoutMinutes !== undefined) settings.sessionTimeoutMinutes = sessionTimeoutMinutes;
    if (maxLoginAttempts !== undefined) settings.maxLoginAttempts = maxLoginAttempts;
    await settings.save();

    await recordAuditLog({
      req,
      action: "SETTINGS_UPDATED",
      resourceType: "system",
      details: {
        publicRegistration,
        maintenanceMode,
        sessionTimeoutMinutes,
        maxLoginAttempts,
      },
    });

    sendSuccess(res, 200, "Platform configurations updated successfully.", { settings });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/users/me
// @desc   Professional self-service account deletion for employees
export const deleteMyAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User account not found.");
    }

    const userRoleLower = String(user.role || "").toLowerCase().trim();
    const userSysRole = String(user.systemRole || "").toLowerCase().trim();
    const isProtectedAdmin =
      userRoleLower === "admin" ||
      userRoleLower.includes("admin") ||
      userRoleLower.includes("super") ||
      userSysRole === "super_admin" ||
      userSysRole === "system_admin" ||
      userSysRole === "admin";

    if (isProtectedAdmin) {
      throw new ApiError(
        403,
        "Enterprise Governance Lock: Super Administrator and Administrator accounts cannot be self-deleted to safeguard platform operations and prevent workspace lockout."
      );
    }

    const { password, confirmationText } = req.body;

    // Verify security credentials
    if (password) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new ApiError(400, "Incorrect password. Account deletion cancelled for security.");
      }
    } else if (confirmationText !== "DELETE" && confirmationText !== user.email) {
      throw new ApiError(
        400,
        "Please provide your account password or type 'DELETE' to confirm permanent profile deletion."
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Unassign from all tasks safely
    await Task.updateMany(
      { assignedTo: userObjectId },
      { $pull: { assignedTo: userObjectId } }
    );

    // 2. Remove all recipient notifications
    await Notification.deleteMany({ recipient: userObjectId });

    // 3. Delete user document
    await User.findByIdAndDelete(userId);

    sendSuccess(
      res,
      200,
      "Your EmpSphere employee profile and account have been permanently deleted.",
      { deleted: true }
    );
  } catch (error) {
    next(error);
  }
};

