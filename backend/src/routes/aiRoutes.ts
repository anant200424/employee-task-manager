import { Router } from "express";
import { chatWithAI, getAIContext } from "../controllers/aiController";
import { protect } from "../middleware/auth";

const router = Router();

// Require authentication for AI workspace access
router.use(protect);

router.post("/chat", chatWithAI);
router.get("/context", getAIContext);

export default router;
