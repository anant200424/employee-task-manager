import mongoose from "mongoose";
import dotenv from "dotenv";
import AuditLog from "./models/AuditLog";
import User from "./models/User";

dotenv.config();

const SEED_AUDIT_EVENTS = [
  {
    action: "USER_LOGIN_SUCCESS",
    resourceType: "auth" as const,
    resourceId: "AUTH_SESSION_ROOT",
    actorName: "Anant Singh",
    actorEmail: "superadmin@empsphere.io",
    actorRole: "super_admin",
    details: { method: "Password + Multi-Factor OTP", client: "Chrome 128 / Windows NT 10.0", securityStatus: "Verified" },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    offsetMinutes: 8,
  },
  {
    action: "ROLE_PROMOTED_MANAGER",
    resourceType: "user" as const,
    resourceId: "USER_KISHAN_KUMAR",
    actorName: "Anant Singh",
    actorEmail: "superadmin@empsphere.io",
    actorRole: "super_admin",
    details: { targetUser: "Kishan Kumar", targetEmail: "kishankumar20082000@gmail.com", previousRole: "Software Engineer", designatedRole: "Engineering Manager", designatedSystemRole: "manager" },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    offsetMinutes: 24,
  },
  {
    action: "TASK_DISPATCHED_TO_MANAGER",
    resourceType: "task" as const,
    resourceId: "TASK_DELIV_8901",
    actorName: "Anant Singh",
    actorEmail: "superadmin@empsphere.io",
    actorRole: "super_admin",
    details: { title: "Q4 Enterprise Security Audit & RBAC Infrastructure", priority: "urgent", department: "Engineering", assignedManager: "Kishan Kumar" },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    offsetMinutes: 45,
  },
  {
    action: "SYSTEM_SETTINGS_UPDATED",
    resourceType: "system" as const,
    resourceId: "SYS_CONFIG_SEC",
    actorName: "Anant Singh",
    actorEmail: "superadmin@empsphere.io",
    actorRole: "super_admin",
    details: { setting: "Enforce Workspace 2FA", previousValue: false, newValue: true, reason: "SOC2 Compliance Milestone" },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    offsetMinutes: 90,
  },
  {
    action: "PROJECT_CREATED",
    resourceType: "task" as const,
    resourceId: "PROJ_CORE_AUTH",
    actorName: "Anant Singh",
    actorEmail: "superadmin@empsphere.io",
    actorRole: "super_admin",
    details: { projectTitle: "Enterprise Multi-Tenant IAM Gateway", status: "in_progress", teamSize: 6 },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    offsetMinutes: 140,
  },
  {
    action: "USER_LOGIN_SUCCESS",
    resourceType: "auth" as const,
    resourceId: "AUTH_SESSION_EMP",
    actorName: "Lokesh Kumar",
    actorEmail: "lokeshkumar@empsphere.io",
    actorRole: "manager",
    details: { method: "Standard SSO Credential", status: "Active" },
    ipAddress: "192.168.1.14",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    offsetMinutes: 180,
  },
  {
    action: "SECURITY_SCAN_COMPLETED",
    resourceType: "security" as const,
    resourceId: "SCAN_VULN_CHECK",
    actorName: "System Automated Daemon",
    actorEmail: "security-bot@empsphere.io",
    actorRole: "system",
    details: { result: "0 critical, 0 high vulnerabilities detected. TLS 1.3 enforced. All packages certified clean.", score: "99.98%" },
    ipAddress: "10.0.0.1",
    userAgent: "EmpSphere-Security-Worker/2.4",
    offsetMinutes: 240,
  },
  {
    action: "USER_PROFILE_UPDATED",
    resourceType: "user" as const,
    resourceId: "USER_SARAH_DEV",
    actorName: "Anant Singh",
    actorEmail: "superadmin@empsphere.io",
    actorRole: "super_admin",
    details: { target: "Sarah Jenkins", updatedFields: ["role", "department"], newRole: "Senior UI/UX Architect" },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    offsetMinutes: 320,
  },
  {
    action: "DATABASE_BACKUP_COMPLETED",
    resourceType: "system" as const,
    resourceId: "SNAPSHOT_DAILY_0907",
    actorName: "System Automated Daemon",
    actorEmail: "backup-engine@empsphere.io",
    actorRole: "system",
    details: { backupSize: "482 MB", storage: "Encrypted Cloud Vault", status: "Success", durationSec: 18 },
    ipAddress: "10.0.0.2",
    userAgent: "EmpSphere-Storage-Engine/1.0",
    offsetMinutes: 480,
  },
  {
    action: "COMPANY_ANNOUNCEMENT_BROADCAST",
    resourceType: "team" as const,
    resourceId: "ANN_ALL_HANDS",
    actorName: "Anant Singh",
    actorEmail: "superadmin@empsphere.io",
    actorRole: "super_admin",
    details: { title: "Q3 Operations Review & Roadmap Briefing", recipientsCount: 22, channel: "Global Workspace Hub" },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    offsetMinutes: 620,
  },
  {
    action: "USER_LOGIN_SUCCESS",
    resourceType: "auth" as const,
    resourceId: "AUTH_SESSION_DEV",
    actorName: "Vikram Mehta",
    actorEmail: "vikram@empsphere.io",
    actorRole: "employee",
    details: { method: "Token Refresh", client: "Firefox 129" },
    ipAddress: "192.168.1.55",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0)",
    offsetMinutes: 780,
  },
  {
    action: "PERMISSIONS_REVIEW_PASSED",
    resourceType: "security" as const,
    resourceId: "SEC_RBAC_AUDIT",
    actorName: "Anant Singh",
    actorEmail: "superadmin@empsphere.io",
    actorRole: "super_admin",
    details: { scope: "All 22 Active Accounts", superAdminCount: 1, managerCount: 4, complianceStatus: "Fully Compliant" },
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    offsetMinutes: 1440,
  },
];

async function seedAuditLogs() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/task_manager";
  console.log("Connecting to MongoDB for Audit Logs seeding...");
  await mongoose.connect(uri);

  const existingCount = await AuditLog.countDocuments();
  console.log(`Current audit logs count: ${existingCount}`);

  const adminUser = await User.findOne({ email: "superadmin@empsphere.io" }) || await User.findOne({ role: "admin" });
  const adminId = adminUser?._id;

  const now = Date.now();
  const docs = SEED_AUDIT_EVENTS.map((evt) => {
    const timestamp = new Date(now - evt.offsetMinutes * 60 * 1000);
    return {
      actorId: evt.actorRole === "super_admin" && adminId ? adminId : undefined,
      actorName: evt.actorName,
      actorEmail: evt.actorEmail,
      actorRole: evt.actorRole,
      action: evt.action,
      resourceType: evt.resourceType,
      resourceId: evt.resourceId,
      details: evt.details,
      ipAddress: evt.ipAddress,
      userAgent: evt.userAgent,
      timestamp,
    };
  });

  await AuditLog.insertMany(docs);
  const newTotal = await AuditLog.countDocuments();
  console.log(`Successfully seeded audit events! Total audit logs now in database: ${newTotal}`);

  await mongoose.disconnect();
  console.log("Database connection closed.");
}

seedAuditLogs().catch((err) => {
  console.error("Seeding audit logs failed:", err);
  process.exit(1);
});
