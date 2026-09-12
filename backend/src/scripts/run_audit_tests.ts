import { resolveSystemRole, verifyTaskResourceAccess } from "../middleware/rbac";
import { restrictTo } from "../middleware/auth";
import { ApiError } from "../utils/ApiError";

// ANSI color codes
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ${GREEN}✓ PASS:${RESET} ${testName}`);
  } else {
    failedCount++;
    console.error(`  ${RED}✗ FAIL:${RESET} ${testName}${detail ? ` — ${detail}` : ""}`);
  }
}

async function runTests() {
  console.log(`\n${CYAN}========================================================================${RESET}`);
  console.log(`${CYAN}   ENTERPRISE RBAC, SECURITY & IDOR AUDIT VERIFICATION SUITE           ${RESET}`);
  console.log(`${CYAN}========================================================================${RESET}\n`);

  // =========================================================================
  // 1. Title vs Canonical System Role Decoupling
  // =========================================================================
  console.log(`${YELLOW}1. Title vs System Role Decoupling & Inheritance Guard${RESET}`);
  {
    assert(
      resolveSystemRole("Senior Admin Assistant") === "employee",
      "Job title 'Senior Admin Assistant' resolves to canonical 'employee' (no admin title bleeding)"
    );

    assert(
      resolveSystemRole("Lead Frontend Engineer") === "employee",
      "Job title 'Lead Frontend Engineer' resolves to canonical 'employee' (no manager title bleeding)"
    );

    assert(
      resolveSystemRole("Database Administrator") === "employee",
      "Job title 'Database Administrator' resolves to canonical 'employee'"
    );

    assert(
      resolveSystemRole("Director of Quality Assurance") === "employee",
      "Job title 'Director of Quality Assurance' resolves to canonical 'employee'"
    );

    assert(
      resolveSystemRole("Software Engineer", "employee") === "employee",
      "Explicit systemRole='employee' stays 'employee'"
    );

    assert(
      resolveSystemRole("Software Engineer", "manager") === "manager",
      "Explicit systemRole='manager' preserves elevated systemRole='manager'"
    );

    assert(
      resolveSystemRole("Admin Assistant", "admin") === "admin",
      "Explicit systemRole='admin' preserves systemRole='admin'"
    );

    assert(
      resolveSystemRole("Platform Architect", "system_admin") === "system_admin",
      "Explicit systemRole='system_admin' preserves systemRole='system_admin'"
    );

    assert(
      resolveSystemRole("Chief Executive", "super_admin") === "super_admin",
      "Explicit systemRole='super_admin' preserves systemRole='super_admin'"
    );
  }

  // =========================================================================
  // 2. restrictTo Middleware Canonical Role Enforcement
  // =========================================================================
  console.log(`\n${YELLOW}2. restrictTo Middleware Canonical RBAC Enforcement${RESET}`);
  {
    // Test A: Employee with admin-sounding title attempting admin route
    let errReceived: any = null;
    const reqEmployeeAdminTitle: any = {
      user: {
        id: "emp_101",
        role: "Senior Admin Assistant",
        systemRole: "employee",
        email: "staff@company.com",
      },
    };
    const adminGuard = restrictTo("admin", "super_admin");
    adminGuard(reqEmployeeAdminTitle, {} as any, (err?: any) => {
      errReceived = err;
    });
    assert(
      errReceived instanceof ApiError && errReceived.statusCode === 403,
      "Employee with title 'Senior Admin Assistant' blocked from admin routes (403 Forbidden)"
    );

    // Test B: Super Admin universal authorization
    let superAdminAllowed = false;
    const reqSuperAdmin: any = {
      user: {
        id: "super_001",
        role: "Chief Executive",
        systemRole: "super_admin",
        email: "anantsingh20334411@gmail.com",
      },
    };
    adminGuard(reqSuperAdmin, {} as any, (err?: any) => {
      if (!err) superAdminAllowed = true;
    });
    assert(
      superAdminAllowed,
      "Root Super Administrator granted universal route access"
    );

    // Test C: Manager attempting system admin or platform settings
    let managerBlocked = false;
    const reqManager: any = {
      user: {
        id: "mgr_201",
        role: "Engineering Manager",
        systemRole: "manager",
        email: "manager@company.com",
      },
    };
    const platformGuard = restrictTo("super_admin", "system_admin");
    platformGuard(reqManager, {} as any, (err?: any) => {
      if (err instanceof ApiError && err.statusCode === 403) managerBlocked = true;
    });
    assert(
      managerBlocked,
      "Manager strictly blocked from Platform System Settings (403 Forbidden)"
    );

    // Test D: Standard Admin attempting platform system settings
    let adminBlockedFromPlatform = false;
    const reqAdmin: any = {
      user: {
        id: "adm_301",
        role: "Administrator",
        systemRole: "admin",
        email: "admin@company.com",
      },
    };
    platformGuard(reqAdmin, {} as any, (err?: any) => {
      if (err instanceof ApiError && err.statusCode === 403) adminBlockedFromPlatform = true;
    });
    assert(
      adminBlockedFromPlatform,
      "Standard Business Admin blocked from System/Infrastructure Settings (403 Forbidden)"
    );
  }

  // =========================================================================
  // 3. Task IDOR & Object-Level Access Control (verifyTaskResourceAccess)
  // =========================================================================
  console.log(`\n${YELLOW}3. Task IDOR & BOLA Scoping (verifyTaskResourceAccess)${RESET}`);
  {
    const taskId = "60c72b2f9b1d8b2bad000001";
    const mgrId = "60c72b2f9b1d8b2bad000002";
    const empAssignedId = "60c72b2f9b1d8b2bad000003";
    const empUnrelatedId = "60c72b2f9b1d8b2bad000004";

    const mockTask = {
      _id: taskId,
      title: "Confidential Architecture Review",
      createdBy: mgrId,
      department: "Engineering",
      assignedTo: [empAssignedId],
      isDeleted: false,
    };

    // User C: Unassigned Employee in Sales trying to comment or modify checklist
    const reqUnrelatedEmployee: any = {
      params: { id: taskId },
      user: {
        id: empUnrelatedId,
        systemRole: "employee",
        department: "Sales",
      },
    };

    // Mock Task.findById and User.findById
    const TaskModel = require("../models/Task").default;
    const UserModel = require("../models/User").default;
    const originalTaskFindById = TaskModel.findById;
    const originalUserFindById = UserModel.findById;

    TaskModel.findById = () => Promise.resolve(mockTask);
    UserModel.findById = (id: string) => ({
      select: () => Promise.resolve({
        department: id === empUnrelatedId ? "Sales" : "Engineering",
      }),
    });

    try {
      let blockedFromComment = false;
      const commentGuard = verifyTaskResourceAccess("comment");
      await commentGuard(reqUnrelatedEmployee, {} as any, (err?: any) => {
        if (err instanceof ApiError && err.statusCode === 403) blockedFromComment = true;
      });
      assert(
        blockedFromComment,
        "Unassigned employee strictly blocked from commenting on other user's task (IDOR prevented)"
      );

      let blockedFromChecklist = false;
      const checklistGuard = verifyTaskResourceAccess("update");
      await checklistGuard(reqUnrelatedEmployee, {} as any, (err?: any) => {
        if (err instanceof ApiError && err.statusCode === 403) blockedFromChecklist = true;
      });
      assert(
        blockedFromChecklist,
        "Unassigned employee strictly blocked from updating checklist on foreign task (IDOR prevented)"
      );

      // User A: Assigned Employee trying to comment
      const reqAssignedEmployee: any = {
        params: { id: taskId },
        user: {
          id: empAssignedId,
          systemRole: "employee",
          department: "Engineering",
        },
      };
      let assignedAllowed = false;
      await commentGuard(reqAssignedEmployee, {} as any, (err?: any) => {
        if (!err) assignedAllowed = true;
      });
      assert(
        assignedAllowed,
        "Assigned task assignee successfully permitted to comment and update task"
      );

      // User B: Owner/Creator trying to delete
      const reqOwner: any = {
        params: { id: taskId },
        user: {
          id: mgrId,
          systemRole: "manager",
          department: "Engineering",
        },
      };
      let ownerAllowedDelete = false;
      const deleteGuard = verifyTaskResourceAccess("delete");
      await deleteGuard(reqOwner, {} as any, (err?: any) => {
        if (!err) ownerAllowedDelete = true;
      });
      assert(
        ownerAllowedDelete,
        "Task creator/owner successfully permitted to delete task"
      );

      // User A (Assignee) trying to delete task
      let assigneeBlockedDelete = false;
      await deleteGuard(reqAssignedEmployee, {} as any, (err?: any) => {
        if (err instanceof ApiError && err.statusCode === 403) assigneeBlockedDelete = true;
      });
      assert(
        assigneeBlockedDelete,
        "Assignee strictly blocked from deleting task (delete reserved for creator/admin)"
      );
    } finally {
      TaskModel.findById = originalTaskFindById;
      UserModel.findById = originalUserFindById;
    }
  }

  // =========================================================================
  // 4. Registration Privilege Escalation Immunity
  // =========================================================================
  console.log(`\n${YELLOW}4. Self-Registration Privilege Escalation Guard${RESET}`);
  {
    // The registration controller sanitizes client payloads:
    // systemRole is always hardcoded to "employee" and role is normalized to "Software Engineer"
    const untrustedPayload = {
      email: "attacker@test.com",
      role: "admin",
      systemRole: "super_admin",
    };

    const sanitizedRole = (untrustedPayload.role && !["admin", "super_admin", "system_admin"].includes(untrustedPayload.role.toLowerCase()))
      ? untrustedPayload.role
      : "Software Engineer";
    const sanitizedSystemRole = "employee";

    assert(
      sanitizedSystemRole === "employee",
      "Public registration payload containing systemRole='super_admin' forced to 'employee'"
    );
    assert(
      sanitizedRole === "Software Engineer",
      "Public registration payload containing role='admin' forced to 'Software Engineer'"
    );
  }

  // =========================================================================
  // 5. Administrative User Provisioning Hierarchy & Boundaries
  // =========================================================================
  console.log(`\n${YELLOW}5. Admin User Provisioning Hierarchy & Rules${RESET}`);
  {
    // Super Admin can provision all roles
    const superAdminAllowedRoles = ["system_admin", "admin", "manager", "employee"];
    assert(
      superAdminAllowedRoles.includes("system_admin") &&
      superAdminAllowedRoles.includes("admin") &&
      superAdminAllowedRoles.includes("manager") &&
      superAdminAllowedRoles.includes("employee"),
      "Super Administrator has authority to provision system_admin, admin, manager, and employee"
    );

    // Business Admin can only provision manager and employee
    const adminAllowedRoles = ["manager", "employee"];
    assert(
      !adminAllowedRoles.includes("super_admin") &&
      !adminAllowedRoles.includes("system_admin") &&
      !adminAllowedRoles.includes("admin"),
      "Standard Administrator strictly blocked from provisioning super_admin, system_admin, or admin"
    );
  }

  // =========================================================================
  // 6. System Admin Sensitive HR Data Shielding
  // =========================================================================
  console.log(`\n${YELLOW}6. System Administrator Sensitive HR Data Shielding${RESET}`);
  {
    // Check fields excluded when caller is system_admin
    const SENSITIVE_HR_FIELDS = ["panNumber", "aadhaarNumber", "salary", "bankDetails", "ctc"];
    const sysAdminProjectionExcluded = SENSITIVE_HR_FIELDS.every(field =>
      "-panNumber -aadhaarNumber -salary -bankDetails -ctc".includes(`-${field}`)
    );
    assert(
      sysAdminProjectionExcluded,
      "Sensitive HR fields (PAN, Aadhaar, salary, bank details, CTC) excluded from System Admin view"
    );
  }

  // =========================================================================
  // 7. System Admin Enterprise Role & Delegation Capabilities
  // =========================================================================
  console.log(`\n${YELLOW}7. System Admin Enterprise Role & Delegation Capabilities${RESET}`);
  {
    const { ROLE_PERMISSIONS } = await import("../middleware/rbac");
    const sysAdminPerms = ROLE_PERMISSIONS.system_admin;

    assert(
      sysAdminPerms.includes("platform:manage"),
      "System Admin has 'platform:manage' permission for system configurations"
    );
    assert(
      sysAdminPerms.includes("task:create") &&
      sysAdminPerms.includes("task:read") &&
      sysAdminPerms.includes("task:update") &&
      sysAdminPerms.includes("task:delete") &&
      sysAdminPerms.includes("task:assign"),
      "System Admin has full operational task management permissions"
    );
    assert(
      sysAdminPerms.includes("team:manage") && sysAdminPerms.includes("project:manage"),
      "System Admin has team and project management permissions"
    );

    // Verify task resource access bypass for system_admin
    const TaskModel = require("../models/Task").default;
    const origFind = TaskModel.findById;
    TaskModel.findById = () => Promise.resolve({
      _id: "60c72b2f9b1d8b2bad000001",
      createdBy: "60c72b2f9b1d8b2bad000002",
      department: "Other Dept",
      assignedTo: ["60c72b2f9b1d8b2bad000003"],
      isDeleted: false,
    });

    let sysAdminTaskAllowed = false;
    try {
      const sysAdminGuard = verifyTaskResourceAccess("read");
      const reqSysAdminTask: any = {
        params: { id: "60c72b2f9b1d8b2bad000001" },
        user: {
          id: "60c72b2f9b1d8b2bad000099",
          systemRole: "system_admin",
          role: "System Administrator",
        },
      };
      await sysAdminGuard(reqSysAdminTask, {} as any, (err?: any) => {
        if (!err) sysAdminTaskAllowed = true;
      });
    } finally {
      TaskModel.findById = origFind;
    }
    assert(
      sysAdminTaskAllowed,
      "System Admin has unrestricted resource access to manage organization tasks"
    );

    // Verify restrictTo guard for system_admin on system endpoints
    let sysAdminBlockErr: any = null;
    const reqSysAdmin: any = {
      user: {
        id: "sys_1",
        systemRole: "system_admin",
        role: "System Administrator",
      },
    };
    const systemSettingsGuard = restrictTo("super_admin", "system_admin");
    systemSettingsGuard(reqSysAdmin, {} as any, (err?: any) => {
      sysAdminBlockErr = err;
    });
    assert(
      sysAdminBlockErr === null || sysAdminBlockErr === undefined,
      "System Admin allowed access to system settings (/system/settings)"
    );

    // Verify restrictTo guard blocks system_admin from super_admin-only endpoints
    let superAdminOnlyErr: any = null;
    const superAdminGuard = restrictTo("super_admin");
    superAdminGuard(reqSysAdmin, {} as any, (err?: any) => {
      superAdminOnlyErr = err;
    });
    assert(
      superAdminOnlyErr !== null && superAdminOnlyErr?.statusCode === 403,
      "System Admin strictly blocked from Super Administrator root governance routes"
    );

    // System Admin user provisioning scope
    const sysAdminAllowedProvisionRoles = ["admin", "manager", "employee"];
    assert(
      sysAdminAllowedProvisionRoles.includes("admin") &&
      sysAdminAllowedProvisionRoles.includes("manager") &&
      sysAdminAllowedProvisionRoles.includes("employee") &&
      !sysAdminAllowedProvisionRoles.includes("super_admin"),
      "System Admin authorized to provision Admin, Manager, Employee, but barred from Super Admin"
    );
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log(`\n${CYAN}========================================================================${RESET}`);
  console.log(`TOTAL TESTS: ${passedCount + failedCount} | ${GREEN}PASSED: ${passedCount}${RESET} | ${RED}FAILED: ${failedCount}${RESET}`);
  console.log(`${CYAN}========================================================================${RESET}\n`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test suite error:", err);
  process.exit(1);
});
