import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import User from "./models/User";
import Task from "./models/Task";

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://anantsingh20334411_db_user:r0JD1tRZayx8aIxP@cluster0.3txsth7.mongodb.net/task_manager";

// Comprehensive catalog of production-grade task templates per department
const departmentTaskTemplates: Record<
  string,
  Array<{
    title: string;
    description: string;
    priority: "urgent" | "high" | "medium" | "low";
    status: "todo" | "in_progress" | "review" | "completed";
    tags: string[];
    daysAgoCreated: number;
    daysOffsetDue: number;
  }>
> = {
  Engineering: [
    {
      title: "Deploy Multi-Zone Kubernetes Auto-Scaler & Node Pool",
      description: "Implement cluster autoscaler with spot instance fallbacks across primary AWS availability zones.",
      priority: "urgent",
      status: "in_progress",
      tags: ["DevOps", "Kubernetes", "Infrastructure"],
      daysAgoCreated: 2,
      daysOffsetDue: 3,
    },
    {
      title: "Build Zero-Copy Redis Response Caching Layer",
      description: "Optimize high-frequency API gateway endpoints using Redis cluster pipeline caching with 60s TTL.",
      priority: "high",
      status: "completed",
      tags: ["Redis", "Backend", "Performance"],
      daysAgoCreated: 5,
      daysOffsetDue: -1,
    },
    {
      title: "Refactor Authentication Middleware & Device Fingerprinting",
      description: "Enhance security guard with IP reputation scoring and automated brute-force lockouts.",
      priority: "urgent",
      status: "review",
      tags: ["Security", "Auth", "Middleware"],
      daysAgoCreated: 3,
      daysOffsetDue: 1,
    },
    {
      title: "Draft Webhook Ingestion Engine with Exponential Backoff Retry",
      description: "Design fault-tolerant event dispatcher supporting signed HMAC signatures and dead-letter queues.",
      priority: "medium",
      status: "todo",
      tags: ["Architecture", "Webhooks", "Queue"],
      daysAgoCreated: 1,
      daysOffsetDue: 10,
    },
    {
      title: "Implement Export Engine for PDF, Excel and JSON Reports",
      description: "Built multi-format client export utility with high-resolution canvas capture and streaming buffer generation.",
      priority: "high",
      status: "completed",
      tags: ["Export", "Frontend", "Reporting"],
      daysAgoCreated: 6,
      daysOffsetDue: -2,
    },
    {
      title: "GraphQL Apollo Federation Schema Integration",
      description: "Consolidate user entity subgraph and task subgraph with federated gateway query planner.",
      priority: "medium",
      status: "in_progress",
      tags: ["GraphQL", "API", "Federation"],
      daysAgoCreated: 4,
      daysOffsetDue: 5,
    },
  ],
  Operations: [
    {
      title: "Zero-Downtime Database Migration & Schema Index Optimization",
      description: "Execute compound B-tree index creation in background mode on high-cardinality task collections.",
      priority: "urgent",
      status: "completed",
      tags: ["Database", "Operations", "MongoDB"],
      daysAgoCreated: 7,
      daysOffsetDue: -3,
    },
    {
      title: "Prometheus & Grafana Workspace Health Alerting Rules",
      description: "Set up P99 latency alerts, memory threshold warnings, and automated Slack escalation triggers.",
      priority: "high",
      status: "in_progress",
      tags: ["Monitoring", "Grafana", "DevOps"],
      daysAgoCreated: 3,
      daysOffsetDue: 4,
    },
    {
      title: "Quarterly Disaster Recovery Simulation & Backup Restore Validation",
      description: "Conduct air-gapped backup restoration drill and measure recovery time objective under 120 seconds.",
      priority: "urgent",
      status: "review",
      tags: ["Disaster Recovery", "Backup", "Security"],
      daysAgoCreated: 4,
      daysOffsetDue: 2,
    },
    {
      title: "SOC2 Type II Audit Log Aggregation Pipeline Setup",
      description: "Stream immutable audit events to encrypted S3 bucket with retention lock policies.",
      priority: "medium",
      status: "todo",
      tags: ["Compliance", "Audit", "SaaS"],
      daysAgoCreated: 2,
      daysOffsetDue: 14,
    },
    {
      title: "Global CDN Edge Routing & Static Asset Compression",
      description: "Configure Brotli compression and Cloudflare edge cache rules for static JS/CSS bundles.",
      priority: "medium",
      status: "completed",
      tags: ["CDN", "Performance", "Cloudflare"],
      daysAgoCreated: 8,
      daysOffsetDue: -4,
    },
  ],
  Design: [
    {
      title: "Design System 2.0 Color Palette & Contrast Accessibility Audit",
      description: "Audit WCAG 2.1 AAA compliance across all light and dark mode tokens for dashboard components.",
      priority: "high",
      status: "completed",
      tags: ["Design System", "Tokens", "Accessibility"],
      daysAgoCreated: 6,
      daysOffsetDue: -1,
    },
    {
      title: "Interactive Personal Sprint Calendar & Day Agenda UX",
      description: "Design intuitive month stepper, active day indicator ring, and mini-task badge layout.",
      priority: "urgent",
      status: "in_progress",
      tags: ["UI/UX", "Calendar", "Micro-Interactions"],
      daysAgoCreated: 2,
      daysOffsetDue: 3,
    },
    {
      title: "Mobile App Companion Prototype & Gestural Motion Specs",
      description: "Build interactive Figma prototype with micro-haptic triggers for iOS and Android.",
      priority: "medium",
      status: "review",
      tags: ["Prototype", "Mobile", "Framer"],
      daysAgoCreated: 4,
      daysOffsetDue: 5,
    },
    {
      title: "Enterprise Executive Presentation Deck & Brand Guidelines",
      description: "Standardize typography, iconography, and slide deck components for enterprise pitches.",
      priority: "low",
      status: "todo",
      tags: ["Branding", "Marketing", "Deck"],
      daysAgoCreated: 1,
      daysOffsetDue: 12,
    },
  ],
  "Human Resources": [
    {
      title: "Automated Employee Identity Verification & Document Portal",
      description: "Implement PAN, Aadhar, and UAN compliance pipeline with instant OCR parsing.",
      priority: "high",
      status: "completed",
      tags: ["HR Tech", "Compliance", "Verification"],
      daysAgoCreated: 7,
      daysOffsetDue: -2,
    },
    {
      title: "H2 Annual Performance Appraisal Calibration Matrix",
      description: "Configure peer review forms, 360-degree feedback loops, and compensation band benchmarks.",
      priority: "urgent",
      status: "in_progress",
      tags: ["Performance", "Appraisal", "HR"],
      daysAgoCreated: 3,
      daysOffsetDue: 4,
    },
    {
      title: "Remote Work & Global Healthcare Benefits Policy Update",
      description: "Publish international contractor guidelines and wellness reimbursement subsidy framework.",
      priority: "medium",
      status: "review",
      tags: ["Benefits", "Policy", "Workforce"],
      daysAgoCreated: 5,
      daysOffsetDue: 2,
    },
    {
      title: "Campus Recruiting Drive & Technical Internship Curriculum",
      description: "Prepare coding assessment rubrics and interview schedule for upcoming university hiring.",
      priority: "low",
      status: "todo",
      tags: ["Recruiting", "Hiring", "University"],
      daysAgoCreated: 2,
      daysOffsetDue: 20,
    },
  ],
  "Sales & Business Dev": [
    {
      title: "Q3 Enterprise SaaS Security Whitepaper & RFP Response",
      description: "Draft comprehensive vendor security questionnaire responses for Fortune 500 prospect.",
      priority: "urgent",
      status: "in_progress",
      tags: ["Sales", "Enterprise", "RFP"],
      daysAgoCreated: 2,
      daysOffsetDue: 3,
    },
    {
      title: "Tier-1 Customer Onboarding & 99.98% SLA Agreement Framework",
      description: "Formalized dedicated customer success manager SLAs and 1-hour priority support tiers.",
      priority: "high",
      status: "completed",
      tags: ["SLA", "Customer Success", "Enterprise"],
      daysAgoCreated: 6,
      daysOffsetDue: -1,
    },
    {
      title: "Sales Pipeline Velocity & Conversion Funnel Dashboard",
      description: "Map inbound marketing MQL to SQL conversion ratios and average deal velocity in days.",
      priority: "medium",
      status: "review",
      tags: ["Pipeline", "Analytics", "Revenue"],
      daysAgoCreated: 4,
      daysOffsetDue: 3,
    },
    {
      title: "EMEA Regional Channel Partner Incentive Program",
      description: "Draft commission tiers and reseller agreements for European market expansion.",
      priority: "low",
      status: "todo",
      tags: ["Partnerships", "Expansion", "EMEA"],
      daysAgoCreated: 1,
      daysOffsetDue: 18,
    },
  ],
};

// Fallback general templates
const generalTaskTemplates = [
  {
    title: "Quarterly OKR Alignment & Cross-Functional Sync",
    description: "Review strategic milestones, blockers, and team dependencies for the current execution cycle.",
    priority: "high" as const,
    status: "completed" as const,
    tags: ["Strategy", "OKRs", "Leadership"],
    daysAgoCreated: 5,
    daysOffsetDue: -1,
  },
  {
    title: "System Architecture & Security Hardening Review",
    description: "Perform code audit, dependency vulnerability scanning, and OWASP Top 10 mitigation verification.",
    priority: "urgent" as const,
    status: "in_progress" as const,
    tags: ["Security", "Audit", "Engineering"],
    daysAgoCreated: 2,
    daysOffsetDue: 4,
  },
  {
    title: "Weekly Sprint Retrospective & Velocity Planning",
    description: "Analyze story point completion velocity, sprint burndown chart, and action items for next sprint.",
    priority: "medium" as const,
    status: "review" as const,
    tags: ["Agile", "Scrum", "Sprint"],
    daysAgoCreated: 3,
    daysOffsetDue: 2,
  },
  {
    title: "Enterprise Continuous Integration & Test Suite Expansion",
    description: "Achieve 85% code coverage across authentication, user management, and task controller endpoints.",
    priority: "medium" as const,
    status: "todo" as const,
    tags: ["Testing", "Jest", "Quality"],
    daysAgoCreated: 1,
    daysOffsetDue: 8,
  },
];

async function populateAllEmployees() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} total users in database.`);

    const now = new Date();
    let _totalTasksCreatedOrAssigned = 0;

    for (let uIdx = 0; uIdx < allUsers.length; uIdx++) {
      const user = allUsers[uIdx];
      const dept = user.department || "Engineering";
      const templates = departmentTaskTemplates[dept] || departmentTaskTemplates["Engineering"] || generalTaskTemplates;

      console.log(`\nProcessing User [${uIdx + 1}/${allUsers.length}]: ${user.firstName} ${user.lastName} (${user.email}) - Dept: ${dept}`);

      // Check current tasks assigned to this user
      const existingUserTasks = await Task.find({ assignedTo: user._id });
      console.log(`User currently has ${existingUserTasks.length} assigned tasks.`);

      // Ensure every user has at least 4 to 6 diverse tasks (Completed, In Progress, Review, To Do)
      for (let tIdx = 0; tIdx < templates.length; tIdx++) {
        const tmpl = templates[tIdx];
        const taskCode = `${dept.slice(0, 3).toUpperCase()}-${100 + (uIdx * 10) + tIdx + 1}`;

        const createdDate = new Date(now);
        createdDate.setDate(createdDate.getDate() - tmpl.daysAgoCreated);
        // Distribute hours across the day for realistic timeline
        createdDate.setHours(9 + (tIdx * 2), 15, 0, 0);

        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + tmpl.daysOffsetDue);
        dueDate.setHours(18, 0, 0, 0);

        const updatedDate = new Date(createdDate);
        if (tmpl.status === "completed") {
          updatedDate.setDate(updatedDate.getDate() + 1);
        }

        // Check if task exists by code
        let existingTask = await Task.findOne({ taskCode });

        if (!existingTask) {
          // Create new task and assign to this user (and optionally admin as well)
          existingTask = await Task.create({
            taskCode,
            title: tmpl.title,
            description: tmpl.description,
            status: tmpl.status,
            priority: tmpl.priority,
            department: dept,
            dueDate,
            createdAt: createdDate,
            updatedAt: updatedDate,
            tags: tmpl.tags,
            assignedTo: [user._id],
            createdBy: allUsers[0]._id,
          });
          console.log(`  + Created Task [${taskCode}] "${tmpl.title}" -> ${tmpl.status} (${tmpl.priority})`);
          _totalTasksCreatedOrAssigned++;
        } else {
          // Ensure user._id is in assignedTo list
          const hasUser = existingTask.assignedTo.some((id: any) => id.toString() === user._id.toString());
          if (!hasUser) {
            existingTask.assignedTo.push(user._id);
            await existingTask.save();
            console.log(`  * Linked existing task [${taskCode}] "${tmpl.title}" to user`);
            _totalTasksCreatedOrAssigned++;
          }
        }
      }
    }

    const allTasksCount = await Task.countDocuments();
    console.log(`\n======================================================`);
    console.log(`TOTAL TASKS IN DATABASE: ${allTasksCount}`);
    console.log(`All ${allUsers.length} employees and admins now have active & completed tasks across all workflow stages!`);
    console.log(`======================================================\n`);

    await mongoose.disconnect();
    console.log("Database connection closed.");
    process.exit(0);
  } catch (err) {
    console.error("Error populating employee data:", err);
    process.exit(1);
  }
}

populateAllEmployees();
