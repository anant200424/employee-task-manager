import { Response, NextFunction } from "express";
import Task from "../models/Task";
import User from "../models/User";
import Message from "../models/Message";
import { AuthRequest } from "../middleware/auth";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { resolveSystemRole } from "../middleware/rbac";

/**
 * Intelligent, Role-Based Workspace AI Copilot
 * - Admin Mode: Full company access, real-time analytics, predictive delay forecasting, team workload balancing.
 * - Employee Mode: Strict privacy & isolation to personal assigned tasks and profile data; security guardrails on unauthorized queries.
 * - Predictive Engine: Task delay risk modeling, sprint delivery forecasts, bottleneck detection.
 * - Bilingual NLP: Supports English and Hindi / Hinglish queries naturally.
 * 
 * @route POST /api/ai/chat
 */
export const chatWithAI = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { prompt } = req.body;
    const userId = req.user?.id;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      throw new ApiError(400, "Prompt is required.");
    }

    const cleanPrompt = prompt.trim();
    const query = cleanPrompt.toLowerCase();

    // 1. Determine Authenticated User & Role
    const currentUser = userId
      ? await User.findById(userId)
          .select("firstName lastName role department email employeeId employmentInfo")
          .lean()
      : null;

    const userSysRole = resolveSystemRole(
      currentUser?.role || req.user?.role,
      (currentUser as any)?.systemRole || req.user?.systemRole
    );
    const isAdmin =
      ["super_admin", "system_admin", "admin"].includes(userSysRole) ||
      currentUser?.role?.toLowerCase() === "admin" ||
      req.user?.role?.toLowerCase() === "admin";

    const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Team Member";
    const userRole = currentUser?.role || (isAdmin ? "Administrator" : "Employee");
    const userDept = currentUser?.department || "General";

    // 2. Role-Based Data Isolation & Fetching
    let allTasks: any[] = [];
    let allUsers: any[] = [];
    let recentAnnouncements: any[] = [];

    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    if (isAdmin) {
      // ADMIN: Full Company-Wide Scope
      [allTasks, allUsers, recentAnnouncements] = await Promise.all([
        Task.find()
          .populate("assignedTo", "firstName lastName email department role employeeId")
          .sort({ dueDate: 1, createdAt: -1 })
          .lean(),
        User.find({ isBlocked: { $ne: true } })
          .select("firstName lastName email role department employeeId employmentInfo createdAt")
          .lean(),
        Message.find({ type: "announcement" })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);
    } else {
      // EMPLOYEE: Strictly Scoped to Their Own Tasks & Assigned Work
      [allTasks, recentAnnouncements] = await Promise.all([
        Task.find({
          $or: [
            { assignedTo: userId },
            { createdBy: userId },
          ],
        })
          .populate("assignedTo", "firstName lastName email department role employeeId")
          .sort({ dueDate: 1, createdAt: -1 })
          .lean(),
        Message.find({ type: "announcement" })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);
      allUsers = currentUser ? [currentUser] : [];
    }

    // 3. Computed Workspace & Personal Metrics
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "completed");
    const inProgressTasks = allTasks.filter((t) => t.status === "in_progress");
    const reviewTasks = allTasks.filter((t) => t.status === "review");
    const todoTasks = allTasks.filter((t) => t.status === "todo");
    const urgentTasks = allTasks.filter((t) => t.priority === "urgent" && t.status !== "completed");
    const highTasks = allTasks.filter((t) => t.priority === "high" && t.status !== "completed");

    // Overdue & At-Risk Tasks
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "completed",
    );
    const dueSoonTasks = allTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) >= now &&
        new Date(t.dueDate) <= in48Hours &&
        t.status !== "completed",
    );

    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // Helper: format assignees
    const getAssigneesText = (t: any): string => {
      if (!t.assignedTo || (Array.isArray(t.assignedTo) && t.assignedTo.length === 0)) {
        return "Unassigned";
      }
      const list = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
      return list.map((a: any) => `${a.firstName || ""} ${a.lastName || ""}`.trim()).filter(Boolean).join(", ") || "Assigned";
    };

    // Helper: format due date
    const formatDue = (d?: Date | string): string => {
      if (!d) return "No due date";
      const target = new Date(d);
      const isPast = target < now;
      const dateStr = target.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return isPast ? `⚠️ OVERDUE (${dateStr})` : dateStr;
    };

    let responseText = "";

    // =========================================================================
    // INTENT CHECK 0: Employee Privacy & Role Security Guardrail
    // =========================================================================
    const unauthorizedQueryPatterns = [
      "all employee", "all staff", "other employee", "other user", "all salary",
      "all salaries", "sabka salary", "sabka data", "baki employee", "dusre employee",
      "admin portal", "admin access", "system settings", "all users list", "who earns",
      "company revenue", "kiski salary", "kiske kitne", "sabka task dikhao"
    ];

    const isAskingUnauthorized = !isAdmin && unauthorizedQueryPatterns.some((pattern) => query.includes(pattern));

    if (isAskingUnauthorized) {
      responseText = `### 🔒 Enterprise Role Security & Data Privacy Notice

Hello **${currentUser?.firstName || "Team Member"}**, you are currently signed in with the **\`${userRole}\`** role.

In compliance with **EmpSphere Enterprise Data Governance** and role-based access control (RBAC):
* 🛡️ **Your Scope:** You have access **only to your personal profile, assigned tasks, and projects** that you participate in.
* 🚫 **Restricted:** Organization-wide staff rosters, executive analytics, admin controls, and other team members' confidential information are restricted to **System Administrators**.

#### 📋 Your Quick Access Shortcuts:
* Ask: *"What tasks are assigned to me?"*
* Ask: *"Show my upcoming deadlines"*
* Ask: *"Suggest my next priority item"*

> *If you require elevated administrative permissions, please contact your Organization Administrator.*`;
    }

    // =========================================================================
    // INTENT 1: Predictive Analytics, Task Delays & Sprint Forecasting
    // Keywords (English + Hindi/Hinglish): predict, forecast, delay, risk, kab khatam hoga, kab tak, bottleneck, deadline
    // =========================================================================
    else if (
      query.includes("predict") || query.includes("forecast") || query.includes("delay") ||
      query.includes("late") || query.includes("kab khatam") || query.includes("kab tak") ||
      query.includes("bottleneck") || query.includes("risk") || query.includes("projection") ||
      query.includes("timeline")
    ) {
      if (isAdmin) {
        // ADMIN PREDICTIVE REPORT
        const remainingTasks = totalTasks - completedTasks.length;
        const criticalRiskCount = overdueTasks.length + urgentTasks.filter((t) => t.status === "todo").length;
        const delayRiskLevel = criticalRiskCount > 4 ? "🚨 HIGH RISK" : criticalRiskCount > 1 ? "⚠️ MODERATE RISK" : "✅ LOW RISK (ON TRACK)";

        // Estimated delivery calculation (heuristic: 1.5 - 2 tasks per active team member per sprint cycle)
        const teamSize = Math.max(1, allUsers.length);
        const estimatedSprintDays = Math.max(3, Math.ceil((remainingTasks / Math.max(1, teamSize * 1.8)) * 5));

        const delayList = overdueTasks.slice(0, 5).map((t) => {
          return `* 🚨 **\`${t.taskCode || "TSK"}\` ${t.title}**\n  * **Department:** \`${t.department}\` | **Assignee:** ${getAssigneesText(t)}\n  * **Status:** \`${t.status.toUpperCase()}\` | **Due:** ${formatDue(t.dueDate)}`;
        }).join("\n\n");

        const dueSoonList = dueSoonTasks.slice(0, 4).map((t) => {
          return `* ⏳ **\`${t.taskCode || "TSK"}\` ${t.title}** (${t.priority.toUpperCase()}) — Due in < 48h to ${getAssigneesText(t)}`;
        }).join("\n");

        responseText = `### 🔮 Workspace Predictive Health & Delivery Forecast

Here is the real-time predictive analysis of **EmpSphere Enterprise Sprint**:

| Predictive Metric | Forecast Value | Status / Benchmark |
| :--- | :--- | :--- |
| **Sprint Delay Risk** | **${delayRiskLevel}** | Calculated from overdue & urgent backlog |
| **Remaining Tasks** | \`${remainingTasks}\` tasks | Current active sprint pipeline |
| **Overdue Tasks** | \`${overdueTasks.length}\` items | **Immediate intervention required** |
| **At-Risk (Due <48h)** | \`${dueSoonTasks.length}\` items | Approaching deadline window |
| **Estimated Completion** | **~${estimatedSprintDays} working days** | Based on current team velocity (${teamSize} staff) |
| **Sprint Delivery Rate** | **${completionRate}%** | ${completedTasks.length} / ${totalTasks} completed |

---

#### 🚨 Critical Overdue Tasks Predicted to Delay Milestones:
${overdueTasks.length === 0 ? "✅ *No tasks are currently overdue.*" : delayList}

#### ⏳ Approaching Deadlines (Next 48 Hours):
${dueSoonTasks.length === 0 ? "✅ *No imminent task deadlines within 48 hours.*" : dueSoonList}

---

### 💡 Executive Recommendations & Action Plan:
1. **Reallocate Bottlenecks:** Reassign overdue tasks from high-load departments to available team members.
2. **Review Clearance:** **${reviewTasks.length} tasks** are awaiting review. Clearing QA will boost sprint completion rate by **${totalTasks > 0 ? Math.round((reviewTasks.length / totalTasks) * 100) : 0}%**.
3. **Sprint Forecast:** To complete remaining \`${remainingTasks}\` tasks within target schedule, prioritize \`URGENT\` items first.`;
      } else {
        // EMPLOYEE PERSONAL PREDICTION
        const myRemaining = totalTasks - completedTasks.length;
        const myOverdue = overdueTasks;
        const myDueSoon = dueSoonTasks;

        const myRiskLevel = myOverdue.length > 0 ? "⚠️ ATTENTION NEEDED" : myDueSoon.length > 0 ? "⚡ TIGHT DEADLINES" : "✅ ON TRACK";

        responseText = `### 🔮 Your Personal Workload & Deadline Forecast

Based on your assigned tasks, here is your predicted delivery timeline:

| Personal Metric | Value | Status |
| :--- | :--- | :--- |
| **Workload Risk** | **${myRiskLevel}** | Based on scheduled due dates |
| **Active Workload** | \`${myRemaining}\` tasks | Assigned directly to you |
| **Overdue Items** | \`${myOverdue.length}\` tasks | Needs immediate resolution |
| **Due Next 48h** | \`${myDueSoon.length}\` tasks | Upcoming delivery commitments |
| **Your Completion** | **${completionRate}%** | \`${completedTasks.length}\` done out of \`${totalTasks}\` |

---

#### 🎯 Recommended Action Order for You:
${
  myOverdue.length > 0
    ? `1. 🚨 **Fix Overdue First:** Complete **\`${myOverdue[0].taskCode || "TSK"}\` ${myOverdue[0].title}** immediately.`
    : myDueSoon.length > 0
    ? `1. ⏳ **Imminent Deadline:** Focus on **\`${myDueSoon[0].taskCode || "TSK"}\` ${myDueSoon[0].title}** due in <48 hours.`
    : "1. 📌 **Normal Flow:** Pick your top \`IN_PROGRESS\` task and continue steady progress."
}
2. **Move to Review:** When done, change task status to \`REVIEW\` in the **[Tasks Workspace](/tasks)** so your lead can approve it.`;
      }
    }

    // =========================================================================
    // INTENT 2: My Tasks / Assigned Tasks (Bilingual: English + Hindi/Hinglish)
    // Keywords: my task, mera task, assigned to me, what should i do, pending, mera kaam, kya pending
    // =========================================================================
    else if (
      query.includes("my task") || query.includes("mera task") || query.includes("assigned to me") ||
      query.includes("what should i do") || query.includes("kya pending") || query.includes("mera kaam") ||
      query.includes("my pending") || query.includes("my work") || query.includes("mujhe kya karna") ||
      query.includes("kaam bacha")
    ) {
      if (allTasks.length === 0) {
        responseText = `### 📋 Your Assigned Tasks
        
You currently have **0 active tasks** directly assigned to your account in this sprint.

> 💡 **Tip:** Check the **[Task Workspace](/tasks)** to create or claim new project tasks.`;
      } else {
        const taskItems = allTasks.map((t) => {
          const statusIcon =
            t.status === "completed" ? "✅" : t.status === "in_progress" ? "⏳" : t.status === "review" ? "🔍" : "📌";
          const priorityBadge =
            t.priority === "urgent" ? "🚨 `URGENT`" : t.priority === "high" ? "🔥 `HIGH`" : `\`${t.priority.toUpperCase()}\``;
          return `* ${statusIcon} **\`${t.taskCode || "TSK"}\` ${t.title}**\n  * **Status:** \`${t.status.toUpperCase()}\` | **Priority:** ${priorityBadge}\n  * **Due Date:** ${formatDue(t.dueDate)}${t.description ? `\n  * *${t.description.slice(0, 90)}...*` : ""}`;
        }).join("\n\n");

        responseText = `### 📋 Tasks Assigned to You (${allTasks.length})

Here is your current assigned workload overview:

${taskItems}

---
*Manage and update task statuses in real-time in **[Task Workspace](/tasks)**.*`;
      }
    }

    // =========================================================================
    // INTENT 3: Urgent / Critical / Blockers
    // Keywords: urgent, blocker, critical, high priority, emergency, atki
    // =========================================================================
    else if (
      query.includes("urgent") || query.includes("blocker") || query.includes("critical") ||
      query.includes("high priority") || query.includes("emergency") || query.includes("atki") ||
      query.includes("phas") || query.includes("important")
    ) {
      const targetTasks = [...urgentTasks, ...highTasks];
      if (targetTasks.length === 0) {
        responseText = `### 🛡️ Critical Workload Check
        
Great news! There are currently **no urgent or critical blockers** pending in your workspace. All deliverables are moving smoothly.`;
      } else {
        const list = targetTasks.slice(0, 6).map((t) => {
          return `* 🚨 **\`${t.taskCode || "TSK"}\` ${t.title}**\n  * **Priority:** \`${t.priority.toUpperCase()}\` | **Status:** \`${t.status.toUpperCase()}\`\n  * **Assignee:** ${getAssigneesText(t)} | **Due:** ${formatDue(t.dueDate)}`;
        }).join("\n\n");

        responseText = `### ⚠️ High Priority & Urgent Blockers (${targetTasks.length})

The following items require immediate priority resolution:

${list}

> **Recommended Action:** Address urgent items before taking on new backlog tasks.`;
      }
    }

    // =========================================================================
    // INTENT 4: Workspace Summary / Dashboard Metrics / Overview
    // Keywords: summary, overview, stats, dashboard, progress, how are we doing, completion rate
    // =========================================================================
    else if (
      query.includes("summary") || query.includes("overview") || query.includes("stats") ||
      query.includes("dashboard") || query.includes("how are we doing") || query.includes("progress") ||
      query.includes("completion rate") || query.includes("kaisa chal raha") || query.includes("report")
    ) {
      if (isAdmin) {
        responseText = `### 📊 Enterprise Workspace Dashboard Summary

Here is the live company-wide operational overview:

| Metric | Count | Operational Benchmark |
| :--- | :--- | :--- |
| **Total Tasks** | \`${totalTasks}\` | Active Sprint Catalog |
| **Completed** | \`${completedTasks.length}\` | **${completionRate}% Sprint Delivery** |
| **In Progress** | \`${inProgressTasks.length}\` | Active Execution |
| **In Review** | \`${reviewTasks.length}\` | Validation / QA Pipeline |
| **To Do (Backlog)** | \`${todoTasks.length}\` | Queued Tasks |
| **Overdue** | \`${overdueTasks.length}\` | ${overdueTasks.length > 0 ? "⚠️ Needs Attention" : "✅ 0 Overdue"} |
| **Verified Staff** | \`${allUsers.length}\` | Active Employees |

**Key Highlights:**
* 🎯 Overall sprint delivery is at **${completionRate}%**.
* 🔥 **${inProgressTasks.length} tasks** are actively in development.
* 🔍 **${reviewTasks.length} tasks** are awaiting code/deliverable review.
* 👥 **${allUsers.length} verified team members** are mapped across Engineering, Design, Operations, and Management.`;
      } else {
        responseText = `### 📊 Your Personal Workspace Summary

Here is your personal workload status for this sprint:

| Your Metric | Count | Status |
| :--- | :--- | :--- |
| **Assigned Tasks** | \`${totalTasks}\` | Total assigned to you |
| **Completed** | \`${completedTasks.length}\` | **${completionRate}% Personal Velocity** |
| **In Progress** | \`${inProgressTasks.length}\` | Currently working on |
| **In Review** | \`${reviewTasks.length}\` | Submitted for approval |
| **Pending Backlog** | \`${todoTasks.length}\` | Up next |
| **Overdue** | \`${overdueTasks.length}\` | ${overdueTasks.length > 0 ? "⚠️ Overdue" : "✅ None"} |

> *Keep updating your task status in the **[Task Workspace](/tasks)** to maintain accurate velocity.*`;
      }
    }

    // =========================================================================
    // INTENT 5: Team / Employees / Staff Directory
    // Keywords: team, employee, staff, department, directory, kaun kaun hai, members
    // =========================================================================
    else if (
      query.includes("team") || query.includes("employee") || query.includes("staff") ||
      query.includes("department") || query.includes("who is in") || query.includes("kaun hai") ||
      query.includes("directory")
    ) {
      if (isAdmin) {
        const depts: Record<string, number> = {};
        allUsers.forEach((u) => {
          const d = u.department || "General";
          depts[d] = (depts[d] || 0) + 1;
        });

        const deptSummary = Object.entries(depts)
          .map(([dName, count]) => `* **${dName}:** \`${count}\` team member(s)`)
          .join("\n");

        const sampleRoster = allUsers.slice(0, 6).map((u) => {
          return `* **${u.firstName} ${u.lastName}** (\`${u.employeeId || "EMP"}\`) — *\`${u.role || "Staff"}\`* • \`${u.department || "General"}\``;
        }).join("\n");

        responseText = `### 👥 Enterprise Employee Directory & Departments

**Total Active Personnel:** **${allUsers.length} members**

#### Department Breakdown:
${deptSummary}

#### Active Staff Roster:
${sampleRoster}

---
*For role management, credentials, and access control, visit the **[Employee Directory](/employees)**.*`;
      } else {
        responseText = `### 👥 Your Department & Team Information

* **Your Name:** **${userName}**
* **Role:** \`${userRole}\`
* **Department:** \`${userDept}\`
* **Employee Code:** \`${currentUser?.employeeId || "EMP-1042"}\`

> 💡 *Note: Detailed company-wide personnel directories and HR management are accessible by System Administrators.*`;
      }
    }

    // =========================================================================
    // INTENT 6: Announcements / Workspace Hub
    // =========================================================================
    else if (
      query.includes("announcement") || query.includes("broadcast") || query.includes("workspace hub") ||
      query.includes("news") || query.includes("update")
    ) {
      if (recentAnnouncements.length === 0) {
        responseText = `### 📢 Workspace Announcements

No recent broadcast announcements have been posted yet.

> Administrators can broadcast announcements to all team members in the **[Workspace Hub](/empty-states)**.`;
      } else {
        const newsList = recentAnnouncements.map((a) => {
          return `* 📢 **${a.senderName}** (*${a.senderRole}*)\n  > "${a.content}"\n  *Posted ${new Date(a.createdAt).toLocaleDateString()}*`;
        }).join("\n\n");

        responseText = `### 📢 Latest Workspace Announcements

${newsList}

---
*Join the live team discussion in **[Workspace Hub](/empty-states)**.*`;
      }
    }

    // =========================================================================
    // INTENT 7: Drafting & Writing Assistant
    // Keywords: draft, write, template, email, announcement, likho, message
    // =========================================================================
    else if (
      query.includes("draft") || query.includes("write") || query.includes("create task") ||
      query.includes("template") || query.includes("email") || query.includes("likho") ||
      query.includes("message")
    ) {
      if (query.includes("announcement") || query.includes("broadcast")) {
        responseText = `### 📝 Suggested Company Broadcast Draft

**Subject:** Sprint Milestone & System Update  
**Broadcast Content:**
> "Team, we have achieved **${completionRate}% sprint completion**. Outstanding delivery across all departments! Please ensure all pending tasks in \`REVIEW\` are approved by Friday."

*You can post this directly to all employees in **[Workspace Hub](/empty-states)**.*`;
      } else {
        responseText = `### 💡 Task & Sprint Deliverable Proposal

**Task Title:** [Feature / Optimization Deliverable]  
**Department:** \`${userDept}\`  
**Priority:** \`HIGH\` | **Target Turnaround:** 3 business days  

**Acceptance Criteria:**
1. Complete core functional implementation with full test coverage.
2. Verify API contract and database schema integrity.
3. Submit for peer review in the Task Workspace.`;
      }
    }

    // =========================================================================
    // DEFAULT: Role-Tailored Conversational Assistant
    // =========================================================================
    else {
      if (isAdmin) {
        responseText = `Hello **${currentUser?.firstName || "Administrator"}**! 🛡️ I am your **EmpSphere Executive AI Copilot**.

I have full, live access to your company database, employee directory, task pipelines, and predictive forecasting models.

### ⚡ What You Can Ask Me:
* 🔮 **Predictive Analytics:** *"Predict task delays and sprint completion timeline"*
* 📊 **Executive Summary:** *"Show complete workspace health & velocity"*
* 🚨 **Critical Blockers:** *"List all overdue and high priority tasks"*
* 👥 **Staff & Workload:** *"Show department breakdown and team allocation"*
* 📝 **Broadcasting:** *"Draft a company sprint announcement"*

*How can I assist you with your organization management today?*`;
      } else {
        responseText = `Hello **${currentUser?.firstName || "there"}**! 👋 I am your **EmpSphere Personal AI Assistant**.

I am connected to your personal workspace to help you track your assigned deliverables, manage deadlines, and boost productivity.

### ⚡ What You Can Ask Me:
* 📋 **My Tasks:** *"What tasks are assigned to me?"*
* ⏳ **Deadlines & Forecast:** *"Show my upcoming deadlines and delay risk"*
* 🎯 **Priority Guidance:** *"What should I work on next?"*
* ✍️ **Drafting:** *"Draft a task update for my team lead"*

*How can I help you with your tasks today?*`;
      }
    }

    sendSuccess(res, 200, "AI response generated successfully.", {
      response: responseText,
      timestamp: new Date().toISOString(),
      user: userName,
      role: userRole,
      isAdmin,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns live role-aware context snapshot for the AI Copilot.
 * 
 * @route GET /api/ai/context
 */
export const getAIContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const user = userId ? await User.findById(userId).select("role systemRole department firstName lastName").lean() : null;
    const userSysRole = resolveSystemRole(
      user?.role || req.user?.role,
      (user as any)?.systemRole || req.user?.systemRole
    );
    const isAdmin =
      ["super_admin", "system_admin", "admin"].includes(userSysRole) ||
      user?.role?.toLowerCase() === "admin" ||
      req.user?.role?.toLowerCase() === "admin";

    let taskCount = 0;
    let completedCount = 0;
    let userCount = 1;
    let messageCount = 0;

    if (isAdmin) {
      [taskCount, completedCount, userCount, messageCount] = await Promise.all([
        Task.countDocuments(),
        Task.countDocuments({ status: "completed" }),
        User.countDocuments({ isBlocked: { $ne: true } }),
        Message.countDocuments(),
      ]);
    } else {
      [taskCount, completedCount, messageCount] = await Promise.all([
        Task.countDocuments({ $or: [{ assignedTo: userId }, { createdBy: userId }] }),
        Task.countDocuments({ $or: [{ assignedTo: userId }, { createdBy: userId }], status: "completed" }),
        Message.countDocuments(),
      ]);
    }

    const completionRate = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

    sendSuccess(res, 200, "AI context fetched successfully.", {
      connected: true,
      role: isAdmin ? "admin" : "employee",
      totalTasks: taskCount,
      completedTasks: completedCount,
      completionRate: `${completionRate}%`,
      activeUsers: userCount,
      totalMessages: messageCount,
      capabilities: isAdmin
        ? [
            "Company-Wide Real-Time Tracking",
            "Predictive Delay & Delivery Modeling",
            "Full Employee Directory Intelligence",
            "Department Bottleneck Identification",
            "Executive Broadcast Drafting",
          ]
        : [
            "Personal Assigned Task Tracking",
            "Personal Deadline & Delivery Forecasts",
            "Strict Role Data Isolation & Privacy",
            "Action Item Prioritization",
            "Task Update Drafting",
          ],
    });
  } catch (error) {
    next(error);
  }
};

