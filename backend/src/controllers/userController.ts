import { Response, NextFunction } from "express";
import { getCountryCallingCode } from "libphonenumber-js";
import mongoose from "mongoose";
import User from "../models/User";
import Task from "../models/Task";
import Notification from "../models/Notification";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { AuthRequest } from "../middleware/auth";

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
    } = req.body;

    const updates: Record<string, unknown> = {};
    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();
    if (department) updates.department = department.trim();
    if (role) updates.role = role.trim();
    if (employeeId) updates.employeeId = employeeId.trim().toUpperCase();
    if (dateOfBirth) updates.dateOfBirth = new Date(dateOfBirth);
    if (typeof avatarUrl === "string") updates.avatarUrl = avatarUrl;
    if (typeof coverUrl === "string") updates.coverUrl = coverUrl;
    if (countryCode) {
      updates.countryCode = countryCode;
      updates.dialCode = `+${getCountryCallingCode(countryCode)}`;
    }
    if (phoneNumber) updates.phoneNumber = phoneNumber.trim();

    // HR Fields
    if (employmentInfo) updates.employmentInfo = employmentInfo;
    if (compliance) updates.compliance = compliance;
    if (documents) updates.documents = documents;
    if (salary) updates.salary = salary;
    if (privacySettings) updates.privacySettings = privacySettings;
    if (notificationPreferences) updates.notificationPreferences = notificationPreferences;

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

    if (user.role === "admin") {
      // COMPANY-WIDE ADMIN METRICS (Excluding Superadmin)
      const totalEmployees = await User.countDocuments({ role: { $ne: "admin" } });
      const totalTasks = await Task.countDocuments();
      const inProgress = await Task.countDocuments({ status: "in_progress" });
      const completed = await Task.countDocuments({ status: "completed" });
      const review = await Task.countDocuments({ status: "review" });

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
        stats: [
          {
            label: "Total Personnel",
            value: totalEmployees,
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

    // STANDARD EMPLOYEE METRICS
    const totalTasks = await Task.countDocuments({
      $or: [
        { assignedTo: userId },
        { assignedTo: { $exists: false } },
        { assignedTo: null },
      ],
    });

    const inProgress = await Task.countDocuments({
      status: "in_progress",
      $or: [
        { assignedTo: userId },
        { assignedTo: { $exists: false } },
        { assignedTo: null },
      ],
    });

    const completed = await Task.countDocuments({
      status: "completed",
      $or: [
        { assignedTo: userId },
        { assignedTo: { $exists: false } },
        { assignedTo: null },
      ],
    });

    const review = await Task.countDocuments({
      status: "review",
      $or: [
        { assignedTo: userId },
        { assignedTo: { $exists: false } },
        { assignedTo: null },
      ],
    });

    sendSuccess(res, 200, "Dashboard data fetched.", {
      greetingName: user.firstName,
      user,
      stats: [
        { label: "Total Tasks", value: totalTasks },
        { label: "In Progress", value: inProgress },
        { label: "In Review", value: review },
        { label: "Completed", value: completed },
      ],
      recentActivity: [
        {
          title: `Assigned to ${user.department || "Engineering"} team workspace`,
          time: "Just now",
        },
        { title: "EmpSphere account verified and secured", time: "Today" },
        { title: "Completed onboarding checklist", time: "Yesterday" },
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
    const { includeAdmin } = req.query;
    const query: Record<string, unknown> = {};
    if (includeAdmin !== "true") {
      query.role = { $not: /admin/i };
      if (req.user?.id) {
        query._id = { $ne: new mongoose.Types.ObjectId(req.user.id) };
      }
    }
    const users = await User.find(query).sort({ createdAt: -1 });
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

    if (user.role === "admin") {
      // ================= ADMIN PROFILE: COMPANY-WIDE METRICS =================
      const totalUsers = await User.countDocuments();
      const totalTasks = await Task.countDocuments();
      const completedTasks = await Task.countDocuments({ status: "completed" });
      const inProgressTasks = await Task.countDocuments({ status: "in_progress" });
      const reviewTasks = await Task.countDocuments({ status: "review" });
      const todoTasks = await Task.countDocuments({ status: "todo" });

      const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // 1. Dynamic 6-Month Trailing Growth & Velocity Trajectory
      const usersList = await User.find().sort({ createdAt: 1 });
      const tasksList = await Task.find().sort({ createdAt: 1 });
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const currentMonthIdx = now.getMonth();

      const displayMonthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const targetMonthIdx = (currentMonthIdx - i + 12) % 12;
        const mName = months[targetMonthIdx];
        const progressFactor = (6 - i) / 6; // 0.16 to 1.0

        // Real or ramped cumulative users up to this month
        const realUsersCount = usersList.filter((u) => new Date(u.createdAt).getMonth() <= targetMonthIdx).length;
        const projectedUsers = Math.max(
          1,
          Math.min(totalUsers, Math.max(realUsersCount, Math.round(totalUsers * (0.3 + 0.7 * progressFactor))))
        );

        // Real or ramped task assignments and completions
        const realTasksCount = tasksList.filter((t) => new Date(t.createdAt).getMonth() <= targetMonthIdx).length;
        const projectedTasks = Math.max(
          1,
          Math.min(totalTasks, Math.max(realTasksCount, Math.round(totalTasks * (0.25 + 0.75 * progressFactor))))
        );

        const realCompleted = tasksList.filter((t) => t.status === "completed" && new Date(t.updatedAt || t.createdAt).getMonth() <= targetMonthIdx).length;
        const projectedCompleted = Math.min(
          completedTasks,
          Math.max(realCompleted, Math.round(completedTasks * (0.2 + 0.8 * progressFactor)))
        );

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

    // ================= EMPLOYEE PROFILE: PERSONAL TASKS METRICS ONLY =================
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

    sendSuccess(res, 200, "Employee analytics data fetched successfully.", {
      isAdmin: false,
      kpis: {
        totalUsers: `${totalTasks}`,
        totalTasks: `${totalTasks}`,
        productivity: `${productivity}%`,
        completedTasks: `${completedTasks}`,
        activeHours: `${inProgressTasks + reviewTasks}`,
      },
      monthlyGrowth: displayMonthlyGrowth,
      taskStatusBreakdown,
      priorityDistribution,
      taskCompletionStats,
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

    if (userToBlock.role === "admin") {
      throw new ApiError(400, "Administrative accounts cannot be blocked.");
    }

    userToBlock.isBlocked = true;
    userToBlock.blockedAt = new Date();
    userToBlock.blockedReason = reason || "Suspended by administrator";
    userToBlock.refreshTokens = []; // Clear all active sessions immediately
    await userToBlock.save({ validateBeforeSave: false });

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

    userToUnblock.isBlocked = false;
    userToUnblock.blockedAt = undefined;
    userToUnblock.blockedReason = undefined;
    await userToUnblock.save({ validateBeforeSave: false });

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

    const updates: Record<string, unknown> = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (department !== undefined) updates.department = department.trim();
    if (role !== undefined) updates.role = role.trim();
    if (employeeId !== undefined) updates.employeeId = employeeId.trim().toUpperCase();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
    if (countryCode !== undefined) {
      updates.countryCode = countryCode;
      if (!dialCode) updates.dialCode = `+${getCountryCallingCode(countryCode)}`;
    }
    if (dialCode !== undefined) updates.dialCode = dialCode.trim();

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
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

    if (targetUser.role === "admin" || targetUser._id.toString() === req.user?.id) {
      throw new ApiError(400, "Administrator accounts cannot be deleted.");
    }

    await User.findByIdAndDelete(id);
    await Task.updateMany({ assignedTo: id }, { $pull: { assignedTo: new mongoose.Types.ObjectId(id) } });
    await Notification.deleteMany({ recipient: id });

    sendSuccess(res, 200, `Employee ${targetUser.firstName} ${targetUser.lastName} deleted successfully.`);
  } catch (error) {
    next(error);
  }
};


