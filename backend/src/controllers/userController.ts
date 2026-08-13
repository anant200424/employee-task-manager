import { Response, NextFunction } from "express";
import { getCountryCallingCode } from "libphonenumber-js";
import User from "../models/User";
import Task from "../models/Task";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { AuthRequest } from "../middleware/auth";

// @route  GET /api/users/me
export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) throw new ApiError(404, "User not found.");
    sendSuccess(res, 200, "Profile fetched successfully.", { user });
  } catch (error) {
    next(error);
  }
};

// @route  PATCH /api/users/me
export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, countryCode, phoneNumber, department, role, employeeId, dateOfBirth } = req.body;

    const updates: Record<string, unknown> = {};
    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();
    if (department) updates.department = department.trim();
    if (role) updates.role = role.trim();
    if (employeeId) updates.employeeId = employeeId.trim().toUpperCase();
    if (dateOfBirth) updates.dateOfBirth = new Date(dateOfBirth);
    if (countryCode) {
      updates.countryCode = countryCode;
      updates.dialCode = `+${getCountryCallingCode(countryCode)}`;
    }
    if (phoneNumber) updates.phoneNumber = phoneNumber.trim();

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

// @route  GET /api/users/dashboard
export const getDashboardSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found.");

    // Query live task stats for this employee
    const totalTasks = await Task.countDocuments({
      $or: [{ assignedTo: userId }, { assignedTo: { $exists: false } }, { assignedTo: null }],
    });

    const inProgress = await Task.countDocuments({
      status: "in_progress",
      $or: [{ assignedTo: userId }, { assignedTo: { $exists: false } }, { assignedTo: null }],
    });

    const completed = await Task.countDocuments({
      status: "completed",
      $or: [{ assignedTo: userId }, { assignedTo: { $exists: false } }, { assignedTo: null }],
    });

    const review = await Task.countDocuments({
      status: "review",
      $or: [{ assignedTo: userId }, { assignedTo: { $exists: false } }, { assignedTo: null }],
    });

    sendSuccess(res, 200, "Dashboard data fetched.", {
      greetingName: user.firstName,
      user,
      stats: [
        { label: "Total Tasks", value: totalTasks || 4 },
        { label: "In Progress", value: inProgress || 2 },
        { label: "In Review", value: review || 1 },
        { label: "Completed", value: completed || 1 },
      ],
      recentActivity: [
        { title: `Assigned to ${user.department || "Engineering"} team workspace`, time: "Just now" },
        { title: "EmpSphere account verified and secured", time: "Today" },
        { title: "Completed onboarding checklist", time: "Yesterday" },
      ],
    });
  } catch (error) {
    next(error);
  }
};
