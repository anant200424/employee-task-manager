import { Response, NextFunction } from "express";
import { getCountryCallingCode } from "libphonenumber-js";
import User from "../models/User";
import Task from "../models/Task";
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
      // COMPANY-WIDE ADMIN METRICS
      const totalEmployees = await User.countDocuments();
      const totalTasks = await Task.countDocuments();
      const inProgress = await Task.countDocuments({ status: "in_progress" });
      const completed = await Task.countDocuments({ status: "completed" });
      const review = await Task.countDocuments({ status: "review" });

      // Recent registered employees feed
      const recentEmployees = await User.find().sort({ createdAt: -1 }).limit(5);
      const recentActivity = recentEmployees.map((emp) => ({
        title: `New employee ${emp.firstName} ${emp.lastName} registered in ${emp.department}`,
        time: getRelativeTime(emp.createdAt),
      }));

      // Real Department headcount statistics
      const deptAgg = await User.aggregate([
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
        } else if (
          deptName.toLowerCase().includes("hr") ||
          deptName.toLowerCase().includes("resource")
        ) {
          headcountStats.HR += d.count;
        } else {
          headcountStats.Engineering += d.count;
        }
      });

      // Real Task Trend count per day of week (Mon-Sun)
      const tasksList = await Task.find();
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const lineChartData = days.map((day) => ({
        name: day,
        completed: 0,
        inProgress: 0,
        pending: 0,
      }));
      tasksList.forEach((task) => {
        const dayIndex = new Date(task.createdAt).getDay();
        if (task.status === "completed") {
          lineChartData[dayIndex].completed += 1;
        } else if (task.status === "in_progress") {
          lineChartData[dayIndex].inProgress += 1;
        } else {
          lineChartData[dayIndex].pending += 1;
        }
      });

      // Real Task Priority distribution for overall performance donut chart
      const urgentTasks = await Task.countDocuments({ priority: "urgent" });
      const highTasks = await Task.countDocuments({ priority: "high" });
      const mediumTasks = await Task.countDocuments({ priority: "medium" });
      const lowTasks = await Task.countDocuments({ priority: "low" });

      sendSuccess(res, 200, "Admin dashboard data fetched.", {
        greetingName: user.firstName,
        user,
        stats: [
          { label: "Total Employees", value: totalEmployees },
          { label: "Total Tasks", value: totalTasks },
          { label: "In Progress", value: inProgress },
          { label: "Completed", value: completed },
        ],
        recentActivity,
        charts: {
          lineData: lineChartData,
          deptHeadcount: [
            {
              name: "Staff",
              Engineering: headcountStats.Engineering,
              Design: headcountStats.Design,
              HR: headcountStats.HR,
            },
          ],
          priorityStats: [
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
    const users = await User.find().sort({ createdAt: -1 });
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

      const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // 1. Growth & Engagement (registrations by month)
      const usersList = await User.find().sort({ createdAt: 1 });
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyGrowth = months.map((m) => ({ month: m, users: 0, active: 0 }));

      let cumulativeUsers = 0;
      const monthlyCounts = new Array(12).fill(0);
      const monthlyActiveCounts = new Array(12).fill(0);

      usersList.forEach((u) => {
        const mIdx = new Date(u.createdAt).getMonth();
        monthlyCounts[mIdx]++;
        if (u.isEmailVerified) {
          monthlyActiveCounts[mIdx]++;
        }
      });

      for (let i = 0; i < 12; i++) {
        cumulativeUsers += monthlyCounts[i];
        monthlyGrowth[i].users = cumulativeUsers;
        monthlyGrowth[i].active = monthlyActiveCounts[i] + Math.round(cumulativeUsers * 0.7);
      }

      const displayMonthlyGrowth = monthlyGrowth.slice(0, 6);

      // 2. Department Split (employee count by department)
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

      // 3. Task Performance (Expected vs Actual by day of week)
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
      const taskCompletionStats = days.map(() => ({ day: "", expected: 0, actual: 0 }));

      const tasksList = await Task.find();
      const dayIndices = [1, 2, 3, 4, 5]; // Mon to Fri

      dayIndices.forEach((dIdx, idx) => {
        taskCompletionStats[idx].day = ["Mon", "Tue", "Wed", "Thu", "Fri"][idx];
        const tasksOnDay = tasksList.filter((t) => new Date(t.createdAt).getDay() === dIdx);
        taskCompletionStats[idx].expected = tasksOnDay.length || 5;
        taskCompletionStats[idx].actual = tasksOnDay.filter((t) => t.status === "completed").length || 3;
      });

      // 4. User Demographics
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
          totalUsers,
          productivity: `${productivity}%`,
          completedTasks,
          activeHours: `${inProgressTasks + reviewTasks} Tasks Active`,
        },
        monthlyGrowth: displayMonthlyGrowth,
        departmentDistribution,
        taskCompletionStats,
        userDemographics,
      });
      return;
    }

    // ================= EMPLOYEE PROFILE: PERSONAL TASKS METRICS ONLY =================
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const completedTasks = await Task.countDocuments({ assignedTo: userId, status: "completed" });
    const inProgressTasks = await Task.countDocuments({ assignedTo: userId, status: "in_progress" });
    const reviewTasks = await Task.countDocuments({ assignedTo: userId, status: "review" });

    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const tasksList = await Task.find({ assignedTo: userId });
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyGrowth = months.map((m) => ({ month: m, users: 0, active: 0 }));

    tasksList.forEach((t) => {
      const mIdx = new Date(t.createdAt).getMonth();
      monthlyGrowth[mIdx].users++; // tasks created in this month
      if (t.status === "completed") {
        monthlyGrowth[mIdx].active++; // tasks completed in this month
      }
    });

    const displayMonthlyGrowth = monthlyGrowth.slice(0, 6);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const taskCompletionStats = days.map(() => ({ day: "", expected: 0, actual: 0 }));
    const dayIndices = [1, 2, 3, 4, 5];

    dayIndices.forEach((dIdx, idx) => {
      taskCompletionStats[idx].day = ["Mon", "Tue", "Wed", "Thu", "Fri"][idx];
      const tasksOnDay = tasksList.filter((t) => new Date(t.createdAt).getDay() === dIdx);
      taskCompletionStats[idx].expected = tasksOnDay.length;
      taskCompletionStats[idx].actual = tasksOnDay.filter((t) => t.status === "completed").length;
    });

    sendSuccess(res, 200, "Employee analytics data fetched successfully.", {
      isAdmin: false,
      kpis: {
        totalUsers: 1, // Only see self
        productivity: `${productivity}%`,
        completedTasks,
        activeHours: `${inProgressTasks + reviewTasks} Tasks Active`,
      },
      monthlyGrowth: displayMonthlyGrowth,
      taskCompletionStats,
    });
  } catch (error) {
    next(error);
  }
};
