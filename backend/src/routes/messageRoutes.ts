import { Router, Response, NextFunction } from "express";
import Message from "../models/Message";
import User from "../models/User";
import Notification from "../models/Notification";
import { protect, restrictTo } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { sendEmailToUsers } from "../controllers/userController";
import { recordAuditLog } from "../services/auditService";
import { emitWorkspaceMessage, emitNewNotification } from "../services/socketService";

const router = Router();

router.use(protect);

// @route  POST /api/messages/send-email
// @desc   Admin sends direct email to specific employee(s) via SMTP
router.post("/send-email", restrictTo("admin", "super_admin", "system_admin"), sendEmailToUsers);


// @route  GET /api/messages
// @desc   Get all workspace messages (announcements & discussions)
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    sendSuccess(res, 200, "Messages fetched successfully.", { messages });
  } catch (error) {
    next(error);
  }
});

// @route  POST /api/messages
// @desc   Create a new message (announcement or discussion)
router.post("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content, type } = req.body;
    const userId = req.user?.id;

    if (!content || String(content).trim().length === 0) {
      throw new ApiError(400, "Message content is required.");
    }
    if (String(content).trim().length > 5000) {
      throw new ApiError(400, "Message content cannot exceed 5,000 characters.");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User session not found.");
    }

    const messageType = type === "announcement" ? "announcement" : "discussion";

    const rawRole = (user.role || "").toLowerCase();
    const isPrivileged =
      ["admin", "super_admin", "system_admin"].includes(user.systemRole || "") ||
      rawRole === "admin" ||
      rawRole === "super administrator" ||
      rawRole === "system administrator";

    // Restrict announcements to administrators only
    if (messageType === "announcement" && !isPrivileged) {
      throw new ApiError(403, "Only administrators are allowed to post announcements.");
    }

    const message = await Message.create({
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: user.systemRole === "super_admin" ? "Super Administrator" : user.role,
      content: String(content).trim(),
      type: messageType,
    });

    if (messageType === "announcement") {
      recordAuditLog({
        req,
        action: "COMPANY_ANNOUNCEMENT_BROADCAST",
        resourceType: "team",
        resourceId: message._id.toString(),
        details: { snippet: String(content).trim().substring(0, 100) },
      });
    }

    // Automatically notify all other active employees/users
    const otherUsers = await User.find({ _id: { $ne: user._id } }).select("_id");
    if (otherUsers.length > 0) {
      const senderFullName = `${user.firstName} ${user.lastName}`;
      const title =
        messageType === "announcement"
          ? "📢 New Company Announcement"
          : "💬 Workspace Hub Message";

      const snippet =
        String(content).trim().length > 70
          ? `${String(content).trim().substring(0, 70)}...`
          : String(content).trim();

      const notifs = otherUsers.map((u) => ({
        recipient: u._id,
        sender: user._id,
        senderName: senderFullName,
        title,
        message: `${senderFullName}: "${snippet}"`,
        type: messageType === "announcement" ? "alert" : "event",
        read: false,
      }));

      await Notification.insertMany(notifs);
      notifs.forEach((n) => emitNewNotification(n.recipient.toString(), n));
    }

    emitWorkspaceMessage(message);

    sendSuccess(res, 201, "Message posted successfully.", { message });
  } catch (error) {
    next(error);
  }
});

export default router;
