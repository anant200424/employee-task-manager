# EmpSphere: Complete Project Architecture & Feature Flow Guide

> **Welcome to EmpSphere!**  
> This master document provides a 360-degree, beginner-friendly walkthrough of the entire **EmpSphere Enterprise Workforce Management System**.  
> Whether you are a developer, administrator, or team member, this guide explains every library used, every file’s exact responsibility, how each feature functions under the hood, and how data moves end-to-end through the application.

---

## Table of Contents

1. [High-Level Overview & Tech Stack](#1-high-level-overview--tech-stack)
2. [Why Each Library Was Chosen](#2-why-each-library-was-chosen)
3. [Project Directory & File Structure](#3-project-directory--file-structure)
4. [Database Models & Schemas](#4-database-models--schemas)
5. [End-to-End Feature Flows (Step-by-Step)](#5-end-to-end-feature-flows-step-by-step)
   - [5.1 Registration, Drafts & Dual-OTP Verification](#51-registration-drafts--dual-otp-verification)
   - [5.2 Login & Role-Based Access Control (Admin vs Employee)](#52-login--role-based-access-control-admin-vs-employee)
   - [5.3 Password Recovery (Forgot / Reset Password)](#53-password-recovery-forgot--reset-password)
   - [5.4 Executive & Personal Dashboard (Zero Redundancies)](#54-executive--personal-dashboard-zero-redundancies)
   - [5.5 Tasks Management (Jira/Linear Workflow)](#55-tasks-management-jiralinear-workflow)
   - [5.6 Employees Directory & Administrative Governance](#56-employees-directory--administrative-governance)
   - [5.7 Profile Management & Unified 100% Email OTP Verification](#57-profile-management--unified-100-email-otp-verification)
   - [5.8 Analytics & Enterprise Intelligence](#58-analytics--enterprise-intelligence)
   - [5.9 Settings, Multi-Language, Appearance & Security](#59-settings-multi-language-appearance--security)
   - [5.10 Notification & Activity Hub](#510-notification--activity-hub)
   - [5.11 AI Chat Assistant (EmpSphere Copilot)](#511-ai-chat-assistant-empsphere-copilot)
   - [5.12 Auxiliary Modules (Payslips, Calendar, Workspace Hub, Help)](#512-auxiliary-modules-payslips-calendar-workspace-hub-help)
   - [5.13 Global Command Palette & Workspace Omnisearch](#513-global-command-palette--workspace-omnisearch-cmdk--ctrlk)
6. [Security, Performance & Best Practices Implemented](#6-security-performance--best-practices-implemented)

---

## 1. High-Level Overview & Tech Stack

EmpSphere is a full-stack Enterprise Workforce & Human Capital Management platform. It is split into two clean tiers:

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (Client Tier)                      │
│ Next.js 14 (App Router) + React 18 + TypeScript + Tailwind  │
│ Runs on: http://localhost:3000                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST API JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 BACKEND (Server Tier)                       │
│ Node.js + Express.js + TypeScript + Mongoose + JWT + SMTP   │
│ Runs on: http://localhost:5000                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ TCP / Native Driver
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 DATABASE (Data Tier)                        │
│ MongoDB Atlas / Local MongoDB Database                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Why Each Library Was Chosen

| Library | Where It Is Used | Why We Use It |
| :--- | :--- | :--- |
| **Next.js 14 (App Router)** | Frontend | Provides server-side rendering, routing conventions (`(protected)`, layouts), automatic code-splitting, and fast page loads. |
| **TypeScript** | Frontend & Backend | Catches bugs at compile time, ensures strict type contracts between API responses and UI state, and eliminates `undefined` runtime errors. |
| **TailwindCSS** | Frontend | Enables rapid, responsive styling with native dark mode (`dark:`) and custom micro-animations without bloated CSS files. |
| **Lucide React** | Frontend | Provides modern, lightweight SVG icons that keep the application looking polished and professional. |
| **Recharts** | Frontend | Lightweight React SVG charting library used for Bar Charts, Area Charts, and Donut Charts in Dashboard and Analytics. |
| **React Hot Toast** | Frontend | High-performance toast notifications for instant user feedback (e.g., OTP sent, task created, employee blocked). |
| **Express.js** | Backend | Fast, unopinionated, standard web framework for building REST APIs with middleware pipelines. |
| **Mongoose** | Backend | ODM (Object Data Modeling) library for MongoDB that enforces data schemas, validation, and relational population (`.populate("assignedTo")`). |
| **Nodemailer** | Backend | Direct SMTP client used with Google Gmail SMTP to deliver fast, carrier-unrestricted OTPs and notifications directly to employee inboxes. |
| **Twilio Verify & SMS** | Backend | Mobile SMS verification service with automatic carrier-restriction fallbacks. |
| **JSON Web Token (JWT)** | Backend | Generates short-lived Access Tokens (15 min) and long-lived Refresh Tokens (7 days) for secure stateless authentication. |
| **bcryptjs** | Backend | One-way cryptographic hashing (12 salt rounds) for user passwords and OTP hashes. |
| **Zod** | Backend | Strict schema validation library used in middleware to validate incoming request bodies before reaching controllers. |

---

## 3. Project Directory & File Structure

```
empsphere/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts                    # MongoDB connection & reconnection handler
│   │   ├── controllers/
│   │   │   ├── authController.ts        # Register, login, adminLogin, OTP, password reset
│   │   │   ├── taskController.ts        # Task CRUD, assignees, status transitions, metrics
│   │   │   ├── userController.ts        # Staff directory, profile update, email/phone change, analytics
│   │   │   ├── notificationController.ts# Notifications fetch, mark as read, delete
│   │   │   └── aiController.ts          # AI workspace assistant endpoints
│   │   ├── middleware/
│   │   │   ├── auth.ts                  # JWT verification (protect) and role-guard (authorize)
│   │   │   ├── errorHandler.ts          # Centralized error handler returning clean JSON
│   │   │   ├── rateLimiter.ts           # IP-based rate limiting for brute-force protection
│   │   │   └── validate.ts              # Zod validation middleware
│   │   ├── models/
│   │   │   ├── User.ts                  # Employee & Admin profile schema
│   │   │   ├── Task.ts                  # Task schema with Jira-like fields
│   │   │   ├── Notification.ts          # System, task, and announcement notifications
│   │   │   ├── Message.ts               # Workspace broadcast discussions
│   │   │   ├── PendingRegistration.ts   # Temporary draft storage during OTP verification
│   │   │   └── PlatformSettings.ts      # Global platform toggles and maintenance controls
│   │   ├── routes/
│   │   │   ├── authRoutes.ts            # /api/auth/* endpoints
│   │   │   ├── taskRoutes.ts            # /api/tasks/* endpoints
│   │   │   ├── userRoutes.ts            # /api/users/* endpoints
│   │   │   ├── notificationRoutes.ts    # /api/notifications/* endpoints
│   │   │   └── aiRoutes.ts              # /api/ai/* endpoints
│   │   ├── services/
│   │   │   ├── email.service.ts         # High-speed Nodemailer SMTP email dispatcher
│   │   │   ├── sms.service.ts           # Twilio SMS verification client
│   │   │   └── otp.service.ts           # Cryptographic 6-digit OTP generator & hasher
│   │   ├── utils/
│   │   │   ├── ApiError.ts              # Custom error class with HTTP status codes
│   │   │   └── ApiResponse.ts           # Unified JSON response wrapper
│   │   ├── server.ts                    # Server initialization & port listening
│   │   └── app.ts                       # Express app configuration & middleware pipeline
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (protected)/             # Authenticated routes (wraps with Sidebar & Header)
│   │   │   │   ├── dashboard/page.tsx   # Executive (Admin) & Personal (Employee) Dashboard
│   │   │   │   ├── tasks/page.tsx       # Jira-style Task Management system
│   │   │   │   ├── employees/page.tsx   # Staff directory & Admin governance
│   │   │   │   ├── profile/page.tsx     # 5-Tab Employee/Admin Profile Hub
│   │   │   │   ├── analytics/page.tsx   # Intelligence & Productivity metrics
│   │   │   │   ├── settings/page.tsx    # Preferences, Languages, Scale, Security
│   │   │   │   ├── notifications/page.tsx# Real-time activity & Notification stream
│   │   │   │   ├── calendar/page.tsx    # Interactive Workspace Calendar
│   │   │   │   ├── payslips/page.tsx    # Salary slips & Compensation history
│   │   │   │   ├── help/page.tsx        # Help Center, FAQs, and Documentation
│   │   │   │   ├── events/page.tsx      # Corporate townhalls & team meetings
│   │   │   │   ├── empty-states/page.tsx# Workspace Collaboration Hub
│   │   │   │   └── layout.tsx           # Common protected layout with ProtectedRoute & Sidebar
│   │   │   ├── admin-login/page.tsx     # Dedicated Dark-Themed Executive Portal
│   │   │   ├── login/page.tsx           # Standard Employee Sign-In
│   │   │   ├── register/page.tsx        # Enterprise Onboarding & Registration Form
│   │   │   ├── verify-otp/page.tsx      # Dual-OTP Confirmation Screen
│   │   │   ├── forgot-password/page.tsx # Password Reset Request
│   │   │   └── reset-password/[token]/  # Secure Password Reset Entry
│   │   ├── components/
│   │   │   ├── ai/AIChatWidget.tsx      # Floating interactive AI assistant
│   │   │   ├── auth/                    # Input components (PhoneField, OtpInput, BrandMark)
│   │   │   ├── dashboard/               # Topbar, Sidebar, ProtectedRoute wrappers
│   │   │   ├── profile/                 # Profile tabs (PersonalInfo, Employment, Salary, etc.)
│   │   │   └── ui/                      # Skeletons, Alerts, Buttons, Switches
│   │   ├── context/
│   │   │   ├── AuthContext.tsx          # Global authentication & user session state
│   │   │   ├── LanguageContext.tsx      # Multi-language dictionary provider
│   │   │   └── SidebarContext.tsx       # Sidebar collapse & mobile drawer state
│   │   ├── features/
│   │   │   ├── auth/                    # Form components (LoginForm, RegisterForm, DashboardContent)
│   │   │   ├── tasks/                   # Task modals (NewTaskModal, EditTaskModal, TaskDetailsModal)
│   │   │   └── employees/               # Staff modals (EmployeeDetailModal, EditEmployeeModal, SendEmailModal)
│   │   ├── lib/
│   │   │   ├── api.ts                   # Axios client with auto JWT attachment & token refresh interceptors
│   │   │   ├── validation.ts            # Client-side validation logic
│   │   │   ├── countries.ts             # Country flags, dial codes, and regex rules
│   │   │   └── exportUtils.ts           # CSV, Excel, JSON, and PDF report exporters
│   │   └── types/auth.ts                # TypeScript interface definitions (User, Task, Notification)
│   └── package.json
```

---

## 4. Database Models & Schemas

### 1. `User` (The Master Account)
- **Identity**: `firstName`, `lastName`, `email` (unique), `dialCode`, `phoneNumber`, `employeeId` (unique), `dateOfBirth`.
- **Role & Access**: `role` (`"admin"` | `"employee"`), `isBlocked` (boolean), `blockedReason`, `blockedAt`, `loginAttempts`, `lockUntil`.
- **Organization**: `department` (e.g. Engineering, Design, Operations, HR), `roleTitle`.
- **Nested Profiles**:
  - `employmentInfo`: Joining date, work location, manager name, employment type.
  - `salary`: Basic, HRA, allowances, PF, total CTC.
  - `compliance`: PAN number, Aadhaar number, UAN number.
  - `documents`: Array of uploaded certificates with title, type, and URL.
  - `regionalPreferences`: Language, timezone, date format.
  - `notificationPreferences`: Email alerts, push notifications, weekly digest.
- **Security**: `password` (bcrypt hash), `refreshTokens` (array of active sessions), `changeEmailOtpHash`, `changePhoneOtpHash`.

### 2. `Task` (The Work Item)
- `taskCode`: Unique auto-generated code (`TSK-1042`).
- `title`, `description`, `department`, `priority` (`"low"` | `"medium"` | `"high"` | `"urgent"`).
- `status`: (`"todo"` | `"in_progress"` | `"review"` | `"completed"`).
- `assignedTo`: Array of references to `User` ObjectIDs.
- `createdBy`: Reference to Admin `User` ObjectID.
- `dueDate`, `tags`, `completionPercentage`.

### 3. `PendingRegistration` (The Temporary Registration Vault)
- Temporarily stores unverified user credentials, encrypted password hash, and the generated OTP hashes during the registration process.
- Auto-expires after 5 minutes to prevent database pollution.

---

## 5. End-to-End Feature Flows (Step-by-Step)

### 5.1 Registration, Drafts & Dual-OTP Verification

```
[User on /register] 
   │ 
   ├─► Enters profile info, selects country, phone, department, and password.
   │   Validates: Name (no special chars), Email, Phone, Age 18+ requirement.
   │
   ├─► Clicks "Create Account"
   │   POST /api/auth/register/start
   │   Backend generates two 6-digit OTPs: Email OTP + Phone OTP.
   │   Hashes OTPs using SHA-256 and stores in `PendingRegistration`.
   │   - Email OTP is dispatched via high-speed Gmail SMTP.
   │   - Phone OTP is dispatched via Twilio SMS.
   │   - If Twilio trial carrier restrictions block SMS on an unverified number, 
   │     the backend automatically delivers the Phone OTP to the user's email as an SMS Backup!
   │
   ├─► Redirects to /verify-otp?email=user@company.com
   │   User enters both 6-digit codes.
   │   POST /api/auth/verify-otp
   │   Backend validates both hashes.
   │   Converts `PendingRegistration` into a permanent `User` in MongoDB.
   │   Issues JWT Access & Refresh tokens.
   │
   └─► Auto-redirects into /dashboard!
```

---

### 5.2 Login & Role-Based Access Control (Admin vs Employee)

EmpSphere provides **two distinct login portals**:
1. **Employee Login (`/login`)**: The standard entrance for staff.
2. **Admin Portal (`/admin-login`)**: A dark-themed executive console requiring verified administrator privileges.

**Security Features in Login**:
- **Brute Force Protection**: 5 consecutive failed attempts lock the account for 15 minutes (`lockUntil`).
- **Immediate Administrative Suspension**: If an Admin clicks "Block" on an employee in the directory, the employee's active session is terminated instantly upon their next action or window tab focus.
- **JWT Refresh Interceptor**: When the 15-minute access token expires, the Axios client automatically calls `/api/auth/refresh` using the secure HTTP-only cookie, refreshing the session invisibly without logging the user out.

---

### 5.3 Password Recovery (Forgot / Reset Password)

```
[User clicks "Forgot Password?"]
   │
   ├─► Enters email at /forgot-password
   │   POST /api/auth/forgot-password
   │   Backend generates a random 32-byte crypto hex token.
   │   Hashes token in database (`resetPasswordToken`) with a 30-minute expiry.
   │   Sends professional HTML email containing the reset link:
   │   http://localhost:3000/reset-password/<TOKEN>
   │
   ├─► User clicks link in email, opens /reset-password/[token]
   │   Enters new password + confirmation.
   │   POST /api/auth/reset-password/<TOKEN>
   │   Backend verifies hash and expiry, re-hashes password with bcrypt (12 rounds).
   │   Clears reset token and invalidates previous sessions.
   │
   └─► Redirects to /login with a success toast!
```

---

### 5.4 Executive & Personal Dashboard (Zero Redundancies)

The dashboard has been completely re-architected to display **unique, non-repetitive, role-specific metrics**:

#### Executive View (Logged in as Admin)
1. **4 Purpose-Built Executive KPI Cards**:
   - **TOTAL TASKS**: Total workload items across the enterprise.
   - **PENDING**: Ongoing tasks in To-Do and active development.
   - **COMPLETED**: Successfully delivered milestones and org resolution rate.
   - **OVERDUE**: Past due deliverables and critical urgent blockers.
2. **Top Charts**:
   - **Department Resource Allocation**: Donut chart displaying the workforce distribution across Engineering, Design, Operations, HR, etc.
   - **Enterprise Weekly Velocity**: Dual-bar chart displaying deliverables created vs completed Monday through Sunday.
3. **Middle Section**: **Department Workload Matrix** showing total, active, and completed deliverables broken down by team.
4. **Right Column**: Live Interactive Calendar + Day Schedule + Top Contributors Leaderboard + Admin Shortcuts (*Create Task*, *Invite Member*, *Export Report*).

#### Personal View (Logged in as Employee)
1. **4 Purpose-Built Personal KPI Cards**:
   - **My Assigned Tasks**: Total workload items assigned to the employee.
   - **In Progress Today**: Tasks currently in active development.
   - **Completed Milestones**: Delivered and shipped milestones.
   - **Urgent & Due Soon**: Deliverables needing immediate action.
2. **Top Charts**:
   - **Sprint Execution Velocity**: Dynamic milestone progress bar and live backlog/in-progress/completed counters.
   - **Today's Priority Focus Deliverable**: Spotlight on the top critical deliverable with 1-click status switcher.
3. **Middle Section**: **"My Active Deliverables & Sprint Board"** interactive card list with 4-state quick status switcher.
4. **Bottom Grid**: Upcoming Deadlines timeline + **"My Department Team"** roster with avatars and email shortcuts.

---

### 5.5 Tasks Management (Jira/Linear Workflow)

Located at `/tasks`, this module manages the complete lifecycle of enterprise work items:
- **5 Interactive Views**:
  - **List View**: Dense table with batch selection, status dropdowns, priority badges, and quick actions.
  - **Summary View**: Visual workload metrics and status distributions.
  - **Kanban Board**: Drag-and-drop / click-to-move columns (*Todo*, *In Progress*, *Review*, *Completed*).
  - **Timeline / Gantt View**: Visual representation of task due dates across the current calendar month.
  - **Reports View**: Breakdown by department and priority.
- **Automatic Email Notifications**: When a task is assigned to an employee, the backend automatically dispatches an official HTML task notification email to the assignee via Gmail SMTP.
- **Export Engine**: Export filtered tasks to **CSV**, **Excel**, **JSON**, or generate a clean **Printable PDF report** with one click.

---

### 5.6 Employees Directory & Administrative Governance

Located at `/employees` (Admin Only):
- **Directory Grid & Table**: View all staff members with profile pictures, roles, departments, employee IDs, and verified contact info.
- **Zero Confusion Filter**: Admins are automatically filtered out of the employee list so the directory only reflects staff members.
- **One-Click Block & Deactivate**:
  - Admins can suspend accounts with a custom reason.
  - Blocked employees cannot log in and are immediately kicked out of any active sessions.
  - Admins can unblock accounts instantly with a single click.
- **Direct Broadcast / Send Email**: Built-in modal allows administrators to dispatch personalized emails to employees directly from the platform.

---

### 5.7 Profile Management & Unified 100% Email OTP Verification

Located at `/profile`:
- **Header & Cover Image**: Features a compact, modern cover banner with an overlapping circular avatar, verified badge, and contact pills.
- **5 Comprehensive Information Tabs**:
  1. **Personal Information**: Name, date of birth, address, phone number, and work email.
  2. **Employment Information**: Department, role, employee ID, joining date, employment type, and manager.
  3. **Salary Structure & CTC**: Breakdown of Basic, HRA, Allowances, and PF with real-time auto-calculation of total annual CTC.
  4. **Compliance & Legal**: Indian PAN verification (regex check), 12-digit Aadhaar, and UAN format validation.
  5. **Uploaded Documents**: Secure file storage for offer letters, identity proofs, and certificates.
- **100% Email OTP for Contact Changes**:
  - Changing either **Work Email** or **Phone Number** triggers a secure 6-digit OTP delivered directly to the user's currently verified email address via high-speed SMTP, completely bypassing carrier SMS restrictions.

---

### 5.8 Analytics & Enterprise Intelligence

Located at `/analytics`:
- **Executive View (Admin)**: Enterprise-wide productivity velocity, task completion timelines, department workforce distribution, and age demographics.
- **Team View (Employee)**: Displays **"Department Colleagues"** in their division, personal delivery efficiency, and personal velocity benchmarks.

---

### 5.9 Settings, Multi-Language, Appearance & Security

Located at `/settings`:
- **Preferences**: Regional language selector (English, Hindi, Spanish, French), timezone, and notification toggles.
- **Appearance**: Dark / Light theme toggle and dynamic UI display scaling (80% to 130% slider).
- **Privacy & Security**: Two-factor authentication toggles, password change modal, and "Terminate Other Active Sessions" button.

---

### 5.10 Notification & Activity Hub

Located at `/notifications` and the Topbar Bell icon:
- Real-time stream of task assignments, system alerts, and workspace broadcasts.
- Category filters: **All Categories**, **Tasks**, **Announcements**, and **System Security**.
- Mark all as read or delete individual notifications.

---

### 5.11 AI Chat Assistant (EmpSphere Copilot)

Floating widget available in the bottom-right corner across all protected pages:
- Provides instant natural-language assistance for finding tasks, querying team policies, summarizing workload, and generating quick action shortcuts.

---

### 5.12 Auxiliary Modules (Payslips, Calendar, Workspace Hub, Help)

- **Payslips (`/payslips`)**: Review gross and net compensation history and download monthly payslips in PDF format.
- **Calendar (`/calendar`)**: Month grid showing scheduled townhalls, sprint reviews, and deadlines.
- **Workspace Hub (`/empty-states`)**: Central bulletin board for enterprise announcements and project discussions.
- **Help Center (`/help`)**: Searchable FAQ library, user guides, and direct support contact links.

---

### 5.13 Global Command Palette & Workspace Omnisearch (`Cmd+K` / `Ctrl+K`)

Located globally on the Topbar and accessible from any screen via `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux):
- **Spotlight Interface**: Opens a centered, glassmorphism modal with background blur that lets users search and navigate the entire workspace without touching the mouse.
- **Unified Multi-Entity Search**:
  - **Pages & Navigation**: Instant jump to Dashboard, Tasks, Employees, Analytics, Profile, Settings, Notifications, Payslips, Calendar, Help, and Collaboration Hub.
  - **Live Tasks Search**: Real-time database queries matching task titles, codes (`TSK-1042`), status, and priority badges.
  - **Team Directory Search**: Finds colleagues by name, role, department, employee ID, or email with one-click navigation.
  - **Quick Action Shortcuts**: "Create New Task", "Toggle Dark / Light Theme", "Change Account Password", and settings shortcuts.
- **Keyboard-First Workflow**: Arrow Up (`↑`) / Arrow Down (`↓`) navigation, Enter (`↵`) execution, and Escape (`Esc`) dismissal.
- **Category Filter Pills**: Quickly filter results by *All Results*, *Pages*, *Tasks*, *Team*, or *Actions*.

---

## 6. Security, Performance & Best Practices Implemented

1. **Defense-in-Depth Authentication**:
   - Passwords hashed with bcrypt (12 rounds).
   - Stateless JWT authentication with short-lived access tokens and secure HTTP-only cookies.
   - Brute-force rate limiting on all authentication routes.
2. **Fail-Safe Fallbacks**:
   - If Twilio trial limits block SMS delivery, phone verification codes automatically route to the user's email inbox so registration never halts.
   - Profile changes use 100% direct SMTP delivery for zero-cost, reliable operation.
3. **Data Integrity & Code Quality**:
   - Strict TypeScript type safety across both frontend and backend (`tsc --noEmit` passes with 0 errors).
   - Zero ESLint errors or warnings.
   - Zod request body validation on every endpoint.
4. **Responsive & Accessible Design**:
   - Complete dark mode support across every modal, chart, and page.
   - ARIA labels, semantic HTML, and keyboard navigation support.

---

*Documentation maintained by EmpSphere Engineering. Last updated: September 2026.*
