import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { AuthRequest } from "../middleware/auth";

/**
 * Retrieves all notifications for the authenticated user.
 * 
 * @route  GET /api/notifications
 */
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const recipientFilter = mongoose.Types.ObjectId.isValid(userId)
      ? { $in: [userId, new mongoose.Types.ObjectId(userId)] }
      : userId;

    let notifications = await Notification.find({ recipient: recipientFilter })
      .sort({ createdAt: -1 })
      .lean();

    // If first-time user has no notifications, seed initial welcome notifications
    if (notifications.length === 0 && mongoose.Types.ObjectId.isValid(userId)) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const seedNotifs = [
        {
          recipient: userObjectId,
          senderName: "EmpSphere Security",
          title: "Security & Authentication Initialized",
          message: "Your workspace profile credentials and security session are active.",
          type: "system",
          read: false,
        },
        {
          recipient: userObjectId,
          senderName: "Operations Lead",
          title: "Task Deliverables & Milestones",
          message: "Assigned enterprise tasks and sprint goals have been mapped to your workspace.",
          type: "task",
          taskCode: "TSK-1001",
          read: false,
        },
      ];
      await Notification.insertMany(seedNotifs);
      notifications = await Notification.find({ recipient: recipientFilter })
        .sort({ createdAt: -1 })
        .lean();
    }

    const unreadCount = notifications.filter((n) => !n.read).length;

    sendSuccess(res, 200, "Notifications fetched successfully.", {
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marks a single notification as read.
 * 
 * @route  PATCH /api/notifications/:id/read
 */
export const markNotificationRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const recipientFilter = userId && mongoose.Types.ObjectId.isValid(userId)
      ? { $in: [userId, new mongoose.Types.ObjectId(userId)] }
      : userId;

    let notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: recipientFilter },
      { $set: { read: true } },
      { new: true },
    );

    if (!notification && mongoose.Types.ObjectId.isValid(id)) {
      notification = await Notification.findByIdAndUpdate(
        id,
        { $set: { read: true } },
        { new: true },
      );
    }

    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    sendSuccess(res, 200, "Notification marked as read.", { notification });
  } catch (error) {
    next(error);
  }
};

/**
 * Marks all notifications for the authenticated user as read.
 * 
 * @route  PATCH /api/notifications/read-all
 */
export const markAllNotificationsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication required.");
    }

    const recipientFilter = mongoose.Types.ObjectId.isValid(userId)
      ? { $in: [userId, new mongoose.Types.ObjectId(userId)] }
      : userId;

    await Notification.updateMany(
      { recipient: recipientFilter },
      { $set: { read: true } },
    );

    sendSuccess(res, 200, "All notifications marked as read.");
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a notification by its ID.
 * 
 * @route  DELETE /api/notifications/:id
 */
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const recipientFilter = userId && mongoose.Types.ObjectId.isValid(userId)
      ? { $in: [userId, new mongoose.Types.ObjectId(userId)] }
      : userId;

    let notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: recipientFilter,
    });

    if (!notification && mongoose.Types.ObjectId.isValid(id)) {
      notification = await Notification.findByIdAndDelete(id);
    }

    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    sendSuccess(res, 200, "Notification deleted successfully.", { id });
  } catch (error) {
    next(error);
  }
};
