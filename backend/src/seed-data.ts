import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import User from "./models/User";
import Task from "./models/Task";

dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://anantsingh20334411_db_user:r0JD1tRZayx8aIxP@cluster0.3txsth7.mongodb.net/task_manager";

async function seed() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    // 1. Fetch existing users to ensure we don't duplicate or delete existing accounts
    const existingUsers = await User.find({});
    console.log(`Found ${existingUsers.length} existing users.`);

    let adminUser = existingUsers.find((u) => u.role === "admin");
    if (!adminUser && existingUsers.length > 0) {
      adminUser = existingUsers[0];
    }

    const defaultHashedPassword = await bcrypt.hash("Password@123", 12);

    // List of realistic dummy employees across multiple departments
    const dummyEmployeesData = [
      {
        firstName: "Aarav",
        lastName: "Sharma",
        email: "aarav.sharma@empsphere.io",
        countryCode: "IN",
        dialCode: "+91",
        phoneNumber: "9876543210",
        department: "Engineering",
        role: "Senior Fullstack Architect",
        employeeId: "EMP-2041",
        dateOfBirth: new Date("1993-04-15"),
        password: defaultHashedPassword,
        isEmailVerified: true,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        employmentInfo: {
          joiningDate: new Date("2023-01-10"),
          workLocation: "Bengaluru, India",
          employmentType: "Full-Time",
          manager: "Anant Singh",
        },
        salary: { basic: 85000, hra: 34000, allowances: 21000, pf: 10200, totalCTC: 1800000 },
      },
      {
        firstName: "Priya",
        lastName: "Patel",
        email: "priya.patel@empsphere.io",
        countryCode: "IN",
        dialCode: "+91",
        phoneNumber: "9876543211",
        department: "Design",
        role: "Principal Product Designer",
        employeeId: "EMP-2042",
        dateOfBirth: new Date("1995-08-22"),
        password: defaultHashedPassword,
        isEmailVerified: true,
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        employmentInfo: {
          joiningDate: new Date("2023-03-15"),
          workLocation: "Mumbai, India",
          employmentType: "Full-Time",
          manager: "Anant Singh",
        },
        salary: { basic: 75000, hra: 30000, allowances: 18000, pf: 9000, totalCTC: 1584000 },
      },
      {
        firstName: "Rohan",
        lastName: "Verma",
        email: "rohan.verma@empsphere.io",
        countryCode: "IN",
        dialCode: "+91",
        phoneNumber: "9876543212",
        department: "Operations",
        role: "DevOps & Cloud Lead",
        employeeId: "EMP-2043",
        dateOfBirth: new Date("1992-11-05"),
        password: defaultHashedPassword,
        isEmailVerified: true,
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        employmentInfo: {
          joiningDate: new Date("2022-09-01"),
          workLocation: "Hyderabad, India",
          employmentType: "Full-Time",
          manager: "Anant Singh",
        },
        salary: { basic: 90000, hra: 36000, allowances: 24000, pf: 10800, totalCTC: 1930000 },
      },
      {
        firstName: "Ananya",
        lastName: "Iyer",
        email: "ananya.iyer@empsphere.io",
        countryCode: "IN",
        dialCode: "+91",
        phoneNumber: "9876543213",
        department: "Human Resources",
        role: "Lead People Partner",
        employeeId: "EMP-2044",
        dateOfBirth: new Date("1994-02-18"),
        password: defaultHashedPassword,
        isEmailVerified: true,
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
        employmentInfo: {
          joiningDate: new Date("2023-05-20"),
          workLocation: "Delhi NCR, India",
          employmentType: "Full-Time",
          manager: "Anant Singh",
        },
        salary: { basic: 65000, hra: 26000, allowances: 15000, pf: 7800, totalCTC: 1365000 },
      },
      {
        firstName: "Vikram",
        lastName: "Nair",
        email: "vikram.nair@empsphere.io",
        countryCode: "IN",
        dialCode: "+91",
        phoneNumber: "9876543214",
        department: "Sales & Business Dev",
        role: "Enterprise Growth Director",
        employeeId: "EMP-2045",
        dateOfBirth: new Date("1990-07-30"),
        password: defaultHashedPassword,
        isEmailVerified: true,
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        employmentInfo: {
          joiningDate: new Date("2022-11-15"),
          workLocation: "Pune, India",
          employmentType: "Full-Time",
          manager: "Anant Singh",
        },
        salary: { basic: 95000, hra: 38000, allowances: 27000, pf: 11400, totalCTC: 2040000 },
      },
      {
        firstName: "Sneha",
        lastName: "Reddy",
        email: "sneha.reddy@empsphere.io",
        countryCode: "IN",
        dialCode: "+91",
        phoneNumber: "9876543215",
        department: "Engineering",
        role: "Frontend Systems Engineer",
        employeeId: "EMP-2046",
        dateOfBirth: new Date("1996-09-12"),
        password: defaultHashedPassword,
        isEmailVerified: true,
        avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
        employmentInfo: {
          joiningDate: new Date("2023-08-01"),
          workLocation: "Bengaluru, India",
          employmentType: "Full-Time",
          manager: "Aarav Sharma",
        },
        salary: { basic: 70000, hra: 28000, allowances: 16000, pf: 8400, totalCTC: 1468000 },
      },
      {
        firstName: "Kabir",
        lastName: "Mehta",
        email: "kabir.mehta@empsphere.io",
        countryCode: "IN",
        dialCode: "+91",
        phoneNumber: "9876543216",
        department: "Design",
        role: "Senior UI/UX Researcher",
        employeeId: "EMP-2047",
        dateOfBirth: new Date("1994-12-03"),
        password: defaultHashedPassword,
        isEmailVerified: true,
        avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
        employmentInfo: {
          joiningDate: new Date("2023-06-10"),
          workLocation: "Bengaluru, India",
          employmentType: "Full-Time",
          manager: "Priya Patel",
        },
        salary: { basic: 68000, hra: 27200, allowances: 15500, pf: 8160, totalCTC: 1426000 },
      },
    ];

    const insertedOrExistingEmployees: any[] = [];

    for (const empData of dummyEmployeesData) {
      let emp = await User.findOne({ email: empData.email });
      if (!emp) {
        emp = await User.create(empData);
        console.log(`Created employee: ${emp.firstName} ${emp.lastName} (${emp.email})`);
      } else {
        console.log(`Employee already exists: ${emp.firstName} ${emp.lastName}`);
      }
      insertedOrExistingEmployees.push(emp);
    }

    const allUsers = await User.find({});
    console.log(`Total active user pool: ${allUsers.length}`);

    // Generate balanced dates spanning Monday to Sunday
    const now = new Date();
    const getPastDate = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d;
    };
    const getFutureDate = (daysAhead: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + daysAhead);
      return d;
    };

    // Realistic production-grade tasks with diverse statuses, priorities, departments, and assignees
    const seedTasksData = [
      // 1. In Progress Deliverables
      {
        taskCode: "ENG-101",
        title: "Implement Multi-Region Database Sharding & Read Replicas",
        description: "Configure MongoDB Atlas sharded clusters and active-passive read replicas to optimize query latency across APAC and EU regions.",
        status: "in_progress",
        priority: "urgent",
        department: "Engineering",
        dueDate: getFutureDate(3),
        createdAt: getPastDate(2),
        updatedAt: getPastDate(0),
        tags: ["Architecture", "Database", "Performance"],
      },
      {
        taskCode: "DES-102",
        title: "Figma Design System 2.0 & Dark Mode Tokens Audit",
        description: "Standardize atomic color tokens, elevation layers, and accessible contrast ratios for the Next.js enterprise component library.",
        status: "in_progress",
        priority: "high",
        department: "Design",
        dueDate: getFutureDate(5),
        createdAt: getPastDate(3),
        updatedAt: getPastDate(1),
        tags: ["UI/UX", "Design System", "Accessibility"],
      },
      {
        taskCode: "OPS-103",
        title: "Kubernetes Ingress Controller & Auto-Scaling Policy Setup",
        description: "Deploy nginx ingress controllers with automated Horizontal Pod Autoscaling (HPA) triggers based on real-time CPU & memory metrics.",
        status: "in_progress",
        priority: "high",
        department: "Operations",
        dueDate: getFutureDate(4),
        createdAt: getPastDate(4),
        updatedAt: getPastDate(1),
        tags: ["Kubernetes", "DevOps", "Infrastructure"],
      },
      {
        taskCode: "SLS-104",
        title: "Q3 Enterprise SaaS RFP Response & Security Whitepaper Review",
        description: "Finalize compliance responses and SOC2 Type II audit documentation for Fortune 500 prospect procurement review.",
        status: "in_progress",
        priority: "medium",
        department: "Sales & Business Dev",
        dueDate: getFutureDate(7),
        createdAt: getPastDate(5),
        updatedAt: getPastDate(2),
        tags: ["Sales", "Enterprise", "Security"],
      },

      // 2. Review & QA Deliverables
      {
        taskCode: "ENG-105",
        title: "End-to-End JWT Session Invalidation & Device Revocation Flow",
        description: "Implement Redis-backed session token blacklisting and automated device logout on suspicious geographic IP detection.",
        status: "review",
        priority: "urgent",
        department: "Engineering",
        dueDate: getFutureDate(2),
        createdAt: getPastDate(4),
        updatedAt: getPastDate(0),
        tags: ["Security", "Authentication", "Redis"],
      },
      {
        taskCode: "HR-106",
        title: "Annual Performance Appraisal Workflow & Peer Feedback Portal",
        description: "Roll out confidential 360-degree peer review forms and executive rating calibration matrix for H2 review cycle.",
        status: "review",
        priority: "medium",
        department: "Human Resources",
        dueDate: getFutureDate(6),
        createdAt: getPastDate(6),
        updatedAt: getPastDate(1),
        tags: ["HR", "Appraisal", "Workforce"],
      },

      // 3. Completed & Shipped Deliverables
      {
        taskCode: "ENG-107",
        title: "Export Engine for PDF, Excel, and JSON Formats",
        description: "Engineered client-side dynamic report generator supporting formatted CSV, XLSX spreadsheets, printable PDFs, and raw JSON export.",
        status: "completed",
        priority: "high",
        department: "Engineering",
        dueDate: getPastDate(1),
        createdAt: getPastDate(7),
        updatedAt: getPastDate(1),
        tags: ["Reports", "Export", "Core Feature"],
      },
      {
        taskCode: "OPS-108",
        title: "Zero-Downtime CI/CD GitHub Actions Pipeline Overhaul",
        description: "Integrated automated linting, type-checking, Docker image caching, and canary deployment rollouts to AWS ECS.",
        status: "completed",
        priority: "urgent",
        department: "Operations",
        dueDate: getPastDate(2),
        createdAt: getPastDate(8),
        updatedAt: getPastDate(2),
        tags: ["CI/CD", "DevOps", "Automation"],
      },
      {
        taskCode: "DES-109",
        title: "Employee Dashboard Interactive Data Visualization Widgets",
        description: "Designed and built Recharts Donut status distributions, Mon–Sun velocity bar charts, and personal sprint calendar controls.",
        status: "completed",
        priority: "medium",
        department: "Design",
        dueDate: getPastDate(3),
        createdAt: getPastDate(9),
        updatedAt: getPastDate(3),
        tags: ["Charts", "Dashboard", "Frontend"],
      },
      {
        taskCode: "HR-110",
        title: "Employee Onboarding & Verification Automation System",
        description: "Launched automated identity verification, PAN/UAN compliance check, and self-service document upload pipeline.",
        status: "completed",
        priority: "medium",
        department: "Human Resources",
        dueDate: getPastDate(4),
        createdAt: getPastDate(10),
        updatedAt: getPastDate(4),
        tags: ["Compliance", "Onboarding", "HR"],
      },
      {
        taskCode: "SLS-111",
        title: "Customer Success Onboarding Playbook & SLA Framework",
        description: "Established 99.98% uptime SLA commitments and standardized 48-hour response protocol for tier-1 enterprise accounts.",
        status: "completed",
        priority: "low",
        department: "Sales & Business Dev",
        dueDate: getPastDate(5),
        createdAt: getPastDate(11),
        updatedAt: getPastDate(5),
        tags: ["Customer Success", "SLA", "Enterprise"],
      },

      // 4. To Do / Backlog Deliverables
      {
        taskCode: "ENG-112",
        title: "GraphQL Gateway & Federation for Microservice Orchestration",
        description: "Draft Apollo GraphQL federation schema to aggregate user accounts, billing, tasks, and audit log microservices.",
        status: "todo",
        priority: "medium",
        department: "Engineering",
        dueDate: getFutureDate(14),
        createdAt: getPastDate(1),
        updatedAt: getPastDate(1),
        tags: ["GraphQL", "Microservices", "Architecture"],
      },
      {
        taskCode: "OPS-113",
        title: "Disaster Recovery Drill & Automated Database Snapshot Failover",
        description: "Simulate multi-region network partition and validate automated RTO/RPO failover under 90 seconds.",
        status: "todo",
        priority: "urgent",
        department: "Operations",
        dueDate: getFutureDate(10),
        createdAt: getPastDate(2),
        updatedAt: getPastDate(2),
        tags: ["Disaster Recovery", "Cloud", "Resilience"],
      },
      {
        taskCode: "DES-114",
        title: "Mobile App UX Wireframes & Gestural Navigation Prototype",
        description: "Create interactive Framer prototypes for iOS and Android native companion apps with haptic feedback specs.",
        status: "todo",
        priority: "low",
        department: "Design",
        dueDate: getFutureDate(21),
        createdAt: getPastDate(3),
        updatedAt: getPastDate(3),
        tags: ["Mobile", "Prototype", "Figma"],
      },
      {
        taskCode: "HR-115",
        title: "Q4 Tech Hiring Sprint & Global Remote Workforce Policy",
        description: "Define compensation bands and international contractor compliance guidelines for hiring across EMEA & APAC.",
        status: "todo",
        priority: "medium",
        department: "Human Resources",
        dueDate: getFutureDate(18),
        createdAt: getPastDate(4),
        updatedAt: getPastDate(4),
        tags: ["Recruiting", "Remote Work", "Policy"],
      },
    ];

    console.log("Checking and upserting rich production seed tasks...");

    let taskCount = 0;
    for (let i = 0; i < seedTasksData.length; i++) {
      const tData = seedTasksData[i];
      let task = await Task.findOne({ taskCode: tData.taskCode });

      // Assign to relevant users based on department or admin
      const matchingDeptUsers = allUsers.filter(
        (u) => u.department?.toLowerCase() === tData.department.toLowerCase()
      );
      const assignedIds: any[] = [];
      if (matchingDeptUsers.length > 0) {
        assignedIds.push(matchingDeptUsers[i % matchingDeptUsers.length]._id);
      }
      if (allUsers.length > 0) {
        // Also assign some to the admin / primary user so employee dashboard has immediate tasks
        assignedIds.push(allUsers[0]._id);
      }

      const taskPayload = {
        ...tData,
        assignedTo: Array.from(new Set(assignedIds)),
        createdBy: allUsers[0]?._id,
      };

      if (!task) {
        task = await Task.create(taskPayload);
        console.log(`Created Task: [${task.taskCode}] ${task.title} (${task.status})`);
      } else {
        await Task.updateOne({ taskCode: tData.taskCode }, { $set: taskPayload });
        console.log(`Updated Task: [${task.taskCode}] ${task.title} (${task.status})`);
      }
      taskCount++;
    }

    console.log(`Successfully seeded ${taskCount} comprehensive tasks and ${insertedOrExistingEmployees.length} employees!`);
    await mongoose.disconnect();
    console.log("Database connection closed cleanly.");
    process.exit(0);
  } catch (err) {
    console.error("Database seeding failed:", err);
    process.exit(1);
  }
}

seed();
