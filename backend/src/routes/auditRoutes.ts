import { Router } from "express";
import { getAuditLogs, getAuditActions } from "../controllers/auditController";
import { authenticate } from "../middleware/auth";
import { requireAnyRole } from "../middleware/rbac";

const router = Router();

router.use(authenticate);
router.use(requireAnyRole("super_admin", "system_admin", "admin"));

router.get("/", getAuditLogs);
router.get("/actions", getAuditActions);

export default router;
