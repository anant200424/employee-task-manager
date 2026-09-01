import { Router, Response, NextFunction } from "express";
import Message from "../models/Message";
import User from "../models/User";
import { protect } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";

const router = Router();

router.use(protect);

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

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User session not found.");
    }

    const messageType = type === "announcement" ? "announcement" : "discussion";

    // Restrict announcements to administrators only
    if (messageType === "announcement" && user.role !== "admin") {
      throw new ApiError(403, "Only administrators are allowed to post announcements.");
    }

    const message = await Message.create({
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: user.role,
      content: String(content).trim(),
      type: messageType,
    });

    sendSuccess(res, 201, "Message posted successfully.", { message });
  } catch (error) {
    next(error);
  }
});

export default router;
