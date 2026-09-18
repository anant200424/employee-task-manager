"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  ArrowRight,
  CheckSquare,
  Sparkles,
  Building2,
  Users,
  Zap,
  Award,
  ShieldCheck,
  Plus,
  Mail,
  CalendarDays,
  Clock,
  Flame,
  CheckCircle2,
  Play,
  PlayCircle,
  Layers,
  Check,
  Target,
  TrendingUp,
  Calendar,
  Loader2,
  CircleDashed,
  Sunrise,
  Sun,
  Moon,
  Camera,
  Shield,
  ChevronDown,
  Crown,
  Search,
  X,
  Briefcase,
  FolderKanban,
  ArrowUpRight,
  BarChart3,
  UserCheck,
  LayoutList,
  LayoutGrid,
  Eye,
  ChevronUp,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { resolveSystemRole } from "@/lib/roleUtils";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { Task } from "@/types/auth";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";

const RADIAN = Math.PI / 180;
const renderCustomizedPieLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
  const rawPct = typeof value === "number" ? value : typeof percent === "number" ? Math.round(percent * 100) : 0;
  if (!rawPct || rawPct < 5 || typeof midAngle !== "number") return null;

  const inR = typeof innerRadius === "number" ? innerRadius : 0;
  const outR = typeof outerRadius === "number" ? outerRadius : 108;
  const radius = inR + (outR - inR) * 0.62;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="central"
      className="font-black text-[12px] sm:text-[13px] select-none pointer-events-none"
      style={{
        fontWeight: 900,
        filter: "drop-shadow(0px 1px 3px rgba(0, 0, 0, 0.9))",
      }}
    >
      {`${rawPct}%`}
    </text>
  );
};

export const DashboardContent = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const translateDept = useCallback((deptName?: string): string => {
    if (!deptName) return "";
    const directMap: Record<string, string> = {
      "Engineering": t("dept_engineering", "Engineering"),
      "Design": t("dept_design", "Design"),
      "Operations": t("dept_operations", "Operations"),
      "Human Resources": t("dept_hr", "Human Resources"),
      "HR": t("dept_hr", "HR"),
      "Finance": t("dept_finance", "Finance"),
      "Product": t("dept_product", "Product"),
      "Marketing": t("dept_marketing", "Marketing"),
      "Customer Support": t("dept_customer_support", "Customer Support"),
      "QA & Testing": t("dept_qa", "QA & Testing"),
      "QA": t("dept_qa", "QA"),
      "Sales": t("dept_sales", "Sales"),
      "Sales & Growth": t("dept_sales", "Sales & Growth"),
      "Sales & Business Dev": t("dept_sales", "Sales & Business Dev"),
      "IT & Security": t("dept_it_security", "IT & Security"),
      "Legal & Other": t("dept_other", "Legal & Other"),
      "Other": t("dept_other", "Other"),
    };
    return directMap[deptName] || deptName;
  }, [t]);
  const systemRole = useMemo(() => resolveSystemRole(user), [user]);

  const isSuperAdmin = systemRole === "super_admin";
  const isSystemAdmin = systemRole === "system_admin" || isSuperAdmin;
  const isAdmin = systemRole === "admin" || isSystemAdmin;
  const isManager = systemRole === "manager";
  const isEmployee = !isAdmin && !isSuperAdmin && !isSystemAdmin && !isManager;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [teamProfileFilter, setTeamProfileFilter] = useState<string>("all");

  // Super Admin: Manager Fleet & Task/Project Delegation State
  const [managerSearch, setManagerSearch] = useState("");
  const [managerDeptFilter, setManagerDeptFilter] = useState("all");

  // Modal 1: Dispatch Project / Task to Manager
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchManagerId, setDispatchManagerId] = useState("");
  const [dispatchTitle, setDispatchTitle] = useState("");
  const [dispatchDescription, setDispatchDescription] = useState("");
  const [dispatchPriority, setDispatchPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [dispatchDepartment, setDispatchDepartment] = useState("Engineering");
  const [dispatchDueDate, setDispatchDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [isDispatching, setIsDispatching] = useState(false);

  // Modal 2: Appoint / Promote Manager & RBAC Role
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [appointUserId, setAppointUserId] = useState("");
  const [appointSystemRole, setAppointSystemRole] = useState<"manager" | "admin" | "system_admin" | "employee">("manager");
  const [appointDepartment, setAppointDepartment] = useState("Engineering");
  const [appointRoleTitle, setAppointRoleTitle] = useState("Department Manager");
  const [isAppointing, setIsAppointing] = useState(false);

  // Live Real-Time Clock Tracker
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Interactive Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Personal Employee Work Hub State
  const [employeeTaskFilter, setEmployeeTaskFilter] = useState<"all" | "in_progress" | "todo" | "completed">("all");
  const [workStatus, setWorkStatus] = useState<"available" | "focus" | "meeting" | "away">("available");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [employeeChartMode, setEmployeeChartMode] = useState<"area" | "bar">("area");
  const [adminChartMode, setAdminChartMode] = useState<"bar" | "burnup" | "trend">("bar");
  const [resourceChartMode, setResourceChartMode] = useState<"donut" | "bars">("donut");
  const [employeeBreakdownMode, setEmployeeBreakdownMode] = useState<"status" | "priority">("status");
  const [activeEmployeeDonutIndex, setActiveEmployeeDonutIndex] = useState<number | null>(null);

  // Dynamic Contextual Time Greeting Information
  const greetingInfo = useMemo(() => {
    const hour = currentTime.getHours();
    const isMorning = hour >= 5 && hour < 12;
    const isAfternoon = hour >= 12 && hour < 17;
    const timeGreeting = isMorning ? "Good Morning" : isAfternoon ? "Good Afternoon" : "Good Evening";
    const TimeIcon = isMorning ? Sunrise : isAfternoon ? Sun : Moon;
    const timeIconColor = isMorning ? "text-amber-500" : isAfternoon ? "text-amber-500" : "text-indigo-400";

    if (isSuperAdmin) {
      return {
        greeting: timeGreeting,
        subtitle: "Enterprise operations overview, workforce velocity & platform governance.",
        icon: TimeIcon,
        badgeColor: "bg-indigo-50 text-[#5B5FEF] dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80",
        iconColor: timeIconColor,
        pillBg: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60",
        gradientMesh: "from-white via-slate-50/60 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900",
        glowRing: "ring-slate-200/80 dark:ring-slate-700/80",
      };
    }
    if (hour >= 5 && hour < 12) {
      return {
        greeting: "Good Morning",
        subtitle: isAdmin
          ? "Here is your executive operations overview and enterprise workflow metrics for this morning."
          : isManager
          ? "Here is your team's departmental workflow velocity, active deliverables, and operational metrics."
          : "Welcome to your productivity cockpit. Let's make this morning impactful and accomplish your goals.",
        icon: Sunrise,
        badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        iconColor: "text-amber-500",
        pillBg: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
        gradientMesh: "from-amber-500/10 via-orange-500/5 to-indigo-500/5 dark:from-amber-500/5 dark:via-slate-900 dark:to-slate-900",
        glowRing: "ring-amber-400/40 dark:ring-amber-500/30",
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: "Good Afternoon",
        subtitle: isAdmin
          ? "Enterprise operations review, workforce velocity, and team collaboration status this afternoon."
          : isManager
          ? "Team collaboration status, departmental output, and in-flight milestone tracking."
          : "Keep the positive momentum going! Track in-flight deliverables and review upcoming deadlines.",
        icon: Sun,
        badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
        iconColor: "text-sky-500",
        pillBg: "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60",
        gradientMesh: "from-sky-500/10 via-indigo-500/5 to-purple-500/5 dark:from-sky-500/5 dark:via-slate-900 dark:to-slate-900",
        glowRing: "ring-sky-400/40 dark:ring-sky-500/30",
      };
    } else {
      return {
        greeting: "Good Evening",
        subtitle: isAdmin
          ? "Enterprise day close overview, resolution milestones, and upcoming sprint schedule."
          : isManager
          ? "Departmental day close status, resolved milestones, and team workload for tomorrow."
          : "Great work today! Review completed deliverables, wrap up current tasks, and plan ahead.",
        icon: Moon,
        badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
        iconColor: "text-indigo-400",
        pillBg: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60",
        gradientMesh: "from-indigo-500/10 via-purple-500/5 to-slate-900/10 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900",
        glowRing: "ring-indigo-400/40 dark:ring-indigo-500/30",
      };
    }
  }, [currentTime, isAdmin, isManager, isSuperAdmin]);

  // Formatted Live Date & Time
  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [currentTime]);

  const formattedClock = useMemo(() => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }, [currentTime]);

  // User Display Name & Initials
  const userInitials = useMemo(() => {
    const f = user?.firstName?.[0] || "";
    const l = user?.lastName?.[0] || "";
    return `${f}${l}`.toUpperCase() || (isAdmin ? "AD" : isManager ? "MG" : "TM");
  }, [user, isAdmin, isManager]);

  const displayName = useMemo(() => {
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName || ""}`.trim();
    }
    return isSuperAdmin
      ? "Super Administrator"
      : isSystemAdmin
      ? "System Administrator"
      : isAdmin
      ? "Administrator"
      : isManager
      ? "Team Manager"
      : "Employee";
  }, [user, isSuperAdmin, isSystemAdmin, isAdmin, isManager]);

  // Quick Action: Update Task Status Directly from Dashboard with OPTIMISTIC UI
  const handleQuickStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    const previousTasks = tasks;
    // 1. Instantly update UI for hyper-fast response
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );
    toast.success(`Deliverable updated to ${newStatus.replace("_", " ")}`, { id: `dash-status-${taskId}` });

    // 2. Persist in background
    try {
      setUpdatingTaskId(taskId);
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      console.error("Failed to update status", err);
      // Rollback on failure
      setTasks(previousTasks);
      toast.error("Failed to update task status");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const loadData = async (isBackground = false) => {
    if (!isBackground && tasks.length === 0) {
      setLoading(true);
    }
    try {
      const [dashRes, tasksRes, analyticsRes, projectsRes] = await Promise.allSettled([
        api.get("/users/dashboard"),
        api.get("/tasks"),
        api.get("/users/analytics"),
        api.get("/projects"),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data.data) {
        setDashboardData(dashRes.value.data.data);
      }

      if (tasksRes.status === "fulfilled" && tasksRes.value.data.data?.tasks) {
        const freshTasks = tasksRes.value.data.data.tasks;
        setTasks(freshTasks);
        if (typeof window !== "undefined") {
          localStorage.setItem("nexus_cached_tasks", JSON.stringify(freshTasks));
        }
      }

      if (analyticsRes.status === "fulfilled" && analyticsRes.value.data.data) {
        setAnalyticsData(analyticsRes.value.data.data);
      }

      if (projectsRes.status === "fulfilled" && projectsRes.value.data.data?.projects) {
        setProjects(projectsRes.value.data.data.projects);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const hasLoadedRef = useRef(false);
  const hasFetchedEmployeesRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    let hasCached = false;
    try {
      const saved = localStorage.getItem("nexus_cached_tasks");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
          setLoading(false);
          hasCached = true;
        }
      }
    } catch {}

    loadData(hasCached);
  }, []);

  // Fetch employee profiles for admin and manager dashboard profile showcase
  useEffect(() => {
    if (!isAdmin && !isManager) return;
    if (hasFetchedEmployeesRef.current) return;
    hasFetchedEmployeesRef.current = true;

    const fetchEmployees = async () => {
      try {
        const res = await api.get("/users");
        const raw = res.data?.data;
        if (Array.isArray(raw)) setEmployees(raw);
        else if (Array.isArray(raw?.users)) setEmployees(raw.users);
      } catch (err) {
        console.error("Employee profiles fetch failed:", err);
      }
    };
    fetchEmployees();
  }, [isAdmin, isManager]);

  // Real-time Metrics Calculation from Live Tasks
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const inReviewTasks = tasks.filter((t) => t.status === "review").length;
  const activeTasks = inProgressTasks + inReviewTasks;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  
  // Real Overdue Calculation
  const overdueTasks = tasks.filter((t) => {
    if (t.status === "completed" || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    const now = new Date();
    return due < now;
  }).length;

  const productivityPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Compute per-employee task stats for admin profile cards
  const getEmployeeTaskStats = (empId: string) => {
    const assigned = tasks.filter((t) =>
      (t.assignedTo || []).some((u: any) =>
        typeof u === "string" ? u === empId : u._id === empId
      )
    );
    const done = assigned.filter((t) => t.status === "completed");
    const active = assigned.filter((t) => t.status === "in_progress" || t.status === "review");
    return {
      total: assigned.length,
      completed: done.length,
      inProgress: active.length,
      rate: assigned.length > 0 ? Math.round((done.length / assigned.length) * 100) : 0,
    };
  };

  // Super Admin: Dynamic Manager Fleet Calculation with live task counts
  const managersList = useMemo(() => {
    if (dashboardData?.managers && Array.isArray(dashboardData.managers) && dashboardData.managers.length > 0) {
      return dashboardData.managers;
    }
    const filtered = employees.filter((emp) => {
      const sys = String(emp.systemRole || "").toLowerCase().trim();
      const r = String(emp.role || "").toLowerCase().trim();
      if (["admin", "super_admin", "system_admin"].includes(sys) || r.includes("admin")) return false;
      if (sys === "employee") return false;
      return (
        sys === "manager" ||
        r.includes("manager") ||
        r.includes("lead") ||
        r.includes("director") ||
        r.includes("head")
      );
    });
    return filtered.map((m) => {
      const mId = m._id || m.id;
      const mTasks = tasks.filter((t) => (t.assignedTo || []).some((u: any) => (u._id || u.id || u) === mId));
      const mCompleted = mTasks.filter((t) => t.status === "completed").length;
      const mInProgress = mTasks.filter((t) => t.status === "in_progress").length;
      return {
        _id: mId,
        id: mId,
        name: `${m.firstName || ""} ${m.lastName || ""}`.trim() || m.email,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        department: m.department || "Engineering",
        role: m.role || "Department Manager",
        systemRole: m.systemRole || "manager",
        avatarUrl: m.avatarUrl || "",
        employeeId: m.employeeId || "",
        activeTasks: mInProgress,
        completedTasks: mCompleted,
        totalTasks: mTasks.length,
        completionRate: mTasks.length > 0 ? Math.round((mCompleted / mTasks.length) * 100) : 100,
      };
    });
  }, [dashboardData, employees, tasks]);

  const filteredManagers = useMemo(() => {
    return managersList.filter((m: any) => {
      const matchesDept =
        managerDeptFilter === "all" ||
        m.department?.toLowerCase() === managerDeptFilter.toLowerCase();
      const query = managerSearch.toLowerCase().trim();
      const matchesSearch =
        !query ||
        m.name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query) ||
        m.role?.toLowerCase().includes(query);
      return matchesDept && matchesSearch;
    });
  }, [managersList, managerDeptFilter, managerSearch]);

  const handleOpenDispatch = (managerId?: string, managerDept?: string) => {
    if (managerId) {
      setDispatchManagerId(managerId);
    } else if (managersList.length > 0) {
      setDispatchManagerId(managersList[0]._id || managersList[0].id);
    } else if (employees.length > 0) {
      setDispatchManagerId(employees[0]._id || employees[0].id);
    }
    if (managerDept) {
      setDispatchDepartment(managerDept);
    } else if (managersList.length > 0 && managersList[0].department) {
      setDispatchDepartment(managersList[0].department);
    }
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTitle.trim()) {
      toast.error("Please enter a project or task title.");
      return;
    }
    if (!dispatchManagerId) {
      toast.error("Please select an appointed manager to assign this project.");
      return;
    }
    try {
      setIsDispatching(true);
      const res = await api.post("/projects", {
        name: dispatchTitle.trim(),
        department: dispatchDepartment || "Engineering",
        managerId: dispatchManagerId,
        priority: dispatchPriority.charAt(0).toUpperCase() + dispatchPriority.slice(1),
        targetDate: new Date(dispatchDueDate),
        description: dispatchDescription.trim(),
      });
      if (res.data?.data?.project) {
        setProjects((prev) => [res.data.data.project, ...prev]);
      }
      toast.success("Strategic initiative dispatched & recorded in database successfully!");
      setIsDispatchModalOpen(false);
      setDispatchTitle("");
      setDispatchDescription("");
      loadData(true);
    } catch (err: any) {
      console.error("Failed to dispatch project:", err);
      toast.error(err.response?.data?.message || "Failed to dispatch project.");
    } finally {
      setIsDispatching(false);
    }
  };

  const handleOpenAppoint = (userId?: string, curRole?: string, curDept?: string, curSysRole?: any) => {
    if (userId) {
      setAppointUserId(userId);
      const isMgr = curRole && curRole.toLowerCase().includes("manager");
      setAppointRoleTitle(isMgr ? curRole : `${curDept || "Department"} Manager`);
      setAppointDepartment(curDept || "Engineering");
      setAppointSystemRole(curSysRole === "admin" || curSysRole === "system_admin" ? curSysRole : "manager");
    } else if (employees.length > 0) {
      const first = employees[0];
      setAppointUserId(first._id || first.id);
      const isMgr = first.role && first.role.toLowerCase().includes("manager");
      setAppointRoleTitle(isMgr ? first.role : `${first.department || "Department"} Manager`);
      setAppointDepartment(first.department || "Engineering");
      setAppointSystemRole("manager");
    }
    setIsAppointModalOpen(true);
  };

  const handleAppointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointUserId) {
      toast.error("Please select a team member to appoint.");
      return;
    }
    try {
      setIsAppointing(true);
      let resolvedRole = appointRoleTitle.trim();
      if (
        appointSystemRole === "employee" &&
        (!resolvedRole ||
          resolvedRole.toLowerCase().includes("manager") ||
          resolvedRole.toLowerCase().includes("lead"))
      ) {
        resolvedRole = "Software Engineer";
      } else if (!resolvedRole) {
        resolvedRole =
          appointSystemRole === "manager"
            ? "Department Manager"
            : "Software Engineer";
      }
      await api.patch(`/users/${appointUserId}`, {
        systemRole: appointSystemRole,
        department: appointDepartment,
        role: resolvedRole,
      });
      toast.success("Manager appointment and leadership credentials updated successfully!");
      setIsAppointModalOpen(false);
      await loadData(true);
      const res = await api.get("/users");
      const raw = res.data?.data;
      if (Array.isArray(raw)) setEmployees(raw);
      else if (Array.isArray(raw?.users)) setEmployees(raw.users);
    } catch (err: any) {
      console.error("Failed to update appointment:", err);
      toast.error(err.response?.data?.message || "Failed to appoint manager.");
    } finally {
      setIsAppointing(false);
    }
  };

  // Filtered employees for admin profile cards
  const filteredTeamEmployees = useMemo(() => {
    const nonAdmin = employees.filter((e: any) => e.role !== "admin");
    if (teamProfileFilter === "all") return nonAdmin;
    return nonAdmin.filter((e: any) => {
      const dept = (e.department || "").toLowerCase();
      if (teamProfileFilter === "Engineering") return dept.includes("eng");
      if (teamProfileFilter === "Operations") return dept.includes("operat");
      if (teamProfileFilter === "Design") return dept.includes("design");
      if (teamProfileFilter === "HR") return dept.includes("hr") || dept.includes("human");
      if (teamProfileFilter === "Sales") return dept.includes("sales") || dept.includes("business");
      return dept === teamProfileFilter.toLowerCase();
    });
  }, [employees, teamProfileFilter]);

  // Super Admin Strategic Projects Portfolio State & Computation
  const [projects, setProjects] = useState<any[]>([]);
  const [projectDeptFilter, setProjectDeptFilter] = useState("all");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [projectViewMode, setProjectViewMode] = useState<"list" | "grid">("list"); // Defaults to list view when dashboard opens
  const [showAllProjectCards, setShowAllProjectCards] = useState<boolean>(false); // 2 rows (6 cards) vs all in grid view
  const [projectPage, setProjectPage] = useState<number>(1);
  const [projectsPerPage, setProjectsPerPage] = useState<number>(5);
  const [projectSearch, setProjectSearch] = useState<string>("");
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);

  const enterpriseProjects = useMemo(() => {
    // If backend projects loaded from MongoDB Atlas, map them directly with live metrics
    const listToMap = projects.length > 0 ? projects : [
      {
        id: "prj-eng-01",
        code: "PRJ-ENG-01",
        name: "Workflow Engine & RBAC Gateway",
        department: "Engineering",
        priority: "Critical",
        targetDate: "Oct 28, 2026",
        budgetHealth: "Resource Optimized",
      },
      {
        id: "prj-ops-02",
        code: "PRJ-OPS-02",
        name: "Cloud Infrastructure & Zero-Trust",
        department: "Operations",
        priority: "High",
        targetDate: "Nov 15, 2026",
        budgetHealth: "On Track",
      },
      {
        id: "prj-dsn-03",
        code: "PRJ-DSN-03",
        name: "Design System 2.0 & Mobile Cockpit",
        department: "Design",
        priority: "Medium",
        targetDate: "Dec 10, 2026",
        budgetHealth: "Under Budget",
      },
      {
        id: "prj-sal-04",
        code: "PRJ-SAL-04",
        name: "Partner Integrations & Client Portal",
        department: "Sales & Business Dev",
        priority: "High",
        targetDate: "Nov 30, 2026",
        budgetHealth: "Ahead of Schedule",
      },
      {
        id: "prj-hr-05",
        code: "PRJ-HR-05",
        name: "Workforce Lifecycle & Talent Engine",
        department: "Human Resources",
        priority: "Medium",
        targetDate: "Dec 20, 2026",
        budgetHealth: "Resource Optimized",
      },
      {
        id: "prj-fin-06",
        code: "PRJ-FIN-06",
        name: "Financial Auditing & Statutory Vault",
        department: "Finance",
        priority: "Critical",
        targetDate: "Oct 10, 2026",
        budgetHealth: "On Target",
      },
    ];

    return listToMap.map((p) => {
      // Find assigned manager from populated field or managersList
      let assignedManager = p.manager;
      if (!assignedManager || typeof assignedManager === "string") {
        assignedManager =
          managersList.find((m: any) =>
            (m._id || m.id) === (p.manager || "") ||
            (m.department || "").toLowerCase().includes(p.department.toLowerCase().slice(0, 4))
          ) ||
          managersList[0] || {
            _id: "mgr-default",
            name: "Appointed Manager",
            role: `${p.department} Manager`,
            avatarUrl: "",
            initials: "DM",
            email: "manager@empsphere.io",
            department: p.department,
          };
      } else {
        assignedManager = {
          _id: assignedManager._id || assignedManager.id,
          name: `${assignedManager.firstName || ""} ${assignedManager.lastName || ""}`.trim() || assignedManager.name || assignedManager.email,
          role: assignedManager.role || `${p.department} Lead`,
          avatarUrl: assignedManager.avatarUrl || "",
          initials: `${assignedManager.firstName?.[0] || ""}${assignedManager.lastName?.[0] || ""}`.toUpperCase() || "MG",
          email: assignedManager.email,
          department: assignedManager.department || p.department,
        };
      }

      const departmentContributors = employees.filter((e: any) =>
        (e.department || "").toLowerCase().includes(p.department.toLowerCase().slice(0, 4))
      );
      const teamList = Array.isArray(p.assignedTeam) && p.assignedTeam.length > 0 ? p.assignedTeam : departmentContributors;
      const teamCount = Math.max(teamList.length, 1);
      const teamPreview = teamList.slice(0, 4).map((c: any) => ({
        id: c._id || c.id,
        name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.name || c.email,
        avatarUrl: c.avatarUrl || "",
        initials: `${(c.firstName?.[0] || "")}${(c.lastName?.[0] || "")}`.toUpperCase() || "TM",
      }));

      // Live tasks from MongoDB for this department
      const deptTasks = tasks.filter((t) =>
        (t.department || "").toLowerCase().includes(p.department.toLowerCase().slice(0, 4))
      );
      const totalDeptTasks = Math.max(deptTasks.length, p.totalTasks || 1);
      const completedDeptTasks = deptTasks.filter((t) => t.status === "completed").length;
      const completionRate =
        totalDeptTasks > 0
          ? Math.round((completedDeptTasks / totalDeptTasks) * 100)
          : (p.progress || 0);

      const resolvedStatus =
        completionRate >= 90
          ? "Delivered"
          : completionRate >= 40
          ? "In Execution"
          : "On Track";

      return {
        ...p,
        id: p._id || p.id,
        manager: assignedManager,
        contributorsCount: teamCount,
        contributorsPreview: teamPreview,
        departmentContributors: teamList.map((c: any) => ({
          id: c._id || c.id,
          name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.name || c.email,
          role: c.role || `${p.department} Specialist`,
          email: c.email,
          avatarUrl: c.avatarUrl || "",
          initials: `${(c.firstName?.[0] || "")}${(c.lastName?.[0] || "")}`.toUpperCase() || "TM",
          status: c.status || "Active",
        })),
        departmentTasks: deptTasks.length > 0 ? deptTasks : (p.departmentTasks || []),
        totalTasks: totalDeptTasks,
        completedTasks: completedDeptTasks,
        progress: completionRate,
        status: p.status || resolvedStatus,
        targetDate: p.targetDate
          ? (typeof p.targetDate === "string" && (p.targetDate.includes(",") || p.targetDate.includes(" "))
              ? p.targetDate
              : new Date(p.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))
          : "Nov 30, 2026",
      };
    });
  }, [projects, managersList, employees, tasks]);

  const filteredProjects = useMemo(() => {
    return enterpriseProjects.filter((p) => {
      const matchDept =
        projectDeptFilter === "all" ||
        p.department.toLowerCase().includes(projectDeptFilter.toLowerCase().slice(0, 4));
      const matchStatus =
        projectStatusFilter === "all" ||
        p.status.toLowerCase() === projectStatusFilter.toLowerCase();
      return matchDept && matchStatus;
    });
  }, [enterpriseProjects, projectDeptFilter, projectStatusFilter]);

  // Quick Search Filtering for Initiatives
  const searchedProjects = useMemo(() => {
    if (!projectSearch.trim()) return filteredProjects;
    const q = projectSearch.trim().toLowerCase();
    return filteredProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        (p.manager?.name || "").toLowerCase().includes(q)
    );
  }, [filteredProjects, projectSearch]);

  // Card Grid View Limit (2 rows = 6 cards unless expanded)
  const displayedGridProjects = useMemo(() => {
    if (showAllProjectCards) return searchedProjects;
    return searchedProjects.slice(0, 6);
  }, [searchedProjects, showAllProjectCards]);

  // List View Pagination
  const totalProjectPages = Math.max(1, Math.ceil(searchedProjects.length / projectsPerPage));
  const paginatedListProjects = useMemo(() => {
    const start = (projectPage - 1) * projectsPerPage;
    return searchedProjects.slice(start, start + projectsPerPage);
  }, [searchedProjects, projectPage, projectsPerPage]);

  // Reset pagination to page 1 on filter or search updates
  useEffect(() => {
    setProjectPage(1);
  }, [projectDeptFilter, projectStatusFilter, projectSearch, projectsPerPage]);

  // Top Priority Focus Task (Most urgent actionable item for today)
  const topFocusTask = useMemo(() => {
    const uncompleted = tasks.filter((t) => t.status !== "completed");
    const urgent = uncompleted.find((t) => t.priority === "urgent");
    if (urgent) return urgent;
    const high = uncompleted.find((t) => t.priority === "high");
    if (high) return high;
    const inProgress = uncompleted.find((t) => t.status === "in_progress");
    if (inProgress) return inProgress;
    return uncompleted[0] || null;
  }, [tasks]);

  // Upcoming Deadlines (Chronological next deliverables)
  const upcomingDeadlines = useMemo(() => {
    return [...tasks]
      .filter((t) => t.status !== "completed" && t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 4);
  }, [tasks]);

  // Filtered Deliverables for Employee
  const employeeFilteredTasks = useMemo(() => {
    if (employeeTaskFilter === "all") return tasks;
    return tasks.filter((t) => t.status === employeeTaskFilter);
  }, [tasks, employeeTaskFilter]);

  // Employee Deliverables Pagination & Show-More State
  const [employeeTaskPage, setEmployeeTaskPage] = useState(1);
  const [showAllEmployeeTasks, setShowAllEmployeeTasks] = useState(false);
  const EMP_TASKS_PER_PAGE = 4;
  const totalEmployeeTaskPages = Math.ceil(employeeFilteredTasks.length / EMP_TASKS_PER_PAGE) || 1;

  const paginatedEmployeeTasks = useMemo(() => {
    if (showAllEmployeeTasks) return employeeFilteredTasks;
    const start = (employeeTaskPage - 1) * EMP_TASKS_PER_PAGE;
    return employeeFilteredTasks.slice(start, start + EMP_TASKS_PER_PAGE);
  }, [employeeFilteredTasks, employeeTaskPage, showAllEmployeeTasks]);

  // Top Categories Resource & Department Allocation
  const topCategoriesData = useMemo(() => {
    // Curated Executive Enterprise Palette: Harmonious HSL colors matching platform aesthetic
    const palette = [
      "#6366F1", // Indigo (Engineering - 33%)
      "#8B5CF6", // Violet (Design - 13%)
      "#06B6D4", // Cyan (Operations - 9%)
      "#10B981", // Emerald (Human Resources - 8%)
      "#0284C7", // Sky Blue (Finance - 7%)
      "#F59E0B", // Amber (Product - 6%)
      "#F43F5E", // Rose (Marketing - 6%)
      "#14B8A6", // Teal (Customer Support - 5%)
      "#A855F7", // Purple (QA - 5%)
      "#64748B", // Slate (Legal / Other - 8%)
    ];

    const totalHeadcount = dashboardData?.totalUsers || dashboardData?.totalEmployees || 128;

    if (analyticsData?.departmentDistribution && analyticsData.departmentDistribution.length > 0) {
      const sorted = [...analyticsData.departmentDistribution].sort(
        (a: any, b: any) => (b.value || 0) - (a.value || 0)
      );
      // Take top 9 and combine remainder into Other
      const top = sorted.slice(0, 9).map((d: any, idx: number) => ({
        name: d.name,
        value: d.value,
        count: d.count || Math.round((d.value / 100) * totalHeadcount),
        color: palette[idx % palette.length],
      }));

      const remainder = sorted.slice(9).reduce((acc: number, cur: any) => acc + (cur.value || 0), 0);
      if (remainder > 0) {
        top.push({
          name: "Other",
          value: remainder,
          count: Math.round((remainder / 100) * totalHeadcount),
          color: palette[9] || "#64748B",
        });
      }

      return top;
    }

    return [
      { name: "Engineering", value: 33, count: 42, color: "#6366F1" },
      { name: "Design", value: 13, count: 17, color: "#8B5CF6" },
      { name: "Operations", value: 9, count: 12, color: "#06B6D4" },
      { name: "Human Resources", value: 8, count: 10, color: "#10B981" },
      { name: "Finance", value: 7, count: 9, color: "#0284C7" },
      { name: "Product", value: 6, count: 8, color: "#F59E0B" },
      { name: "Marketing", value: 6, count: 8, color: "#F43F5E" },
      { name: "Customer Support", value: 6, count: 8, color: "#14B8A6" },
      { name: "QA & Testing", value: 5, count: 7, color: "#A855F7" },
      { name: "Legal & Other", value: 7, count: 9, color: "#64748B" },
    ];
  }, [analyticsData, dashboardData]);

  // Backward compatibility alias
  const adminDepartmentAllocation = topCategoriesData;

  // Employee Deliverable Status Distribution for Donut Chart
  const employeeStatusDistribution = useMemo(() => {
    const done = tasks.filter((t) => t.status === "completed").length;
    const inProg = tasks.filter((t) => t.status === "in_progress").length;
    const review = tasks.filter((t) => t.status === "review").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const total = tasks.length || 1;

    if (tasks.length === 0) {
      return [{ name: "No Tasks", value: 1, percent: 100, color: "#94A3B8", badge: "Empty", key: "todo" }];
    }

    const items = [
      { name: "In Progress", value: inProg, percent: Math.round((inProg / total) * 100), color: "#5B5FEF", badge: "In Flight", key: "in_progress" },
      { name: "Completed", value: done, percent: Math.round((done / total) * 100), color: "#10B981", badge: "Shipped", key: "completed" },
      { name: "In Review", value: review, percent: Math.round((review / total) * 100), color: "#8B5CF6", badge: "QA / Review", key: "review" },
      { name: "To Do", value: todo, percent: Math.round((todo / total) * 100), color: "#F59E0B", badge: "Backlog", key: "todo" },
    ].filter((item) => item.value > 0);

    return items.length > 0 ? items : [{ name: "To Do", value: 1, percent: 100, color: "#F59E0B", badge: "Backlog", key: "todo" }];
  }, [tasks]);

  // Employee Deliverable Priority Distribution for Donut Chart
  const employeePriorityDistribution = useMemo(() => {
    const urgent = tasks.filter((t) => t.priority === "urgent").length;
    const high = tasks.filter((t) => t.priority === "high").length;
    const medium = tasks.filter((t) => t.priority === "medium").length;
    const low = tasks.filter((t) => t.priority === "low").length;
    const total = tasks.length || 1;

    if (tasks.length === 0) {
      return [{ name: "No Tasks", value: 1, percent: 100, color: "#94A3B8", badge: "Empty", key: "medium" }];
    }

    const items = [
      { name: "Urgent", value: urgent, percent: Math.round((urgent / total) * 100), color: "#F43F5E", badge: "Critical", key: "urgent" },
      { name: "High Priority", value: high, percent: Math.round((high / total) * 100), color: "#F59E0B", badge: "Elevated", key: "high" },
      { name: "Medium Priority", value: medium, percent: Math.round((medium / total) * 100), color: "#3B82F6", badge: "Standard", key: "medium" },
      { name: "Low Priority", value: low, percent: Math.round((low / total) * 100), color: "#10B981", badge: "Routine", key: "low" },
    ].filter((item) => item.value > 0);

    return items.length > 0 ? items : [{ name: "Medium Priority", value: 1, percent: 100, color: "#3B82F6", badge: "Standard", key: "medium" }];
  }, [tasks]);

  // Enterprise Weekly Velocity Activity Data (Comprehensive Sprint Telemetry Mon–Sun)
  const weeklyActivityData = useMemo(() => {
    const days = [
      { key: "Mo", label: t("day_mo", "Mo"), full: t("day_monday", "Monday"), phase: "Sprint Kickoff" },
      { key: "Tu", label: t("day_tu", "Tu"), full: t("day_tuesday", "Tuesday"), phase: "Core Build" },
      { key: "We", label: t("day_we", "We"), full: t("day_wednesday", "Wednesday"), phase: "Mid-Sprint" },
      { key: "Th", label: t("day_th", "Th"), full: t("day_thursday", "Thursday"), phase: "Feature Freeze" },
      { key: "Fr", label: t("day_fr", "Fr"), full: t("day_friday", "Friday"), phase: "Ship & Release" },
      { key: "Sa", label: t("day_sa", "Sa"), full: t("day_saturday", "Saturday"), phase: "Weekend SLA" },
      { key: "Su", label: t("day_su", "Su"), full: t("day_sunday", "Sunday"), phase: "Sprint Retro" },
    ];
    const rawCounts = days.map((d) => ({
      day: d.label,
      fullDay: d.full,
      phase: d.phase,
      created: 0,
      completed: 0,
    }));

    tasks.forEach((tItem) => {
      const createdDate = new Date(tItem.createdAt);
      const dayIndex = (createdDate.getDay() + 6) % 7; // Monday = 0
      if (dayIndex >= 0 && dayIndex < 7) {
        rawCounts[dayIndex].created += 1;
      }
      if (tItem.status === "completed") {
        const updatedDate = new Date(tItem.updatedAt || tItem.createdAt);
        const compDayIndex = (updatedDate.getDay() + 6) % 7;
        if (compDayIndex >= 0 && compDayIndex < 7) {
          rawCounts[compDayIndex].completed += 1;
        }
      }
    });

    let runningCreated = 0;
    let runningCompleted = 0;

    return rawCounts.map((d) => {
      runningCreated += d.created;
      runningCompleted += d.completed;
      const rate = d.created > 0 ? Math.round((d.completed / d.created) * 100) : 0;

      return {
        day: d.day,
        fullDay: d.fullDay,
        phase: d.phase,
        created: d.created,
        rawCreated: d.created,
        completed: d.completed,
        cumulativeCreated: runningCreated,
        cumulativeCompleted: runningCompleted,
        efficiencyRate: rate,
        slaTarget: 25,
      };
    });
  }, [tasks, t]);

  // Executive Enterprise Weekly Velocity Metrics
  const weeklyVelocityStats = useMemo(() => {
    const totalCreated = weeklyActivityData.reduce((acc, d) => acc + (d.rawCreated ?? d.created), 0);
    const totalCompleted = weeklyActivityData.reduce((acc, d) => acc + d.completed, 0);
    const velocityRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;
    const avgDailyShipped = totalCompleted > 0 ? (totalCompleted / 7).toFixed(1) : "0.0";
    const peakDay = [...weeklyActivityData].sort((a, b) => (b.rawCreated ?? b.created) - (a.rawCreated ?? a.created))[0];
    const peakShipped = [...weeklyActivityData].sort((a, b) => b.completed - a.completed)[0];

    return {
      totalCreated,
      totalCompleted,
      velocityRate,
      avgDailyShipped,
      peakDay: peakDay?.fullDay || t("day_tuesday", "Tuesday"),
      peakDayCreated: peakDay?.rawCreated ?? peakDay?.created ?? 0,
      peakShippedDay: peakShipped?.fullDay || t("day_monday", "Monday"),
      peakShippedCompleted: peakShipped?.completed ?? 0,
    };
  }, [weeklyActivityData, t]);

  // Calendar Calculation Helpers for Employee Sprint Calendar
  const currentMonthYear = calendarDate.toLocaleString("default", { month: "long", year: "numeric" });
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  // Check if a specific date has tasks due or created
  const getTasksForDate = (dateObj: Date) => {
    const dateStr = dateObj.toISOString().split("T")[0];
    return tasks.filter((tItem) => {
      if (tItem.dueDate) {
        const dueStr = new Date(tItem.dueDate).toISOString().split("T")[0];
        if (dueStr === dateStr) return true;
      }
      const createdStr = new Date(tItem.createdAt).toISOString().split("T")[0];
      return createdStr === dateStr;
    });
  };

  const selectedDateTasks = useMemo(() => {
    return getTasksForDate(selectedDate);
  }, [selectedDate, tasks]);

  const handleJumpToToday = () => {
    const today = new Date();
    setCalendarDate(today);
    setSelectedDate(today);
  };

  // Next upcoming tasks with due dates
  const upcomingSprintDeadlines = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "completed")
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 4);
  }, [tasks]);

  const getRelativeDeadline = (dueDate?: string) => {
    if (!dueDate) return "No due date";
    const due = new Date(dueDate);
    const now = new Date();
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((dueDay.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue (${Math.abs(diffDays)}d ago)`;
    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "Due Tomorrow";
    return `In ${diffDays} days`;
  };

  // Pagination & Filter State for Recent Activity
  const [activityPage, setActivityPage] = useState(1);
  const [activityFilter, setActivityFilter] = useState<"all" | "in_progress" | "review" | "completed">("all");
  const ACTIVITY_ITEMS_PER_PAGE = 5;

  const filteredTasksForActivity = useMemo(() => {
    if (activityFilter === "all") return tasks;
    return tasks.filter((t) => t.status === activityFilter);
  }, [tasks, activityFilter]);

  const totalActivityPages = Math.max(1, Math.ceil(filteredTasksForActivity.length / ACTIVITY_ITEMS_PER_PAGE));

  useEffect(() => {
    setActivityPage(1);
  }, [activityFilter]);

  // Real Recent Activity Stream with Deep Metadata
  const recentActivities = useMemo(() => {
    const sorted = [...filteredTasksForActivity].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    const start = (activityPage - 1) * ACTIVITY_ITEMS_PER_PAGE;
    const paginated = sorted.slice(start, start + ACTIVITY_ITEMS_PER_PAGE);

    return paginated.map((actItem) => {
      const isCompleted = actItem.status === "completed";
      const isInProgress = actItem.status === "in_progress";
      const isReview = actItem.status === "review";

      let statusBadge = {
        key: actItem.status || "todo",
        label: t("dash_queued_backlog", "Queued"),
        color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/40",
        dot: "bg-amber-500",
      };
      if (isCompleted) {
        statusBadge = {
          key: "completed",
          label: t("completed", "Completed"),
          color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/40",
          dot: "bg-emerald-500",
        };
      } else if (isInProgress) {
        statusBadge = {
          key: "in_progress",
          label: t("dash_in_proc", "In Processing"),
          color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-900/40",
          dot: "bg-[#5B5FEF]",
        };
      } else if (isReview) {
        statusBadge = {
          key: "review",
          label: t("in_review", "In Review"),
          color: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/80 dark:border-purple-900/40",
          dot: "bg-purple-500",
        };
      }

      const priorityLabels: Record<string, string> = {
        urgent: t("priority_urgent", "Urgent"),
        high: t("priority_high", "High"),
        medium: t("priority_medium", "Medium"),
        low: t("priority_low", "Low"),
      };

      let priorityBadgeClass = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/50";
      if (actItem.priority === "urgent") priorityBadgeClass = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/40";
      else if (actItem.priority === "high") priorityBadgeClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/40";
      else if (actItem.priority === "medium") priorityBadgeClass = "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/80 dark:border-sky-900/40";

      const diffMs = Date.now() - new Date(actItem.updatedAt || actItem.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      let timeStr = t("just_now", "Just now");
      if (diffMins >= 60 * 24) timeStr = `${Math.floor(diffMins / (60 * 24))}d ago`;
      else if (diffMins >= 60) timeStr = `${Math.floor(diffMins / 60)}h ago`;
      else if (diffMins > 0) timeStr = `${diffMins}m ago`;

      // Extract clean title and department badge
      let cleanTitle = actItem.title || "Untitled Task";
      let dept = actItem.department || "";
      const deptMatch = cleanTitle.match(/\(([^)]+)\)$/);
      if (deptMatch) {
        if (!dept) dept = deptMatch[1].trim();
        cleanTitle = cleanTitle.replace(/\s*\([^)]+\)$/, "").trim();
      }

      // Assignee info
      const assignees = Array.isArray(actItem.assignedTo) ? actItem.assignedTo : [];
      let assigneeName = t("unassigned", "Unassigned");
      let assigneeAvatar = "";
      let assigneeInitials = "UA";
      if (assignees.length > 0) {
        const first = assignees[0];
        if (typeof first === "string") {
          assigneeName = "Assigned";
        } else {
          const typedFirst = first as any;
          assigneeName = `${typedFirst.firstName || ""} ${typedFirst.lastName || ""}`.trim() || typedFirst.name || typedFirst.email || "Member";
          assigneeAvatar = typedFirst.avatarUrl || "";
          assigneeInitials = `${(typedFirst.firstName?.[0] || "")}${(typedFirst.lastName?.[0] || "")}`.toUpperCase() || "MB";
        }
      }

      return {
        id: actItem._id,
        rawTask: actItem,
        title: cleanTitle,
        fullTitle: actItem.title,
        department: dept || "General",
        assigneeName,
        assigneeAvatar,
        assigneeInitials,
        assigneeCount: assignees.length,
        status: statusBadge,
        time: timeStr,
        priority: priorityLabels[actItem.priority || "medium"] || actItem.priority || "medium",
        priorityBadge: priorityBadgeClass,
      };
    });
  }, [filteredTasksForActivity, activityPage, t]);

  // Top Active Contributors calculation from real assigned tasks
  const topContributors = useMemo(() => {
    const userMap: Record<string, { name: string; avatarUrl?: string; initials: string; completed: number; total: number; department?: string }> = {};

    tasks.forEach((task) => {
      (task.assignedTo || []).forEach((u) => {
        if (typeof u !== "string" && u._id) {
          if (!userMap[u._id]) {
            const fName = u.firstName || "";
            const lName = u.lastName || "";
            const fullName = `${fName} ${lName}`.trim() || u.email || "Team Member";
            userMap[u._id] = {
              name: fullName,
              avatarUrl: u.avatarUrl,
              initials: `${fName[0] || ""}${lName[0] || ""}`.toUpperCase() || "TM",
              completed: 0,
              total: 0,
              department: u.department || "Enterprise",
            };
          }
          userMap[u._id].total += 1;
          if (task.status === "completed") {
            userMap[u._id].completed += 1;
          }
        }
      });
    });

    return Object.values(userMap)
      .sort((a, b) => b.completed - a.completed || b.total - a.total)
      .slice(0, 3);
  }, [tasks]);

  const GreetingIcon = greetingInfo.icon;

  if (!user) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-transparent transition-colors duration-300">
      <Topbar
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening across your workspace today."
      />

      {loading ? (
        <main className="flex-1 px-4 lg:px-8 py-6 pb-28 space-y-6 max-w-[1600px] mx-auto w-full">
          <DashboardSkeleton />
        </main>
      ) : (
        <main className="flex-1 px-4 lg:px-8 py-5 pb-24 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
        
        {/* ================= HERO GREETING & PROFILE BANNER ================= */}
        {isEmployee ? (
          /* ================= BESPOKE EMPLOYEE DASHBOARD PROFILE CARD (EXPANDED ENTERPRISE SIZE & FULL PROPORTIONS) ================= */
          <ScrollReveal animation="slide-up" className="w-full">
            <div className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 bg-gradient-to-br ${greetingInfo.gradientMesh} p-6 sm:p-7 lg:py-7 lg:px-8 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 w-full min-h-[145px] sm:min-h-[155px]`}>
              {/* Top Enterprise Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-[#5B5FEF]" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-8 w-full">
                {/* Left: User Profile Picture & Greeting Info */}
                <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                  {/* Profile Picture with Ring, Presence Badge & Quick Edit */}
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-20 lg:h-20 rounded-2xl p-1 bg-white dark:bg-slate-800 ring-3 ring-[#5B5FEF]/25 dark:ring-indigo-400/25 shadow-sm overflow-hidden flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={displayName}
                          className="w-full h-full object-cover rounded-[12px]"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[12px] bg-gradient-to-br from-[#5B5FEF] to-indigo-700 flex items-center justify-center text-white font-black text-xl sm:text-2xl tracking-wider shadow-inner">
                          {userInitials}
                        </div>
                      )}
                      <Link
                        href="/profile"
                        className="absolute inset-1 rounded-[12px] bg-slate-950/60 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        title="Update Profile Photo"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </Link>
                    </div>

                    {/* Active Presence Dot on Avatar */}
                    <span
                      className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border-[2.5px] border-white dark:border-slate-900 flex items-center justify-center shadow-xs ${
                        workStatus === "available"
                          ? "bg-emerald-500 text-white"
                          : workStatus === "focus"
                          ? "bg-amber-500 text-white"
                          : workStatus === "meeting"
                          ? "bg-sky-500 text-white"
                          : "bg-slate-400 text-white"
                      }`}
                      title={`Presence: ${workStatus === "available" ? "Active on Shift" : workStatus === "focus" ? "Deep Focus" : workStatus === "meeting" ? "In Meeting" : "Away"}`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  {/* Identity & Greeting Information */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    {/* Top Chips: Department Badge + Presence Switcher */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-black tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{user?.department || "Operations"}</span>
                      </span>

                      {/* Interactive Presence Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setStatusMenuOpen((v) => !v)}
                          className="px-3 py-1 rounded-lg text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-2xs border bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer hover:border-[#5B5FEF] transition-all active:scale-95"
                          title="Click to toggle your work presence"
                        >
                          <span className={`w-2 h-2 rounded-full ${workStatus === "available" ? "bg-emerald-500 animate-pulse" : workStatus === "focus" ? "bg-amber-500" : workStatus === "meeting" ? "bg-sky-500" : "bg-slate-400"}`} />
                          <span>
                            {workStatus === "available" ? "Active" : workStatus === "focus" ? "Focus" : workStatus === "meeting" ? "Meeting" : "Away"}
                          </span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>

                        {statusMenuOpen && (
                          <div className="absolute left-0 top-full mt-1.5 z-40 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl animate-in fade-in zoom-in-95">
                            {[
                              { key: "available", label: "Active on Shift", color: "bg-emerald-500" },
                              { key: "focus", label: "Deep Focus Mode", color: "bg-amber-500" },
                              { key: "meeting", label: "In a Meeting", color: "bg-sky-500" },
                              { key: "away", label: "Away / On Break", color: "bg-slate-400" },
                            ].map((st) => (
                              <button
                                key={st.key}
                                type="button"
                                onClick={() => {
                                  setWorkStatus(st.key as any);
                                  setStatusMenuOpen(false);
                                  toast.success(`Presence updated to ${st.label}`);
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                                  workStatus === st.key
                                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 font-extrabold"
                                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full ${st.color}`} />
                                <span>{st.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Greeting Header */}
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-[22px] sm:text-[25px] lg:text-[26px] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                        {greetingInfo.greeting},{" "}
                        <span className="text-[#5B5FEF] dark:text-indigo-400 font-extrabold">
                          {displayName}
                        </span>
                      </h1>
                      <GreetingIcon className={`w-5 h-5 ${greetingInfo.iconColor} shrink-0 hidden sm:inline-block`} />
                    </div>

                    {/* Subtitle */}
                    <p className="text-[13px] sm:text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-2xl lg:max-w-3xl">
                      {greetingInfo.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right: Date/Time Capsule + Action Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3.5 lg:gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Live Date & Clock Capsule */}
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    <Clock className="w-4 h-4 text-[#5B5FEF] shrink-0 animate-pulse" />
                    <div className="flex items-center gap-1.5 text-[12px] sm:text-[12.5px] font-semibold text-slate-600 dark:text-slate-300">
                      <span>{formattedDate}</span>
                      <span className="text-slate-300 dark:text-slate-600 font-bold">·</span>
                      <span className="font-mono text-slate-900 dark:text-white font-extrabold text-[12.5px] sm:text-[13px]">{formattedClock}</span>
                    </div>
                  </div>

                  {/* Employee Action Buttons */}
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    {overdueTasks > 0 && (
                      <Link
                        href="/tasks?status=overdue"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200/80 dark:border-rose-900/50 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        <span>{overdueTasks} Overdue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}

                    <Link
                      href="/tasks"
                      className="bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white px-4.5 py-2.5 rounded-xl text-[12.5px] sm:text-[13px] font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>{t("view_my_tasks") || "View My Tasks"}</span>
                    </Link>

                    <Link
                      href="/calendar"
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-[12.5px] sm:text-[13px] font-bold shadow-2xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                      title="Open Workspace Calendar"
                    >
                      <CalendarDays className="w-4 h-4 text-emerald-600" />
                      <span>Calendar</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ) : (
          <ScrollReveal animation="slide-up">
            <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 bg-gradient-to-br ${greetingInfo.gradientMesh} p-5 sm:p-5.5 lg:py-5.5 lg:px-7 shadow-xs hover:shadow-md border border-slate-200/90 dark:border-slate-800 transition-all`}>
            
            {/* Top Enterprise Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5B5FEF] via-indigo-500 to-purple-500" />

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5 xl:gap-7 w-full">
              
              {/* Left: User Avatar & Contextual Greeting */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
                
                {/* User Profile Avatar with Ring & Presence Badge */}
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl p-1 bg-white dark:bg-slate-800 ring-2 ring-[#5B5FEF]/20 dark:ring-indigo-400/20 shadow-xs overflow-hidden flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover rounded-[12px]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[12px] bg-gradient-to-br from-[#5B5FEF] to-indigo-700 flex items-center justify-center text-white font-black text-xl sm:text-2xl tracking-wider shadow-inner">
                        {userInitials}
                      </div>
                    )}

                    {/* Quick Edit Profile Hover Trigger */}
                    <Link
                      href="/profile"
                      className="absolute inset-1 rounded-[12px] bg-slate-950/60 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                      title="Manage Profile & Photo"
                    >
                      <Camera className="w-4 h-4 text-indigo-200" />
                    </Link>
                  </div>

                  {/* Presence Status Dot on Avatar - Positioned cleanly without overlapping text */}
                  <span
                    className={`absolute bottom-0 right-0 translate-x-0.5 translate-y-0.5 w-4.5 h-4.5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs ${
                      workStatus === "available"
                        ? "bg-emerald-500 text-white"
                        : workStatus === "focus"
                        ? "bg-amber-500 text-white"
                        : workStatus === "meeting"
                        ? "bg-sky-500 text-white"
                        : "bg-slate-400 text-white"
                    }`}
                    title={`Presence: ${workStatus === "available" ? "Active" : workStatus === "focus" ? "Deep Focus" : workStatus === "meeting" ? "In Meeting" : "Away"}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </span>
                </div>

                {/* Identity & Dynamic Time-of-Day Greeting Text */}
                <div className="space-y-1 min-w-0 flex-1">
                  
                  {/* Top Meta Capsule: Role/Department Badge + Presence Switcher */}
                  <div className="flex flex-wrap items-center gap-2">

                    {/* Role & Org Identity Chip */}
                    {isSuperAdmin ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-black tracking-wider uppercase flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs">
                        <Shield className="w-3.5 h-3.5 text-[#5B5FEF]" />
                        <span>Super Admin</span>
                      </span>
                    ) : isSystemAdmin ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-black tracking-wider uppercase flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs">
                        <Shield className="w-3.5 h-3.5 text-[#5B5FEF]" />
                        <span>System Admin</span>
                      </span>
                    ) : isAdmin ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-black tracking-wider uppercase flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Admin</span>
                      </span>
                    ) : isManager ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-black tracking-wider uppercase flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>Team Manager</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-black tracking-wider uppercase flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Employee</span>
                      </span>
                    )}

                    {/* Interactive Presence / Shift Mode Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setStatusMenuOpen((v) => !v)}
                        className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-2xs border bg-slate-100/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer hover:border-[#5B5FEF] transition-all active:scale-95"
                        title="Click to toggle your work presence"
                      >
                        <span className={`w-2 h-2 rounded-full ${workStatus === "available" ? "bg-emerald-500 animate-pulse" : workStatus === "focus" ? "bg-amber-500" : workStatus === "meeting" ? "bg-sky-500" : "bg-slate-400"}`} />
                        <span>
                          {workStatus === "available" ? "Active" : workStatus === "focus" ? "Focus" : workStatus === "meeting" ? "Meeting" : "Away"}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {statusMenuOpen && (
                        <div className="absolute left-0 top-full mt-1.5 z-40 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-xl animate-in fade-in zoom-in-95">
                          {[
                            { key: "available", label: "Active on Shift", color: "bg-emerald-500" },
                            { key: "focus", label: "Deep Focus Mode", color: "bg-amber-500" },
                            { key: "meeting", label: "In a Meeting", color: "bg-sky-500" },
                            { key: "away", label: "Away / On Break", color: "bg-slate-400" },
                          ].map((st) => (
                            <button
                              key={st.key}
                              type="button"
                              onClick={() => {
                                setWorkStatus(st.key as any);
                                setStatusMenuOpen(false);
                                toast.success(`Presence updated to ${st.label}`);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                                workStatus === st.key
                                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 font-extrabold"
                                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${st.color}`} />
                              <span>{st.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Personalized Greeting Header */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <h1 className="text-[20px] sm:text-[22px] lg:text-[24px] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                      {greetingInfo.greeting},{" "}
                      <span className="text-[#5B5FEF] dark:text-indigo-400 font-extrabold">
                        {displayName}
                      </span>
                    </h1>
                    <GreetingIcon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${greetingInfo.iconColor} shrink-0 hidden sm:inline-block`} />
                  </div>

                  {/* Contextual Subtitle - Guaranteed safe distance from avatar */}
                  <p className="text-[12px] sm:text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-xl">
                    {greetingInfo.subtitle}
                  </p>
                </div>
              </div>

              {/* Right: Live Digital Clock & Strategic Action Buttons */}
              <div className="flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end justify-between gap-3.5 shrink-0 pt-3.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 dark:border-slate-800">
                
                {/* Live Real-time Date & Digital Clock Capsule */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    <div className="w-6.5 h-6.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
                      <Clock className="w-3.5 h-3.5 text-[#5B5FEF] animate-pulse" />
                    </div>
                    <div className="text-left xl:text-right">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-none">
                        {formattedDate}
                      </p>
                      <p className="text-[13px] font-black text-slate-800 dark:text-white font-mono tracking-tight leading-tight mt-0.5">
                        {formattedClock}
                      </p>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <Link
                      href="/calendar"
                      className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#5B5FEF] text-slate-600 dark:text-slate-300 hover:text-[#5B5FEF] shadow-2xs transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                      title="Open Enterprise Calendar"
                    >
                      <CalendarDays className="w-4 h-4 text-emerald-600" />
                    </Link>
                  )}
                </div>

                {/* Primary Action Buttons: Enterprise Styled with Equal Height & Premium Polish */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                  {isSuperAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenDispatch()}
                        className="h-9.5 px-4.5 rounded-xl bg-gradient-to-r from-[#5B5FEF] to-[#4F46E5] hover:from-[#4D51DB] hover:to-[#4338CA] text-white text-[12px] sm:text-[12.5px] font-extrabold shadow-xs hover:shadow-md hover:shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                        title="Dispatch New Task or Strategic Project to Manager"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Dispatch to Manager</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAppoint()}
                        className="h-9.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 text-[12px] sm:text-[12.5px] font-extrabold border border-slate-200/90 dark:border-slate-700 hover:border-[#5B5FEF]/50 shadow-2xs hover:shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                        title="Appoint or Promote Workspace Contributor to Manager Role"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#5B5FEF]" />
                        <span>Appoint Manager</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {overdueTasks > 0 && (
                        <Link
                          href="/tasks?status=overdue"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-200/80 dark:border-rose-900/50 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                          <span>{overdueTasks} Overdue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      <Link
                        href="/tasks"
                        className="flex-1 sm:flex-none bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white px-4 py-2.5 rounded-xl text-[12.5px] sm:text-[13px] font-bold shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span>{isAdmin ? t("manage_tasks") || "Manage Tasks" : t("view_my_tasks") || "My Work Board"}</span>
                      </Link>

                      <Link
                        href="/calendar"
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-[12.5px] sm:text-[13px] font-bold shadow-2xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                        title="Open Workspace Calendar"
                      >
                        <CalendarDays className="w-4 h-4 text-emerald-600" />
                        <span className="hidden sm:inline">Calendar</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </ScrollReveal>
      )}

        {/* ================= KPI METRICS GRID (4 COMPACT EXECUTIVE TICKETS) ================= */}
        <ScrollReveal animation="slide-up" delay={80}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {(isSuperAdmin
              ? [
                  {
                    label: "TOTAL WORKFORCE",
                    value: dashboardData?.totalUsers || employees.length || 1,
                    href: "/employees",
                    icon: Users,
                    iconColor: "text-purple-500",
                    iconBg: "bg-purple-500/10 dark:bg-purple-500/20",
                    hoverBorder: "hover:border-purple-500/50",
                    topBar: "bg-purple-600",
                    badge: "All Personnel",
                    badgeBg: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/40",
                    hint: "Global Directory",
                    actionLabel: "View →",
                  },
                  {
                    label: "DEPT MANAGERS",
                    value: managersList.length,
                    href: "#manager-fleet",
                    icon: ShieldCheck,
                    iconColor: "text-[#5B5FEF]",
                    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
                    hoverBorder: "hover:border-indigo-500/50",
                    topBar: "bg-[#5B5FEF]",
                    badge: `${managersList.length} Leaders`,
                    badgeBg: "bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/40",
                    hint: "Fleet Leadership",
                    actionLabel: "Manage →",
                  },
                  {
                    label: "ACTIVE DELIVERABLES",
                    value: totalTasks,
                    href: "/tasks",
                    icon: Layers,
                    iconColor: "text-sky-500",
                    iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
                    hoverBorder: "hover:border-sky-500/50",
                    topBar: "bg-sky-500",
                    badge: `${activeTasks} Active`,
                    badgeBg: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border-sky-200/60 dark:border-sky-900/40",
                    hint: "Sprint Execution",
                    actionLabel: "Track →",
                  },
                  {
                    label: "PLATFORM INTEGRITY",
                    value: "99.98%",
                    href: "/analytics",
                    icon: Award,
                    iconColor: "text-emerald-500",
                    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
                    hoverBorder: "hover:border-emerald-500/50",
                    topBar: "bg-emerald-500",
                    badge: "Root Guard",
                    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40",
                    hint: "Health Verified",
                    actionLabel: "Audit →",
                  },
                ]
              : isAdmin
              ? [
                  {
                    label: t("dash_total_workspace_deliverables", "TOTAL WORKLOAD"),
                    value: totalTasks,
                    href: "/tasks",
                    icon: Layers,
                    iconColor: "text-[#5B5FEF]",
                    iconBg: "bg-[#5B5FEF]/10 dark:bg-[#5B5FEF]/20",
                    hoverBorder: "hover:border-[#5B5FEF]/50",
                    topBar: "bg-[#5B5FEF]",
                    badge: "Org Wide",
                    badgeBg: "bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/40",
                    hint: "All Work Items",
                    actionLabel: t("dash_view_all", "View all →"),
                  },
                  {
                    label: t("in_progress", "IN PROGRESS"),
                    value: activeTasks,
                    href: "/tasks?status=in_progress",
                    icon: PlayCircle,
                    iconColor: "text-sky-500",
                    iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
                    hoverBorder: "hover:border-sky-500/50",
                    topBar: "bg-sky-500",
                    badge: inReviewTasks > 0 ? "In-Flight" : "Active",
                    badgeBg: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border-sky-200/60 dark:border-sky-900/40",
                    hint: inReviewTasks > 0 ? `${inProgressTasks} Exec · ${inReviewTasks} Review` : "Execution Stream",
                    actionLabel: t("dash_track", "Track →"),
                  },
                  {
                    label: t("dash_team_backlog", "PENDING BACKLOG"),
                    value: todoTasks,
                    href: "/tasks?status=todo",
                    icon: Clock,
                    iconColor: "text-amber-500",
                    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
                    hoverBorder: "hover:border-amber-500/50",
                    topBar: "bg-amber-500",
                    badge: "Queue",
                    badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40",
                    hint: "Awaiting Sprint Kickoff",
                    actionLabel: t("dash_inspect", "Inspect →"),
                  },
                  {
                    label: t("dash_team_shipped", "RESOLVED & SHIPPED"),
                    value: completedTasks,
                    href: "/tasks?status=completed",
                    icon: CheckCircle2,
                    iconColor: "text-emerald-500",
                    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
                    hoverBorder: "hover:border-emerald-500/50",
                    topBar: "bg-emerald-500",
                    badge: `${productivityPercent}% Done`,
                    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40",
                    hint: "Verified Deliverables",
                    actionLabel: t("dash_view", "View →"),
                  },
                ]
              : isManager
              ? [
                  {
                    label: t("dash_total_workspace_deliverables", "TEAM WORKLOAD"),
                    value: totalTasks,
                    href: "/tasks",
                    icon: Layers,
                    iconColor: "text-amber-500",
                    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
                    hoverBorder: "hover:border-amber-500/50",
                    topBar: "bg-amber-500",
                    badge: t("dash_badge_team", "Team"),
                    badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40",
                    hint: `${user?.department || "Team"} Items`,
                    actionLabel: t("dash_view_all", "View all →"),
                  },
                  {
                    label: t("dash_in_flight", "IN FLIGHT"),
                    value: activeTasks,
                    href: "/tasks?status=in_progress",
                    icon: PlayCircle,
                    iconColor: "text-sky-500",
                    iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
                    hoverBorder: "hover:border-sky-500/50",
                    topBar: "bg-sky-500",
                    badge: inReviewTasks > 0 ? "In-Flight" : "Active",
                    badgeBg: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border-sky-200/60 dark:border-sky-900/40",
                    hint: inReviewTasks > 0 ? `${inProgressTasks} Exec · ${inReviewTasks} Review` : "Active Execution",
                    actionLabel: t("dash_track", "Track →"),
                  },
                  {
                    label: t("dash_team_backlog", "TEAM BACKLOG"),
                    value: todoTasks,
                    href: "/tasks?status=todo",
                    icon: Clock,
                    iconColor: "text-indigo-500",
                    iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
                    hoverBorder: "hover:border-indigo-500/50",
                    topBar: "bg-indigo-500",
                    badge: t("dash_badge_queue", "Queue"),
                    badgeBg: "bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/40",
                    hint: "Awaiting Sprint Kickoff",
                    actionLabel: t("dash_inspect", "Inspect →"),
                  },
                  {
                    label: t("dash_team_shipped", "TEAM SHIPPED"),
                    value: completedTasks,
                    href: "/tasks?status=completed",
                    icon: CheckCircle2,
                    iconColor: "text-emerald-500",
                    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
                    hoverBorder: "hover:border-emerald-500/50",
                    topBar: "bg-emerald-500",
                    badge: `${productivityPercent}% Rate`,
                    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40",
                    hint: "Team Resolved",
                    actionLabel: t("dash_view", "View →"),
                  },
                ]
              : [
                  {
                    label: t("dash_my_assigned", "MY ASSIGNED DELIVERABLES"),
                    value: totalTasks,
                    href: "/tasks",
                    icon: CheckSquare,
                    iconColor: "text-[#5B5FEF]",
                    iconBg: "bg-[#5B5FEF]/10 dark:bg-[#5B5FEF]/20",
                    hoverBorder: "hover:border-[#5B5FEF]/50",
                    topBar: "bg-[#5B5FEF]",
                    badge: "Assigned",
                    badgeBg: "bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/40",
                    hint: "Workload Items",
                    actionLabel: t("dash_view_all", "View all →"),
                  },
                  {
                    label: t("in_progress", "IN PROGRESS"),
                    value: activeTasks,
                    href: "/tasks?status=in_progress",
                    icon: PlayCircle,
                    iconColor: "text-sky-500",
                    iconBg: "bg-sky-500/10 dark:bg-sky-500/20",
                    hoverBorder: "hover:border-sky-500/50",
                    topBar: "bg-sky-500",
                    badge: inReviewTasks > 0 ? `${inProgressTasks} In Flight` : "Today",
                    badgeBg: "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border-sky-200/60 dark:border-sky-900/40",
                    hint: "Active Today",
                    actionLabel: t("dash_track", "Track →"),
                  },
                  {
                    label: t("pending", "PENDING TO DO"),
                    value: todoTasks,
                    href: "/tasks?status=todo",
                    icon: Clock,
                    iconColor: "text-amber-500",
                    iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
                    hoverBorder: "hover:border-amber-500/50",
                    topBar: "bg-amber-500",
                    badge: "Upcoming",
                    badgeBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40",
                    hint: "Upcoming Backlog",
                    actionLabel: t("dash_inspect", "Inspect →"),
                  },
                  {
                    label: t("completed", "COMPLETED & SHIPPED"),
                    value: completedTasks,
                    href: "/tasks?status=completed",
                    icon: CheckCircle2,
                    iconColor: "text-emerald-500",
                    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
                    hoverBorder: "hover:border-emerald-500/50",
                    topBar: "bg-emerald-500",
                    badge: `${productivityPercent}% Rate`,
                    badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40",
                    hint: "Completed Tasks",
                    actionLabel: t("dash_view", "View →"),
                  },
                ]
            ).map((stat: any, idx: number) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={idx}
                  href={stat.href}
                  className={`group relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800/90 shadow-2xs ${stat.hoverBorder} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${stat.topBar} opacity-80 group-hover:opacity-100 transition-opacity`} />
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider truncate mr-1.5">
                        {stat.label}
                      </span>
                      <div className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center ${stat.iconBg} ${stat.iconColor} shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between gap-2 my-1 sm:my-1.5">
                      <div className="text-[22px] sm:text-[24px] font-black text-slate-900 dark:text-white leading-none tracking-tight font-mono">
                        {stat.value}
                      </div>
                      {stat.badge && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${stat.badgeBg}`}>
                          {stat.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    <span className="truncate">{stat.hint}</span>
                    <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-hover:text-[#5B5FEF] transition-all duration-200 shrink-0 font-bold text-[11px]">
                      {stat.actionLabel}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollReveal>

        {/* ================= MAIN DASHBOARD BODY ================= */}
        <ScrollReveal animation="slide-up" delay={120}>
        {isAdmin ? (
          <div className="space-y-5 sm:space-y-6">
            
            {/* ================= 1. UPPER SECTION: TOP ANALYTICS & PERFORMANCE CHARTS ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              
              {/* Admin Chart 1: Enterprise Workforce & Resource Allocation Cockpit */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow min-h-[420px] sm:min-h-[440px]">
                {/* Header: Title, Live Allocation Tag, and View Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/40 flex items-center justify-center text-[#0284C7] dark:text-sky-400 shadow-2xs shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[16px] sm:text-[17px] font-black text-slate-900 dark:text-white tracking-tight">
                          {t("dash_resource_alloc_title", "Enterprise Resource Allocation")}
                        </h3>
                        <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-900/40 rounded-md text-[10px] font-bold flex items-center gap-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" /> {t("dash_100_allocated", "100% ALLOCATED")}
                        </span>
                        <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 rounded-md text-[10px] font-bold">
                          <Users className="w-3 h-3 text-sky-500" /> {dashboardData?.totalUsers || dashboardData?.totalEmployees || 128} {t("dash_members", "Members")}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {t("dash_resource_alloc_sub", "Workforce headcount distribution across functional units")}
                      </p>
                    </div>
                  </div>

                  {/* View Mode Switcher: Donut Ring vs Capacity Matrix */}
                  <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setResourceChartMode("donut")}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        resourceChartMode === "donut"
                          ? "bg-white dark:bg-slate-700 text-[#0284C7] dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      title="Interactive Donut Ring & Headcount Cockpit"
                    >
                      <CircleDashed className="w-3.5 h-3.5" />
                      <span>{t("dash_donut", "Donut")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResourceChartMode("bars")}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        resourceChartMode === "bars"
                          ? "bg-white dark:bg-slate-700 text-[#0284C7] dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      title="Department Capacity Breakdown"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{t("dash_capacity", "Capacity")}</span>
                    </button>
                  </div>
                </div>

                {resourceChartMode === "donut" ? (
                  /* Mode 1: Modern Donut Ring with Interactive Center Cockpit + Department Breakdown */
                  <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 flex-1 my-1">
                    {/* Left: Sleek Donut Ring with interactive center readout (No overlapping popup collision) */}
                    <div className="w-[220px] h-[220px] sm:w-[245px] sm:h-[245px] shrink-0 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topCategoriesData}
                            cx="50%"
                            cy="50%"
                            innerRadius={68}
                            outerRadius={96}
                            paddingAngle={3}
                            cornerRadius={5}
                            dataKey="value"
                            stroke="transparent"
                            isAnimationActive={true}
                            animationBegin={100}
                            animationDuration={1200}
                            animationEasing="ease-out"
                          >
                            {topCategoriesData.map((entry: any, index: number) => {
                              const isHovered = activeCategoryIndex === index;
                              const isAnyHovered = activeCategoryIndex !== null;
                              return (
                                <Cell
                                  key={`cell-topcat-${index}`}
                                  fill={entry.color}
                                  className="transition-all duration-300 cursor-pointer outline-none"
                                  style={{
                                    filter: isHovered
                                      ? `drop-shadow(0px 4px 16px ${entry.color}90) brightness(1.18)`
                                      : "drop-shadow(0px 1px 2px rgba(0,0,0,0.06))",
                                    opacity: !isAnyHovered || isHovered ? 1 : 0.45,
                                    transform: isHovered ? "scale(1.06)" : "scale(1)",
                                    transformOrigin: "center center",
                                    transition: "all 0.25s ease-out",
                                  }}
                                  onMouseEnter={() => setActiveCategoryIndex(index)}
                                  onMouseLeave={() => setActiveCategoryIndex(null)}
                                />
                              );
                            })}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center Cockpit Hole Readout (Zero Overlap, Crystal-Clear Telemetry) */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <div
                          className="w-[122px] h-[122px] rounded-full flex flex-col items-center justify-center text-center px-2.5 transition-all duration-300 backdrop-blur-xs border shadow-inner"
                          style={{
                            backgroundColor:
                              activeCategoryIndex !== null && topCategoriesData[activeCategoryIndex]
                                ? "rgba(255, 255, 255, 0.96)"
                                : "rgba(248, 250, 252, 0.7)",
                            borderColor:
                              activeCategoryIndex !== null && topCategoriesData[activeCategoryIndex]
                                ? `${topCategoriesData[activeCategoryIndex].color}50`
                                : "rgba(226, 232, 240, 0.8)",
                            boxShadow:
                              activeCategoryIndex !== null && topCategoriesData[activeCategoryIndex]
                                ? `0 0 20px ${topCategoriesData[activeCategoryIndex].color}25, inset 0 0 10px ${topCategoriesData[activeCategoryIndex].color}12`
                                : undefined,
                          }}
                        >
                          {activeCategoryIndex !== null && topCategoriesData[activeCategoryIndex] ? (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
                              <span
                                className="w-2.5 h-2.5 rounded-full mb-1 shadow-xs ring-2 ring-white dark:ring-slate-900"
                                style={{ backgroundColor: topCategoriesData[activeCategoryIndex].color }}
                              />
                              <span className="text-[12px] font-black text-slate-900 dark:text-white truncate max-w-[102px] leading-tight">
                                {translateDept(topCategoriesData[activeCategoryIndex].name)}
                              </span>
                              <span
                                className="text-[23px] font-black font-mono leading-tight my-0.5 tracking-tight"
                                style={{ color: topCategoriesData[activeCategoryIndex].color }}
                              >
                                {topCategoriesData[activeCategoryIndex].value}%
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                                {topCategoriesData[activeCategoryIndex].count || Math.round((topCategoriesData[activeCategoryIndex].value / 100) * 128)} {t("dash_members", "Members")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
                              <span className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                                {t("dash_workforce", "WORKFORCE")}
                              </span>
                              <span className="text-[25px] font-black text-slate-900 dark:text-white font-mono leading-tight my-0.5 tracking-tight">
                                {dashboardData?.totalUsers || dashboardData?.totalEmployees || 128}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {t("dash_100_allocated", "100% Allocated")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Vertical Department Breakdown with Structured Executive Cardlets */}
                    <div className="flex-1 w-full max-h-[255px] sm:max-h-[270px] overflow-y-auto space-y-2 pr-1.5 custom-scrollbar">
                      {topCategoriesData.map((item: any, idx: number) => {
                        const isHovered = activeCategoryIndex === idx;
                        const estCount = item.count || Math.round((item.value / 100) * (dashboardData?.totalUsers || 128));
                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => setActiveCategoryIndex(idx)}
                            onMouseLeave={() => setActiveCategoryIndex(null)}
                            className={`px-3 py-2 rounded-xl transition-all duration-200 group cursor-pointer border ${
                              isHovered
                                ? "bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-600 shadow-xs scale-[1.01]"
                                : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs"
                            }`}
                            style={{
                              borderLeftColor: item.color,
                              borderLeftWidth: "3.5px",
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-2xs transition-transform duration-200 ${
                                    isHovered ? "scale-125" : ""
                                  }`}
                                  style={{ backgroundColor: item.color }}
                                />
                                <span
                                  className={`text-[12.5px] truncate transition-colors ${
                                    isHovered
                                      ? "font-black text-slate-900 dark:text-white"
                                      : "font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white"
                                  }`}
                                >
                                  {translateDept(item.name)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 text-[10.5px] font-semibold font-mono border border-slate-200/80 dark:border-slate-700/70 shadow-2xs">
                                  {estCount} {t("dash_staff", "staff")}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-black border transition-colors ${
                                    isHovered
                                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/70"
                                      : "bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60"
                                  }`}
                                >
                                  {item.value}%
                                </span>
                              </div>
                            </div>
                            {/* Sleek dynamic allocation progress bar with visible track */}
                            <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${item.value}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Mode 2: Full Department Capacity Matrix */
                  <div className="w-full flex-1 max-h-[255px] sm:max-h-[270px] overflow-y-auto space-y-2 pr-1.5 custom-scrollbar py-1">
                    {topCategoriesData.map((item: any, idx: number) => {
                      const estCount = item.count || Math.round((item.value / 100) * (dashboardData?.totalUsers || 128));
                      const isPrimary = item.value >= 20;
                      return (
                        <div
                          key={idx}
                          className="px-3 py-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 shadow-2xs hover:bg-white dark:hover:bg-slate-800 transition-all"
                          style={{
                            borderLeftColor: item.color,
                            borderLeftWidth: "3.5px",
                          }}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-2xs" style={{ backgroundColor: item.color }} />
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-[12.5px]">{translateDept(item.name)}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                isPrimary 
                                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/40" 
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200/60 dark:border-slate-700/60"
                              }`}>
                                {isPrimary ? t("dash_primary_unit", "Primary Unit") : t("dash_balanced_unit", "Balanced")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 text-[10.5px] font-semibold border border-slate-200/80 dark:border-slate-700/70 shadow-2xs">{estCount} {t("dash_staff", "staff")}</span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black border border-slate-200/60 dark:border-slate-700/60">{item.value}%</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700/80 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${item.value}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer: Summary & Status */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[12px] font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                    <span>{t("dash_top_unit", "Top Unit:")} <strong className="text-slate-700 dark:text-slate-200">{translateDept(topCategoriesData[0]?.name || "Engineering")} ({topCategoriesData[0]?.value || 33}%)</strong></span>
                  </div>
                  <span className="text-[#0284C7] dark:text-sky-400 font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> {t("dash_balanced_alloc", "100% Balanced Allocation")}
                  </span>
                </div>
              </div>

              {/* Admin Chart 2: Weekly Task Activity & Velocity Cockpit */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-shadow min-h-[420px] sm:min-h-[440px]">
                {/* Header: Title, Live Status Badges, and Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-[#5B5FEF] shadow-2xs shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[16px] sm:text-[17px] font-black text-slate-900 dark:text-white tracking-tight">
                          {t("dash_weekly_activity_title", "Weekly Task Activity")}
                        </h3>
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 rounded-md text-[10px] font-bold flex items-center gap-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {t("dash_live", "Live")}
                        </span>
                        <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 rounded-md text-[10px] font-bold">
                          <CalendarDays className="w-3 h-3 text-[#5B5FEF]" />
                          {t("dash_this_week", "This Week")}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {t("dash_weekly_activity_sub", "Daily comparison of new tasks created vs tasks completed this week")}
                      </p>
                    </div>
                  </div>

                  {/* View Mode Switcher: Daily Tasks (Default) vs Weekly Trend vs Completion Rate % */}
                  <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setAdminChartMode("bar")}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        adminChartMode === "bar"
                          ? "bg-white dark:bg-slate-700 text-[#5B5FEF] dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      title="Daily Tasks Created vs Completed"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>{t("dash_daily_tasks", "Daily Tasks")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminChartMode("burnup")}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        adminChartMode === "burnup"
                          ? "bg-white dark:bg-slate-700 text-[#5B5FEF] dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      title="Cumulative Progress Trend"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{t("dash_weekly_trend", "Weekly Trend")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminChartMode("trend")}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        adminChartMode === "trend"
                          ? "bg-white dark:bg-slate-700 text-[#5B5FEF] dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                      title="Daily Completion Rate Percentage"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>{t("dash_completion_pct", "Completion %")}</span>
                    </button>
                  </div>
                </div>

                {/* Top 3 Understandable Metric Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2.5 px-3 sm:px-4 mb-2 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800/80">
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#5B5FEF]" />
                      <p className="text-[10.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t("dash_tasks_created", "Tasks Created")}</p>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-[18px] sm:text-[20px] font-black text-slate-900 dark:text-white font-mono leading-tight">
                        {weeklyVelocityStats.totalCreated}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">{t("dash_total_added", "Total Added")}</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {t("dash_new_work_week", "New work this week")}
                    </p>
                  </div>

                  <div className="border-x border-slate-200/70 dark:border-slate-700/60 px-2 sm:px-3 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <p className="text-[10.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t("dash_tasks_completed", "Tasks Completed")}</p>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-[18px] sm:text-[20px] font-black text-emerald-600 dark:text-emerald-400 font-mono leading-tight">
                        {weeklyVelocityStats.totalCompleted}
                      </span>
                      <span className="text-[11px] font-medium text-emerald-600/70 dark:text-emerald-400/70">{t("dash_resolved", "Resolved")}</span>
                    </div>
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 truncate flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> {t("dash_finished_tasks", "Finished tasks")}
                    </p>
                  </div>

                  <div className="text-right flex flex-col justify-between">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <p className="text-[10.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t("dash_completion_rate", "Completion Rate")}</p>
                    </div>
                    <div className="flex items-baseline justify-end gap-1.5 mt-1">
                      <span className="text-[18px] sm:text-[20px] font-black text-[#5B5FEF] dark:text-indigo-400 font-mono leading-tight">
                        {weeklyVelocityStats.velocityRate}%
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">{t("dash_progress", "Progress")}</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      Avg ~{weeklyVelocityStats.avgDailyShipped} {t("dash_tasks_per_day", "tasks/day")}
                    </p>
                  </div>
                </div>

                {/* Chart Canvas Area with Visible, Clean Grid Lines */}
                <div className="h-[230px] sm:h-[245px] w-full flex-1 my-1">
                  <ResponsiveContainer width="100%" height="100%">
                    {adminChartMode === "bar" ? (
                      <BarChart data={weeklyActivityData} margin={{ top: 12, right: 12, bottom: 0, left: -16 }}>
                        <defs>
                          <linearGradient id="adminBarCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.85} />
                          </linearGradient>
                          <linearGradient id="adminBarCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#CBD5E1" strokeOpacity={0.7} />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#64748B", fontWeight: 700 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11.5, fill: "#64748B", fontWeight: 700 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(99, 102, 241, 0.06)", radius: 8 }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0]?.payload;
                              const createdVal = d?.rawCreated ?? d?.created ?? 0;
                              const completedVal = d?.completed ?? 0;
                              const rate = createdVal > 0 ? Math.round((completedVal / createdVal) * 100) : 0;
                              return (
                                <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 min-w-[175px]">
                                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                    <p className="font-bold text-[13px] text-slate-900 dark:text-white">{d?.fullDay || label}</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                      rate >= 30
                                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                                        : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60"
                                    }`}>
                                      {rate}% Resolved
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 pt-0.5">
                                    <div className="flex items-center justify-between gap-3 text-[12px]">
                                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                                        {t("dash_tasks_created", "Tasks Created")}:
                                      </span>
                                      <span className="font-mono font-bold text-slate-900 dark:text-white">{createdVal}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 text-[12px]">
                                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                                        {t("dash_tasks_completed", "Tasks Completed")}:
                                      </span>
                                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{completedVal}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="created"
                          name={t("dash_tasks_created", "Tasks Created")}
                          fill="url(#adminBarCreatedGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={24}
                        />
                        <Bar
                          dataKey="completed"
                          name={t("dash_tasks_completed", "Tasks Completed")}
                          fill="url(#adminBarCompletedGrad)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={24}
                        />
                      </BarChart>
                    ) : adminChartMode === "burnup" ? (
                      <AreaChart data={weeklyActivityData} margin={{ top: 12, right: 12, bottom: 0, left: -14 }}>
                        <defs>
                          <linearGradient id="adminBurnupScope" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="adminBurnupShipped" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#CBD5E1" strokeOpacity={0.7} />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#64748B", fontWeight: 700 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11.5, fill: "#64748B", fontWeight: 700 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0]?.payload;
                              return (
                                <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 min-w-[175px]">
                                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                    <p className="font-bold text-[13px] text-slate-900 dark:text-white">{d?.fullDay || label}</p>
                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60">
                                      {t("dash_cumulative", "Cumulative")}
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 pt-0.5">
                                    <div className="flex items-center justify-between gap-3 text-[12px]">
                                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                                        {t("dash_total_added", "Total Created")}:
                                      </span>
                                      <span className="font-mono font-bold text-slate-900 dark:text-white">{d?.cumulativeCreated ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 text-[12px]">
                                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                                        {t("dash_tasks_completed", "Total Completed")}:
                                      </span>
                                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{d?.cumulativeCompleted ?? 0}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cumulativeCreated"
                          name={t("dash_tasks_created", "Total Created")}
                          stroke="#6366F1"
                          strokeWidth={2.5}
                          fill="url(#adminBurnupScope)"
                          dot={{ r: 3.5, stroke: "#6366F1", strokeWidth: 2, fill: "#ffffff" }}
                          activeDot={{ r: 5, stroke: "#6366F1", strokeWidth: 2, fill: "#ffffff" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cumulativeCompleted"
                          name={t("dash_tasks_completed", "Total Completed")}
                          stroke="#10B981"
                          strokeWidth={2.5}
                          fill="url(#adminBurnupShipped)"
                          dot={{ r: 3.5, stroke: "#10B981", strokeWidth: 2, fill: "#ffffff" }}
                          activeDot={{ r: 5, stroke: "#10B981", strokeWidth: 2, fill: "#ffffff" }}
                        />
                      </AreaChart>
                    ) : (
                      <AreaChart data={weeklyActivityData} margin={{ top: 12, right: 12, bottom: 0, left: -14 }}>
                        <defs>
                          <linearGradient id="adminEfficiencyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#CBD5E1" strokeOpacity={0.7} />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#64748B", fontWeight: 700 }}
                          dy={8}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11.5, fill: "#64748B", fontWeight: 700 }}
                          unit="%"
                          domain={[0, 100]}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0]?.payload;
                              return (
                                <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 min-w-[170px]">
                                  <p className="font-bold text-[13px] text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                                    {d?.fullDay || label} {t("dash_stat_done", "Completion")}
                                  </p>
                                  <div className="flex items-center justify-between gap-2 pt-0.5">
                                    <span className="text-slate-500 dark:text-slate-400">{t("dash_resolution_rate", "Resolution Rate:")}</span>
                                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{d?.efficiencyRate ?? 0}%</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                                    <span>{t("dash_completed_created", "Completed / Created:")}</span>
                                    <span className="font-mono">{d?.completed} / {d?.rawCreated ?? d?.created}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="efficiencyRate"
                          name={t("dash_completion_pct", "Completion Rate %")}
                          stroke="#3B82F6"
                          strokeWidth={2.5}
                          fill="url(#adminEfficiencyGrad)"
                          dot={{ r: 3.5, stroke: "#3B82F6", strokeWidth: 2, fill: "#ffffff" }}
                          activeDot={{ r: 5, stroke: "#3B82F6", strokeWidth: 2, fill: "#ffffff" }}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Footer Legend with Clear, Understandable Labels */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[12px]">
                  <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-[3px] bg-[#6366F1]" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {t("dash_tasks_created", "Tasks Created")}
                      </span>
                      <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 text-[11px] font-mono font-bold rounded">
                        {weeklyVelocityStats.totalCreated}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-[3px] bg-[#10B981]" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {t("dash_tasks_completed", "Tasks Completed")}
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-[11px] font-mono font-bold rounded">
                        {weeklyVelocityStats.totalCompleted}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>{t("dash_highest_activity", "Highest Activity:")}</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {weeklyVelocityStats.peakDay}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= 2. MIDDLE SECTION: STRATEGIC PROJECTS (SUPER ADMIN) / TEAM PROFILES ================= */}
            {isSuperAdmin ? (
              <div className="space-y-4.5">
                {/* 2A. STRATEGIC PROJECTS PORTFOLIO */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
                  {/* Top Header Row: Title & Subtitle on Left, Primary CTA "Dispatch Initiative" on Right */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shadow-2xs shrink-0 text-[#5B5FEF]">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-[16px] sm:text-[17px] font-black text-slate-900 dark:text-white">
                          Strategic Projects Portfolio
                        </h3>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          Active initiatives, appointed managers, and team progress across departments
                        </p>
                      </div>
                    </div>

                    {/* Primary CTA: Dispatch Initiative (Refined Enterprise Design) */}
                    <button
                      type="button"
                      onClick={() => handleOpenDispatch()}
                      className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-[#5B5FEF] to-indigo-600 hover:from-indigo-700 hover:via-[#4D51DB] hover:to-indigo-700 text-white text-[12px] font-bold shadow-xs hover:shadow-md hover:shadow-indigo-500/20 border border-indigo-400/30 dark:border-indigo-400/20 transition-all duration-200 active:scale-95 shrink-0 cursor-pointer self-start sm:self-auto group"
                      title="Dispatch New Initiative or Project to Manager"
                    >
                      <div className="w-5 h-5 rounded-lg bg-white/20 dark:bg-white/15 flex items-center justify-center backdrop-blur-xs group-hover:scale-105 transition-transform">
                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      </div>
                      <span>Dispatch Initiative</span>
                    </button>
                  </div>

                  {/* Controls & Filter Toolbar: Clean Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {/* Left: Department Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
                      {[
                        { id: "all", label: "All Initiatives" },
                        { id: "Engineering", label: "Engineering" },
                        { id: "Operations", label: "Operations" },
                        { id: "Design", label: "Design" },
                        { id: "Sales", label: "Sales & Growth" },
                        { id: "Human", label: "HR" },
                        { id: "Finance", label: "Finance" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setProjectDeptFilter(f.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            projectDeptFilter === f.id
                              ? "bg-[#5B5FEF] text-white shadow-xs font-extrabold"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Right: Search Input + View Mode Toggle */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Search Input (Properly padded, no icon/logo overlap) */}
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search initiatives..."
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          className="w-full h-9 pl-9 pr-8 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[12px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF] transition-all"
                        />
                        {projectSearch && (
                          <button
                            type="button"
                            onClick={() => setProjectSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Clear search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* View Mode Toggle: List vs Cards */}
                      <div className="h-9 flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs shrink-0">
                        <button
                          type="button"
                          onClick={() => setProjectViewMode("list")}
                          className={`h-7 px-3 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            projectViewMode === "list"
                              ? "bg-white dark:bg-slate-900 text-[#5B5FEF] dark:text-indigo-300 shadow-xs font-extrabold"
                              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          }`}
                          title="Table List View"
                        >
                          <LayoutList className="w-3.5 h-3.5" />
                          <span>List</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectViewMode("grid")}
                          className={`h-7 px-3 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            projectViewMode === "grid"
                              ? "bg-white dark:bg-slate-900 text-[#5B5FEF] dark:text-indigo-300 shadow-xs font-extrabold"
                              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          }`}
                          title="Card Grid View"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>Cards</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {searchedProjects.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                        <FolderKanban className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-[13.5px] font-bold text-slate-600 dark:text-slate-300">No project initiatives found</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">No projects match the current search query or department filter.</p>
                    </div>
                  ) : projectViewMode === "list" ? (
                    /* ================= VIEW 1: ENTERPRISE TABLE LIST VIEW ================= */
                    <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/80">
                              {/* Initiative Title & Code */}
                              <th className="py-3.5 pl-4 pr-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[190px]">
                                Initiative & Code
                              </th>
                              {/* Department */}
                              <th className="py-3.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[110px]">
                                Department
                              </th>
                              {/* Appointed Lead */}
                              <th className="py-3.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[160px]">
                                Appointed Lead
                              </th>
                              {/* Sprint Progress */}
                              <th className="py-3.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[125px]">
                                Sprint Progress
                              </th>
                              {/* Target Date */}
                              <th className="py-3.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[100px]">
                                Target Date
                              </th>
                              {/* Status */}
                              <th className="py-3.5 px-3 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center min-w-[105px]">
                                Status
                              </th>
                              {/* Actions Column (Sticky Right for guaranteed visibility) */}
                              <th className="sticky right-0 z-20 py-3.5 pr-4 pl-2 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-[116px] min-w-[116px] bg-[#F8FAFC] dark:bg-slate-800/95 shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.3)]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[13px]">
                            {paginatedListProjects.map((prj, index) => {
                              const deptStyles: Record<string, { bar: string; badge: string; bg: string }> = {
                                Engineering:     { bar: "from-[#5B5FEF] to-[#818CF8]", badge: "text-[#5B5FEF] dark:text-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900/40" },
                                Operations:      { bar: "from-amber-500 to-amber-400", badge: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900/40" },
                                Design:          { bar: "from-sky-500 to-sky-400", badge: "text-sky-700 dark:text-sky-300", bg: "bg-sky-50 dark:bg-sky-950/60 border-sky-100 dark:border-sky-900/40" },
                                "IT & Security": { bar: "from-emerald-500 to-teal-400", badge: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/40" },
                                Sales:           { bar: "from-rose-500 to-pink-400", badge: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900/40" },
                                HR:              { bar: "from-purple-500 to-purple-400", badge: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900/40" },
                                Finance:         { bar: "from-teal-500 to-emerald-400", badge: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50 dark:bg-teal-950/60 border-teal-100 dark:border-teal-900/40" },
                              };
                              const s = deptStyles[prj.department] || deptStyles["Engineering"];

                              return (
                                <tr
                                  key={prj.id}
                                  onClick={() => setSelectedProject(prj)}
                                  className={`border-b border-slate-200/85 dark:border-slate-800/80 transition-all duration-150 group cursor-pointer ${
                                    index % 2 === 0
                                      ? "bg-white dark:bg-slate-900"
                                      : "bg-[#F8FAFC] dark:bg-[#131B2A]"
                                  } hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30`}
                                >
                                  {/* Initiative Title & Code */}
                                  <td className="py-3 pl-4 pr-3 align-middle min-w-[190px]">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                          {prj.code}
                                        </span>
                                        {prj.priority && (
                                          <span className={`text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded ${
                                            prj.priority === "Critical" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40" :
                                            prj.priority === "High" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40" :
                                            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                                          }`}>
                                            {prj.priority}
                                          </span>
                                        )}
                                      </div>
                                      <h4
                                        className="font-extrabold text-[13px] text-slate-900 dark:text-white group-hover:text-[#5B5FEF] transition-colors line-clamp-1"
                                        title={prj.name}
                                      >
                                        {prj.name}
                                      </h4>
                                    </div>
                                  </td>

                                  {/* Department */}
                                  <td className="py-3 px-3 align-middle whitespace-nowrap min-w-[110px]">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${s.bg} ${s.badge}`}>
                                      <Building2 className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{prj.department}</span>
                                    </span>
                                  </td>

                                  {/* Appointed Lead (+ Team Personnel Badge) */}
                                  <td className="py-3 px-3 align-middle whitespace-nowrap min-w-[160px]">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-full bg-[#5B5FEF] text-white flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden shadow-2xs ring-1 ring-slate-200 dark:ring-slate-700">
                                        {prj.manager?.avatarUrl ? (
                                          <img src={prj.manager.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                        ) : (
                                          prj.manager?.initials || "DM"
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                                          {prj.manager?.name || "Appointed Manager"}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <p className="text-[10px] text-slate-400 font-medium truncate">
                                            {prj.manager?.role || "Project Lead"}
                                          </p>
                                          {prj.contributorsCount > 0 && (
                                            <span
                                              className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 shrink-0"
                                              title={`${prj.contributorsCount} team personnel assigned`}
                                            >
                                              +{prj.contributorsCount} team
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Sprint Progress */}
                                  <td className="py-3 px-3 align-middle whitespace-nowrap min-w-[125px]">
                                    <div className="w-28 sm:w-32 space-y-1">
                                      <div className="flex items-center justify-between text-[10.5px] font-bold">
                                        <span className="text-slate-500 dark:text-slate-400">
                                          {prj.completedTasks}/{prj.totalTasks} Tasks
                                        </span>
                                        <span className="text-[#5B5FEF] dark:text-indigo-400 font-extrabold">
                                          {prj.progress}%
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-200 dark:bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full bg-gradient-to-r ${s.bar} rounded-full transition-all duration-700`}
                                          style={{ width: `${Math.max(prj.progress, 5)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Target Date */}
                                  <td className="py-3 px-3 align-middle whitespace-nowrap min-w-[100px]">
                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
                                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>{prj.targetDate}</span>
                                    </span>
                                  </td>

                                  {/* Status Pill */}
                                  <td className="py-3 px-3 text-center align-middle whitespace-nowrap min-w-[105px]">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                      <span>{prj.status}</span>
                                    </span>
                                  </td>

                                  {/* Actions Column (Sticky Right for guaranteed zero-clipping visibility) */}
                                  <td className={`sticky right-0 z-10 py-3 pr-4 pl-2 text-right align-middle whitespace-nowrap w-[116px] min-w-[116px] ${
                                    index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-[#F8FAFC] dark:bg-[#131B2A]"
                                  } group-hover:bg-[#EEF2FF] dark:group-hover:bg-[#182238] transition-colors shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.3)]`}>
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* 1. View Details (Indigo Eye Button) */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedProject(prj);
                                        }}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5B5FEF] dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/60 hover:bg-[#5B5FEF] hover:text-white dark:hover:bg-[#5B5FEF] dark:hover:text-white border border-indigo-200/80 dark:border-indigo-800/50 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                                        title="View Initiative Details & Team"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>

                                      {/* 2. Dispatch Task (Amber Zap Button) */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenDispatch(prj.manager?._id, prj.department);
                                        }}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 bg-amber-50/90 dark:bg-amber-950/60 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white border border-amber-200/80 dark:border-amber-800/50 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                                        title={`Dispatch task directly to ${prj.manager?.name || "Manager"}`}
                                      >
                                        <Zap className="w-3.5 h-3.5 fill-current" />
                                      </button>

                                      {/* 3. Deliverables Link (ArrowUpRight) */}
                                      <Link
                                        href={`/tasks?department=${encodeURIComponent(prj.department)}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white dark:text-slate-400 dark:hover:text-white hover:bg-[#5B5FEF] dark:hover:bg-[#5B5FEF] bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
                                        title="Open Department Deliverables & Tasks"
                                      >
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                      </Link>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Jira-Style Table Footer (Pagination & Row Size Controls) */}
                      <div className="px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-[#F4F5F7]/60 dark:bg-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-3">
                        {/* Left: Total Count */}
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
                            Total Initiatives:{" "}
                            <strong className="text-slate-900 dark:text-white font-extrabold">{searchedProjects.length}</strong>
                          </span>
                        </div>

                        {/* Center: Row Size Selector (5, 10, 20) + Counter */}
                        <div className="flex flex-wrap items-center gap-3 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span>Show:</span>
                            <div className="relative inline-flex items-center">
                              <select
                                value={projectsPerPage}
                                onChange={(e) => {
                                  setProjectsPerPage(Number(e.target.value));
                                  setProjectPage(1);
                                }}
                                className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1 pr-6 text-[12px] font-bold outline-none hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#5B5FEF] cursor-pointer shadow-2xs transition-all"
                              >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                              </select>
                              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                            </div>
                            <span>per page</span>
                          </div>

                          <span className="text-slate-300 dark:text-slate-700">•</span>

                          {/* Counter */}
                          <div className="flex items-center gap-1.5">
                            <span>
                              {searchedProjects.length > 0
                                ? `${(projectPage - 1) * projectsPerPage + 1}-${Math.min(
                                    projectPage * projectsPerPage,
                                    searchedProjects.length
                                  )} of ${searchedProjects.length}`
                                : "0 of 0"}
                            </span>
                          </div>
                        </div>

                        {/* Right: Numbered Pagination Controls */}
                        {totalProjectPages > 1 ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setProjectPage((p) => Math.max(1, p - 1))}
                              disabled={projectPage === 1}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                              title="Previous page"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: totalProjectPages }, (_, i) => i + 1)
                              .filter((p) => {
                                if (totalProjectPages <= 5) return true;
                                if (p === 1 || p === totalProjectPages) return true;
                                if (Math.abs(p - projectPage) <= 1) return true;
                                return false;
                              })
                              .map((page, idx, arr) => {
                                const prev = arr[idx - 1];
                                const hasGap = prev && page - prev > 1;

                                return (
                                  <div key={page} className="flex items-center">
                                    {hasGap && (
                                      <span className="px-1 text-slate-400 text-xs select-none">…</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setProjectPage(page)}
                                      className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                        projectPage === page
                                          ? "bg-[#5B5FEF] text-white shadow-2xs scale-105"
                                          : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  </div>
                                );
                              })}

                            <button
                              type="button"
                              onClick={() => setProjectPage((p) => Math.min(totalProjectPages, p + 1))}
                              disabled={projectPage === totalProjectPages}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                              title="Next page"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 hidden md:block" />
                        )}
                      </div>
                    </div>
                  ) : (
                    /* ================= VIEW 2: CARD GRID VIEW (2-ROW LIMIT & EXPAND) ================= */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {displayedGridProjects.map((prj) => {
                          const deptStyles: Record<string, { bar: string; badge: string; bg: string }> = {
                            Engineering:     { bar: "from-[#5B5FEF] to-[#818CF8]", badge: "text-[#5B5FEF] dark:text-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900/40" },
                            Operations:      { bar: "from-amber-500 to-amber-400", badge: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900/40" },
                            Design:          { bar: "from-sky-500 to-sky-400", badge: "text-sky-700 dark:text-sky-300", bg: "bg-sky-50 dark:bg-sky-950/60 border-sky-100 dark:border-sky-900/40" },
                            "IT & Security": { bar: "from-emerald-500 to-teal-400", badge: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/40" },
                            Sales:           { bar: "from-rose-500 to-pink-400", badge: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900/40" },
                            HR:              { bar: "from-purple-500 to-purple-400", badge: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900/40" },
                            Finance:         { bar: "from-teal-500 to-emerald-400", badge: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50 dark:bg-teal-950/60 border-teal-100 dark:border-teal-900/40" },
                          };
                          const s = deptStyles[prj.department] || deptStyles["Engineering"];

                          return (
                            <div
                              key={prj.id}
                              onClick={() => setSelectedProject(prj)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedProject(prj);
                                }
                              }}
                              className="relative overflow-hidden rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-lg hover:-translate-y-1 hover:border-[#5B5FEF]/60 dark:hover:border-[#5B5FEF]/50 transition-all duration-200 group flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/40"
                            >
                              {/* Department Gradient Accent Bar */}
                              <div className={`h-1 w-full bg-gradient-to-r ${s.bar}`} />

                              <div className="p-4 sm:p-4.5 flex flex-col flex-1">
                                {/* Top Row: Code Pill + Department + Status + Hover Cue */}
                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-2xs">
                                      {prj.code}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${s.bg} ${s.badge}`}>
                                      {prj.department}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-extrabold text-[#5B5FEF] dark:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                                      View Details →
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      {prj.status}
                                    </span>
                                  </div>
                                </div>

                                {/* Project Title (Clean, concise) */}
                                <h4 className="text-[14px] font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[#5B5FEF] transition-colors mb-3 line-clamp-1">
                                  {prj.name}
                                </h4>

                                {/* Manager Lead & Team Allocation Row */}
                                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700/60 mb-3 space-y-2">
                                  {/* Lead Manager */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded-full bg-[#5B5FEF] text-white flex items-center justify-center font-bold text-[9.5px] shrink-0 overflow-hidden shadow-2xs">
                                        {prj.manager?.avatarUrl ? (
                                          <img src={prj.manager.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                                        ) : (
                                          prj.manager?.initials || "DM"
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                                          {prj.manager?.name || "Appointed Manager"}
                                        </p>
                                        <p className="text-[9.5px] text-slate-400 font-medium truncate">
                                          Project Lead · {prj.manager?.role || "Manager"}
                                        </p>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDispatch(prj.manager?._id, prj.department);
                                      }}
                                      className="p-1 rounded-lg text-slate-400 hover:text-[#5B5FEF] hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                      title={`Dispatch task directly to ${prj.manager?.name}`}
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Assigned Contributors Count & Avatars */}
                                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center -space-x-1.5 overflow-hidden">
                                      {prj.contributorsPreview.map((c: any, i: number) => (
                                        <div
                                          key={c.id || i}
                                          className="w-5 h-5 rounded-full ring-1 ring-white dark:ring-slate-800 bg-slate-200 dark:bg-slate-700 text-[8.5px] font-black text-slate-700 dark:text-slate-200 flex items-center justify-center overflow-hidden"
                                          title={c.name}
                                        >
                                          {c.avatarUrl ? (
                                            <img src={c.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                                          ) : (
                                            c.initials
                                          )}
                                        </div>
                                      ))}
                                      {prj.contributorsCount > 4 && (
                                        <span className="w-5 h-5 rounded-full ring-1 ring-white dark:ring-slate-800 bg-indigo-50 dark:bg-indigo-950 text-[8px] font-extrabold text-[#5B5FEF] dark:text-indigo-300 flex items-center justify-center">
                                          +{prj.contributorsCount - 4}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                      {prj.contributorsCount} Personnel Handling
                                    </span>
                                  </div>
                                </div>

                                {/* Work Done & Progress Bar */}
                                <div className="mt-auto pt-1 space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span className="text-slate-500 dark:text-slate-400">
                                      Work Done: {prj.completedTasks} / {prj.totalTasks} Tasks
                                    </span>
                                    <span className="text-[#5B5FEF] dark:text-indigo-400 font-extrabold">
                                      {prj.progress}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full bg-gradient-to-r ${s.bar} rounded-full transition-all duration-700`}
                                      style={{ width: `${Math.max(prj.progress, 5)}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Footer Strip: Target Date & Track Link */}
                                <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between text-[10.5px] font-medium text-slate-400 dark:text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    Target: {prj.targetDate}
                                  </span>
                                  <Link
                                    href={`/tasks?department=${encodeURIComponent(prj.department)}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-bold text-[#5B5FEF] dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                                  >
                                    <span>Deliverables</span>
                                    <ArrowUpRight className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Expand / Collapse 2-Row Limit Toggle Button */}
                      {searchedProjects.length > 6 && (
                        <div className="flex items-center justify-center pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAllProjectCards((prev) => !prev)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#5B5FEF]/50 text-[12px] font-extrabold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                          >
                            {showAllProjectCards ? (
                              <>
                                <ChevronUp className="w-4 h-4 text-[#5B5FEF] group-hover:-translate-y-0.5 transition-transform" />
                                <span>Show Less (2 Rows)</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 text-[#5B5FEF] group-hover:translate-y-0.5 transition-transform" />
                                <span>Show All Initiatives ({searchedProjects.length - 6} more)</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Existing Team Employee Profiles for non-super-admin */
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shadow-2xs shrink-0 text-[#5B5FEF]">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-[16px] sm:text-[17px] font-black text-slate-900 dark:text-white">
                        {t("dash_team_profiles_title", "Team Employee Profiles")}
                      </h3>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {t("dash_team_profiles_sub", "Workforce overview · task performance · department allocation")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Department Filter Pills */}
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      {[
                        { id: "all", label: t("dash_all", "All") },
                        { id: "Engineering", label: translateDept("Engineering") },
                        { id: "Operations", label: translateDept("Operations") },
                        { id: "Design", label: translateDept("Design") },
                        { id: "HR", label: translateDept("HR") },
                        { id: "Sales", label: translateDept("Sales") },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setTeamProfileFilter(f.id)}
                          className={`px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                            teamProfileFilter === f.id
                              ? "bg-white dark:bg-slate-700 text-[#5B5FEF] dark:text-indigo-300 shadow-2xs font-extrabold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <Link
                      href="/employees"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white text-[12.5px] font-bold shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{t("dash_full_directory", "Full Directory")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {filteredTeamEmployees.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-[13.5px] font-bold text-slate-600 dark:text-slate-300">{t("dash_no_team_members", "No team members found")}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">{t("dash_no_team_members_sub", "No profiles match this department filter.")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredTeamEmployees.slice(0, 8).map((emp: any) => {
                      const stats = getEmployeeTaskStats(emp._id || emp.id || "");
                      const firstName = emp.firstName || "";
                      const lastName = emp.lastName || "";
                      const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "TM";

                      const deptStyles: Record<string, { bar: string; avatar: string; badge: string; bg: string }> = {
                        Engineering:           { bar: "from-[#5B5FEF] to-[#818CF8]",   avatar: "from-[#5B5FEF] to-[#818CF8]",   badge: "text-[#5B5FEF] dark:text-indigo-300",  bg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900/40" },
                        Operations:            { bar: "from-amber-500 to-amber-400",     avatar: "from-amber-500 to-amber-400",     badge: "text-amber-700 dark:text-amber-300",   bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900/40" },
                        Design:                { bar: "from-sky-500 to-sky-400",         avatar: "from-sky-500 to-sky-400",         badge: "text-sky-700 dark:text-sky-300",       bg: "bg-sky-50 dark:bg-sky-950/60 border-sky-100 dark:border-sky-900/40" },
                        Marketing:             { bar: "from-purple-500 to-purple-400",   avatar: "from-purple-500 to-purple-400",   badge: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900/40" },
                        HR:                    { bar: "from-emerald-500 to-teal-400",    avatar: "from-emerald-500 to-teal-400",    badge: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/40" },
                        "Human Resources":     { bar: "from-emerald-500 to-teal-400",    avatar: "from-emerald-500 to-teal-400",    badge: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/40" },
                        "Sales & Business Dev": { bar: "from-rose-500 to-pink-400",     avatar: "from-rose-500 to-pink-400",       badge: "text-rose-700 dark:text-rose-300",     bg: "bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900/40" },
                      };
                      const dept = emp.department || "Engineering";
                      const s = deptStyles[dept] || deptStyles["Engineering"];

                      return (
                        <div
                          key={emp._id || emp.id}
                          className="relative overflow-hidden rounded-[22px] bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:shadow-xl hover:-translate-y-1 hover:border-[#5B5FEF]/50 dark:hover:border-[#5B5FEF]/40 transition-all duration-300 group flex flex-col"
                        >
                          <div className={`h-1.5 w-full bg-gradient-to-r ${s.bar}`} />

                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex items-start gap-3 mb-4">
                              <div
                                className={`w-12 h-12 rounded-[16px] bg-gradient-to-br ${s.avatar} text-white font-black text-[15px] flex items-center justify-center shadow-md shrink-0 overflow-hidden border-2 border-white dark:border-slate-800`}
                              >
                                {emp.avatarUrl ? (
                                  <img src={emp.avatarUrl} alt="" className="w-12 h-12 rounded-[14px] object-cover shrink-0" />
                                ) : initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13.5px] font-extrabold text-slate-900 dark:text-white truncate group-hover:text-[#5B5FEF] transition-colors leading-tight">
                                  {firstName} {lastName}
                                </p>
                                <p className="text-[10.5px] text-slate-400 font-mono font-bold tracking-wide mt-0.5">
                                  {emp.employeeId || "EMP-XXXX"}
                                </p>
                              </div>
                              <span
                                title={emp.isBlocked ? "Blocked" : "Active"}
                                className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
                                  emp.isBlocked ? "bg-rose-500" : "bg-emerald-500 animate-pulse"
                                }`}
                              />
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${s.bg} ${s.badge}`}>
                                {translateDept(dept)}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border bg-slate-100 dark:bg-slate-700/80 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 max-w-[140px] truncate">
                                {emp.role || "Employee"}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 mb-3">
                              <div className="p-2 rounded-xl bg-white dark:bg-slate-700/60 border border-slate-100 dark:border-slate-600/40 text-center shadow-2xs">
                                <p className="text-[15px] font-black text-slate-900 dark:text-white leading-none">{stats.total}</p>
                                <p className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">{t("dash_stat_tasks", "Tasks")}</p>
                              </div>
                              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-center shadow-2xs">
                                <p className="text-[15px] font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.completed}</p>
                                <p className="text-[8.5px] font-extrabold text-emerald-500 uppercase tracking-wider mt-0.5">{t("dash_stat_done", "Done")}</p>
                              </div>
                              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-center shadow-2xs">
                                <p className="text-[15px] font-black text-[#5B5FEF] dark:text-indigo-400 leading-none">{stats.rate}%</p>
                                <p className="text-[8.5px] font-extrabold text-[#5B5FEF] uppercase tracking-wider mt-0.5">{t("dash_stat_rate", "Rate")}</p>
                              </div>
                            </div>

                            <div className="w-full bg-slate-200/80 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-4">
                              <div
                                className={`h-full bg-gradient-to-r ${s.bar} rounded-full transition-all duration-700`}
                                style={{ width: `${Math.max(stats.rate, 4)}%` }}
                              />
                            </div>

                            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-2">
                              {emp.email ? (
                                <a
                                  href={`mailto:${emp.email}`}
                                  className="flex items-center gap-1.5 text-[10.5px] text-slate-400 hover:text-[#5B5FEF] font-medium truncate transition-colors cursor-pointer min-w-0"
                                  title={emp.email}
                                >
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{emp.email}</span>
                                </a>
                              ) : <span />}
                              <Link
                                href="/employees"
                                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#5B5FEF] transition-all"
                                title="View in directory"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= 3. LOWER SECTION: OPERATIONAL COMMAND CENTER (ACTIVITY & ENTERPRISE VELOCITY) ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-stretch pt-3">
              
              {/* LEFT COLUMN: LIVE RECENT ACTIVITY FEED & AUDIT TRAIL */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                
                {/* Live Recent Activity Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6.5 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all h-full">
                  <div>
                    {/* Top Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h3 className="text-[17px] sm:text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shadow-2xs">
                            <Activity className="w-5 h-5 text-[#5B5FEF]" />
                          </div>
                          {t("dash_recent_activity_title", "Recent Workspace Activity")}
                        </h3>
                        <p className="text-[12px] sm:text-[12.5px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                          {t("dash_recent_activity_sub", "Chronological real-time event log of tasks, state transitions, and team deliveries")}
                        </p>
                      </div>

                      <Link
                        href="/tasks"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold text-[#5B5FEF] bg-indigo-50/60 hover:bg-[#5B5FEF] hover:text-white dark:bg-indigo-950/40 dark:hover:bg-[#5B5FEF] dark:hover:text-white border border-indigo-100/80 dark:border-indigo-900/40 transition-all group shrink-0 self-start sm:self-auto shadow-2xs"
                      >
                        <span>{t("dash_all_deliverables", "All Deliverables")}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>

                    {/* Filter Segmented Control Bar */}
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-3 mb-3 border-b border-slate-100/80 dark:border-slate-800/80">
                      {[
                        { id: "all", label: t("dash_all_streams", "All Streams"), count: tasks.length },
                        { id: "in_progress", label: t("dash_in_processing", "01. In Processing"), count: inProgressTasks },
                        { id: "review", label: t("dash_in_review", "02. In Review"), count: inReviewTasks },
                        { id: "completed", label: t("dash_completed_stream", "03. Completed"), count: completedTasks },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActivityFilter(tab.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            activityFilter === tab.id
                              ? "bg-[#5B5FEF] text-white shadow-xs font-extrabold"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-black ${
                              activityFilter === tab.id
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Activity Feed List */}
                    <div className="space-y-2.5">
                      {recentActivities.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                            <Activity className="w-5 h-5" />
                          </div>
                          <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300">{t("dash_no_activity", "No activity recorded")}</p>
                          <p className="text-[11.5px] text-slate-400 mt-0.5">{t("dash_no_activity_sub", "No tasks match the selected activity filter.")}</p>
                        </div>
                      ) : (
                        recentActivities.map((act, index) => (
                          <div
                            key={act.id}
                            className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/90 border border-slate-100/90 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-xs transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                          >
                            {/* Left: Serial Index + Icon + Title + Assignee & Dept Metadata */}
                            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                              {/* Serial Number Badge */}
                              <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-mono font-black text-[10px] flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 shadow-2xs shrink-0">
                                #{String((activityPage - 1) * ACTIVITY_ITEMS_PER_PAGE + index + 1).padStart(2, "0")}
                              </span>

                              {/* Event State Icon */}
                              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border ${
                                act.status.key === "completed"
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/50"
                                  : act.status.key === "in_progress"
                                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-900/50"
                                  : act.status.key === "review"
                                  ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-900/50"
                                  : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/50"
                              }`}>
                                {act.status.key === "completed" ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : act.status.key === "in_progress" ? (
                                  <Clock className="w-4 h-4" />
                                ) : act.status.key === "review" ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <CheckSquare className="w-4 h-4" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-[13px] sm:text-[13.5px] font-extrabold text-slate-900 dark:text-white truncate group-hover:text-[#5B5FEF] transition-colors leading-snug"
                                  title={act.fullTitle}
                                >
                                  {act.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {/* Assignee Badge */}
                                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                    <div className="w-5 h-5 rounded-full bg-[#5B5FEF] text-white flex items-center justify-center font-bold text-[8.5px] shrink-0 overflow-hidden shadow-2xs">
                                      {act.assigneeAvatar ? (
                                        <img src={act.assigneeAvatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                                      ) : (
                                        act.assigneeInitials
                                      )}
                                    </div>
                                    <span className="truncate max-w-[120px]">{act.assigneeName}</span>
                                    {act.assigneeCount > 1 && (
                                      <span className="text-[9.5px] text-slate-400 font-bold">+{act.assigneeCount - 1}</span>
                                    )}
                                  </div>

                                  <span className="text-slate-300 dark:text-slate-700">•</span>

                                  {/* Department Chip */}
                                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                                    <Building2 className="w-2.5 h-2.5 text-[#5B5FEF]" />
                                    <span className="truncate max-w-[100px]">{translateDept(act.department)}</span>
                                  </span>

                                  <span className="text-slate-300 dark:text-slate-700">•</span>

                                  {/* Time Ago */}
                                  <span className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{act.time}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Status Pill + Priority Badge */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-12 sm:pl-0">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wide border shadow-2xs flex items-center gap-1.5 ${act.status.color}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${act.status.dot} animate-pulse`} />
                                <span>{act.status.label}</span>
                              </span>
                              <span
                                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-2xs ${act.priorityBadge}`}
                              >
                                {act.priority}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Serial Processing Status Report Banner (Fills Lower Space with Operational Telemetry) */}
                    <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/25 to-slate-50 dark:from-slate-800/60 dark:via-indigo-950/20 dark:to-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#5B5FEF] text-white flex items-center justify-center font-black text-[10px] shadow-2xs">
                            <Activity className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="text-[12.5px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                              {t("dash_pipeline_title", "Serial Status & Processing Pipeline Report")}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {t("dash_pipeline_sub", "Sequential workstream lifecycle from backlog queue to verified shipping")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 font-extrabold text-[10.5px] border border-indigo-200/80 dark:border-indigo-900/40 flex items-center gap-1.5 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5B5FEF] animate-pulse" />
                            {t("dash_live_telemetry", "Live Telemetry Log")}
                          </span>
                        </div>
                      </div>

                      {/* 4 Serial Pipeline Stages in Sequential Order */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {/* Stage 01: Queued Backlog */}
                        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700/60 hover:border-amber-300 dark:hover:border-amber-800 transition-all shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 tracking-wider">{t("dash_stage_01", "STAGE 01")}</span>
                            <span className="w-5 h-5 rounded-md bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
                              <Clock className="w-3 h-3 text-amber-500" />
                            </span>
                          </div>
                          <p className="text-[17px] font-black text-slate-900 dark:text-white mt-1.5 leading-none">{todoTasks}</p>
                          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 truncate">{t("dash_queued_backlog", "Queued Backlog")}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold">{totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0}%</span>
                          </div>
                        </div>

                        {/* Stage 02: In Processing */}
                        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-200/90 dark:border-indigo-900/60 ring-1 ring-[#5B5FEF]/10 hover:border-indigo-400 transition-all shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-black text-[#5B5FEF] dark:text-indigo-400 tracking-wider">{t("dash_stage_02", "STAGE 02")}</span>
                            <span className="w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center">
                              <Play className="w-3 h-3 text-[#5B5FEF] fill-current" />
                            </span>
                          </div>
                          <p className="text-[17px] font-black text-[#5B5FEF] dark:text-indigo-400 mt-1.5 leading-none">{inProgressTasks}</p>
                          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-300 truncate">{t("dash_in_proc", "In Processing")}</span>
                            <span className="text-[9.5px] text-[#5B5FEF] font-bold">{totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%</span>
                          </div>
                        </div>

                        {/* Stage 03: Quality Review */}
                        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700/60 hover:border-purple-300 dark:hover:border-purple-800 transition-all shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 tracking-wider">{t("dash_stage_03", "STAGE 03")}</span>
                            <span className="w-5 h-5 rounded-md bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center">
                              <Eye className="w-3 h-3 text-purple-500" />
                            </span>
                          </div>
                          <p className="text-[17px] font-black text-slate-900 dark:text-white mt-1.5 leading-none">{inReviewTasks}</p>
                          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 truncate">{t("dash_quality_review", "Quality Review")}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold">{totalTasks > 0 ? Math.round((inReviewTasks / totalTasks) * 100) : 0}%</span>
                          </div>
                        </div>

                        {/* Stage 04: Shipped & Delivered */}
                        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-black text-slate-400 dark:text-slate-500 tracking-wider">{t("dash_stage_04", "STAGE 04")}</span>
                            <span className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            </span>
                          </div>
                          <p className="text-[17px] font-black text-slate-900 dark:text-white mt-1.5 leading-none">{completedTasks}</p>
                          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate">{t("dash_shipped_done", "Shipped / Done")}</span>
                            <span className="text-[9.5px] text-slate-400 font-bold">{productivityPercent}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Serial Pipeline Continuity Line */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{t("dash_pipeline_progression", "Pipeline Progression:")}</span>
                          <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">{t("dash_step_queue", "01. Queue")}</span>
                          <span>→</span>
                          <span className="font-mono text-[10px] font-extrabold text-[#5B5FEF] dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded">{t("dash_step_processing", "02. Processing")}</span>
                          <span>→</span>
                          <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">{t("dash_step_review", "03. Review")}</span>
                          <span>→</span>
                          <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{t("dash_step_shipped", "04. Shipped")}</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-[11px] text-slate-600 dark:text-slate-300">
                          <span>{t("dash_total_tracked_deliverables", "Total Tracked Deliverables:")}</span>
                          <strong className="text-slate-900 dark:text-white font-black">{totalTasks}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Pagination Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                      <span>{t("dash_showing", "Showing")}</span>
                      <strong className="text-slate-800 dark:text-white font-extrabold">
                        {filteredTasksForActivity.length > 0
                          ? `${(activityPage - 1) * ACTIVITY_ITEMS_PER_PAGE + 1} - ${Math.min(
                              activityPage * ACTIVITY_ITEMS_PER_PAGE,
                              filteredTasksForActivity.length
                            )}`
                          : "0"}
                      </strong>
                      <span>{t("dash_of", "of")}</span>
                      <strong className="text-slate-800 dark:text-white font-extrabold">{filteredTasksForActivity.length}</strong>
                      <span>{t("dash_updates", "updates")}</span>
                    </div>

                    {totalActivityPages > 1 && (
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <span className="text-[11.5px] font-semibold text-slate-400 mr-1">
                          {t("dash_page", "Page")} {activityPage} {t("dash_of", "of")} {totalActivityPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActivityPage((prev) => Math.max(prev - 1, 1))}
                          disabled={activityPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActivityPage((prev) => Math.min(prev + 1, totalActivityPages))}
                          disabled={activityPage === totalActivityPages}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                          title="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: ENTERPRISE VELOCITY & EXECUTIVE SHORTCUTS */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 lg:gap-7">
                
                {/* 1. Sprint Velocity & Top Contributors */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center border border-amber-200/60 dark:border-amber-900/40 shadow-2xs">
                          <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                        </div>
                        <div>
                          <h3 className="text-[16px] font-black text-slate-900 dark:text-white">
                            {t("dash_enterprise_velocity_title", "Enterprise Velocity")}
                          </h3>
                          <p className="text-[11.5px] text-slate-400 font-medium">
                            {t("dash_enterprise_velocity_sub", "Sprint cadence & deliverable resolution")}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold border flex items-center gap-1.5 shadow-2xs ${
                        productivityPercent >= 60
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/40"
                          : "bg-indigo-50 dark:bg-indigo-950/40 text-[#5B5FEF] dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-900/40"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${productivityPercent >= 60 ? "bg-emerald-500" : "bg-[#5B5FEF]"}`} />
                        <span>{productivityPercent >= 60 ? t("dash_stage_on_track", "Stage: On Track") : t("dash_stage_in_proc", "Stage: In Processing")}</span>
                      </span>
                    </div>

                    {/* Executive Metric Cards (3 Mini-Tiles) */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[16px] font-black text-[#5B5FEF] dark:text-indigo-400 leading-none">
                          {productivityPercent}%
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">{t("dash_resolution", "Resolution")}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[16px] font-black text-emerald-600 dark:text-emerald-400 leading-none">
                          {completedTasks}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">{t("dash_stat_done", "Done")}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[16px] font-black text-amber-600 dark:text-amber-400 leading-none">
                          {inProgressTasks}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">{t("in_progress", "In-Flight")}</p>
                      </div>
                    </div>

                    {/* Org Milestone Resolution Progress Bar */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-4">
                      <div className="flex items-center justify-between text-[11.5px] mb-2 font-bold">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <span>{t("dash_org_milestone", "Org Milestone Resolution")}</span>
                        </span>
                        <span className="text-[#5B5FEF] dark:text-indigo-400 font-extrabold">{productivityPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#5B5FEF] via-[#7C3AED] to-[#10B981] rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(productivityPercent, 8)}%` }}
                        />
                      </div>
                    </div>

                    {/* Top Sprint Contributors Leaderboard */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-[11.5px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          {t("dash_top_sprint_contributors", "Top Sprint Contributors")}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold">{t("dash_ranked_by_completion", "Ranked by completion")}</span>
                      </div>

                      <div className="space-y-2">
                        {topContributors.length === 0 ? (
                          <p className="text-[12px] text-slate-400 py-3 text-center">{t("dash_no_active_contributors", "No active contributor records yet.")}</p>
                        ) : (
                          topContributors.map((c, idx) => {
                            const rankStyles = [
                              "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/80",
                              "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300/80",
                              "bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300/80",
                            ];
                            const rate = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;

                            return (
                              <div
                                key={idx}
                                className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-900/40 hover:bg-white dark:hover:bg-slate-800/80 transition-all"
                              >
                                <div className="flex items-center justify-between gap-2.5 mb-1.5">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {/* Rank badge */}
                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] border shadow-2xs shrink-0 ${rankStyles[idx] || rankStyles[2]}`}>
                                      #{idx + 1}
                                    </span>

                                    <div className="w-8 h-8 rounded-full bg-[#5B5FEF] text-white flex items-center justify-center font-black text-[9.5px] shrink-0 overflow-hidden shadow-2xs">
                                      {c.avatarUrl ? (
                                        <img src={c.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                      ) : (
                                        c.initials
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate leading-tight">{c.name}</p>
                                      <p className="text-[9.5px] text-slate-400 font-medium truncate">{translateDept(c.department)}</p>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 font-extrabold text-[10.5px] rounded-md border border-indigo-100/80 dark:border-indigo-900/40">
                                      {c.completed} / {c.total} {t("tasks", "tasks")}
                                    </span>
                                  </div>
                                </div>

                                {/* Mini Progress Bar per contributor */}
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                                  <div
                                    className="h-full bg-[#5B5FEF] rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(rate, 6)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Admin Command Shortcuts & Infrastructure Status */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shadow-2xs">
                          <ShieldCheck className="w-5 h-5 text-[#5B5FEF]" />
                        </div>
                        <div>
                          <h3 className="text-[16px] font-black text-slate-900 dark:text-white">
                            {t("dash_executive_shortcuts", "Executive Shortcuts")}
                          </h3>
                          <p className="text-[11.5px] text-slate-400 font-medium">
                            {t("dash_executive_shortcuts_sub", "Quick launch actions & infrastructure status")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2x2 Enterprise Action Cards */}
                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                      {/* 1. Create Task */}
                      <Link
                        href="/tasks"
                        className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-[#5B5FEF] hover:text-white text-slate-700 dark:text-slate-200 border border-indigo-100 dark:border-indigo-900/40 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between"
                      >
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 group-hover:bg-white/20 flex items-center justify-center text-[#5B5FEF] group-hover:text-white transition-colors mb-2 shadow-2xs">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[12px] font-extrabold leading-tight">{t("dash_create_task", "Create Task")}</p>
                          <p className="text-[10px] text-slate-400 group-hover:text-indigo-100 transition-colors">{t("dash_dispatch_to_sprint", "Dispatch to sprint")}</p>
                        </div>
                      </Link>

                      {/* 2. Team Directory */}
                      <Link
                        href="/employees"
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-[#5B5FEF] hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between"
                      >
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 group-hover:bg-white/20 flex items-center justify-center text-sky-500 group-hover:text-white transition-colors mb-2 shadow-2xs">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[12px] font-extrabold leading-tight">{t("dash_team_roster", "Team Roster")}</p>
                          <p className="text-[10px] text-slate-400 group-hover:text-indigo-100 transition-colors">{t("dash_manage_directory", "Manage directory")}</p>
                        </div>
                      </Link>

                      {/* 3. Deep Analytics */}
                      <Link
                        href="/analytics"
                        className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 hover:bg-[#5B5FEF] hover:text-white text-slate-700 dark:text-slate-200 border border-purple-100 dark:border-purple-900/40 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between"
                      >
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 group-hover:bg-white/20 flex items-center justify-center text-purple-500 group-hover:text-white transition-colors mb-2 shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[12px] font-extrabold leading-tight">{t("dash_deep_analytics", "Deep Analytics")}</p>
                          <p className="text-[10px] text-slate-400 group-hover:text-indigo-100 transition-colors">{t("dash_productivity_kpis", "Productivity KPIs")}</p>
                        </div>
                      </Link>

                      {/* 4. Audit Vault */}
                      <Link
                        href="/audit"
                        className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-[#5B5FEF] hover:text-white text-slate-700 dark:text-slate-200 border border-emerald-100 dark:border-emerald-900/40 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between"
                      >
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 group-hover:bg-white/20 flex items-center justify-center text-emerald-500 group-hover:text-white transition-colors mb-2 shadow-2xs">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-[12px] font-extrabold leading-tight">{t("dash_audit_vault", "Audit Vault")}</p>
                          <p className="text-[10px] text-slate-400 group-hover:text-indigo-100 transition-colors">{t("dash_security_logs", "Security & logs")}</p>
                        </div>
                      </Link>
                    </div>

                    {/* Live Cloud Infrastructure Telemetry Strip */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span className="text-[11.5px] font-extrabold text-slate-800 dark:text-slate-200">
                            {t("dash_cloud_operational", "Cloud Services Operational")}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-900/40">
                          99.98% SLA
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span>{t("dash_cluster_mongodb", "Cluster: MongoDB Atlas")}</span>
                        <span>•</span>
                        <span>Latency: 24ms</span>
                        <span>•</span>
                        <span>{t("dash_ssl_encrypted", "SSL Encrypted")}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* ================= 1. UPPER SECTION: 2 VISUAL PERFORMANCE CHARTS (DONUT & VELOCITY) ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Employee Chart 1: Workload Status & Priority Distribution (Bespoke Enterprise Split Dashboard) */}
              <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[440px]">
                {/* Header with Title & Interactive Mode Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-[16px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#5B5FEF]" />
                      {t("dash_workload_dist", "Workload Distribution")}
                    </h3>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {t("dash_workload_sub", "Real-time breakdown of assigned deliverables")}
                    </p>
                  </div>

                  {/* Toggle Pill: Status vs Priority */}
                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-extrabold shadow-2xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setEmployeeBreakdownMode("status")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        employeeBreakdownMode === "status"
                          ? "bg-[#5B5FEF] text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {t("dash_by_status", "By Status")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmployeeBreakdownMode("priority")}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        employeeBreakdownMode === "priority"
                          ? "bg-[#5B5FEF] text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {t("dash_by_priority", "By Priority")}
                    </button>
                  </div>
                </div>

                {/* Main Split Body: Donut Chart on Left + Detailed High-Density Progress Breakdown on Right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center my-3 flex-1">
                  {/* Left Column (5 cols): Modern High-Resolution Donut Chart */}
                  <div className="md:col-span-5 h-[230px] w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={employeeBreakdownMode === "status" ? employeeStatusDistribution : employeePriorityDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={66}
                          outerRadius={96}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="#ffffff"
                          strokeWidth={2.5}
                          isAnimationActive={true}
                          animationDuration={900}
                        >
                          {(employeeBreakdownMode === "status" ? employeeStatusDistribution : employeePriorityDistribution).map(
                            (entry: any, index: number) => {
                              const isHovered = activeEmployeeDonutIndex === index;
                              return (
                                <Cell
                                  key={`cell-emp-dist-${index}`}
                                  fill={entry.color}
                                  className="transition-all duration-200 cursor-pointer"
                                  style={{
                                    filter: isHovered
                                      ? "drop-shadow(0px 4px 10px rgba(0,0,0,0.35)) brightness(1.1)"
                                      : "drop-shadow(0px 1px 2px rgba(0,0,0,0.06))",
                                    transform: isHovered ? "scale(1.04)" : "scale(1)",
                                    transformOrigin: "center center",
                                  }}
                                  onMouseEnter={() => setActiveEmployeeDonutIndex(index)}
                                  onMouseLeave={() => setActiveEmployeeDonutIndex(null)}
                                />
                              );
                            }
                          )}
                        </Pie>
                        <Tooltip
                          formatter={(val: any, name: any) => [`${val} Deliverables`, name]}
                          contentStyle={{
                            backgroundColor: "#0F172A",
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "white",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Pillar */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[26px] font-black text-slate-900 dark:text-white leading-none tracking-tight">
                        {tasks.length}
                      </span>
                      <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                        {t("dash_total_tasks_label", "Total Tasks")}
                      </span>
                      <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40">
                        {productivityPercent}% {t("dash_shipped_label", "Shipped")}
                      </span>
                    </div>
                  </div>

                  {/* Right Column (7 cols): Enterprise Breakdown Checklist with Progress Bars */}
                  <div className="md:col-span-7 space-y-2.5">
                    {(employeeBreakdownMode === "status" ? employeeStatusDistribution : employeePriorityDistribution).map(
                      (item: any, idx: number) => {
                        return (
                          <Link
                            key={idx}
                            href={
                              employeeBreakdownMode === "status"
                                ? `/tasks?status=${item.key || "all"}`
                                : `/tasks?priority=${item.key || "all"}`
                            }
                            onMouseEnter={() => setActiveEmployeeDonutIndex(idx)}
                            onMouseLeave={() => setActiveEmployeeDonutIndex(null)}
                            className="group/row block p-2.5 rounded-xl bg-slate-50/70 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-100 hover:border-slate-200/90 dark:border-slate-800 dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-1.5 text-[12px]">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate group-hover/row:text-[#5B5FEF] transition-colors">
                                  {item.name}
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                                  {item.badge}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-black text-slate-900 dark:text-white">
                                  {item.value} <span className="text-[10.5px] font-medium text-slate-400">({item.percent}%)</span>
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-slate-200/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${Math.max(4, item.percent)}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                          </Link>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Footer Insight */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11.5px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5B5FEF] animate-pulse" />
                    <span>{t("in_flight_workload", "In-flight workload")}: {tasks.length - completedTasks} {t("dash_tasks_deliverables", "deliverables")}</span>
                  </span>
                  <Link
                    href="/tasks"
                    className="text-[#5B5FEF] hover:underline flex items-center gap-1 font-extrabold"
                  >
                    <span>{t("view_all_tasks", "View all tasks")}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Employee Chart 2: Weekly Delivery Velocity & Resolution Trend (Area & Line / Bar Modes) */}
              <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[440px]">
                {/* Header with Title, Mode Switcher & Real Delivery Rate */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-[16px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#5B5FEF]" />
                      {t("weekly_delivery_velocity", "Weekly Delivery Velocity")}
                    </h3>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {t("weekly_delivery_velocity_sub", "Sprint execution cadence & cumulative resolution momentum (Mon–Sun)")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {/* Mode Toggle: Area Trend vs Daily Bars */}
                    <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-extrabold shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setEmployeeChartMode("area")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          employeeChartMode === "area"
                            ? "bg-[#5B5FEF] text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                        title="Display as Smooth Continuous Area Velocity Curve"
                      >
                        <TrendingUp className="w-3 h-3" />
                        <span>{t("trend_wave", "Trend Wave")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmployeeChartMode("bar")}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          employeeChartMode === "bar"
                            ? "bg-[#5B5FEF] text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        }`}
                        title="Display as Daily Distribution Bars"
                      >
                        <BarChart3 className="w-3 h-3" />
                        <span>{t("daily_bars", "Daily Bars")}</span>
                      </button>
                    </div>

                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40 rounded-lg text-[11px] font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {productivityPercent}% {t("dash_shipped_label", "Shipped")}
                    </span>
                  </div>
                </div>

                {/* Top Mini KPI Stats Strip */}
                <div className="grid grid-cols-3 gap-2 my-2 py-2 px-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("total_workload", "Total Workload")}</p>
                    <p className="text-[14px] font-black text-slate-900 dark:text-white font-mono">{tasks.length} {t("tasks", "Tasks")}</p>
                  </div>
                  <div className="text-center border-x border-slate-200/60 dark:border-slate-700/60">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("inflight_momentum", "In-Flight Momentum")}</p>
                    <p className="text-[14px] font-black text-[#5B5FEF] dark:text-indigo-400 font-mono">{inProgressTasks + inReviewTasks} {t("active_status", "Active")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("sprint_resolved", "Sprint Resolved")}</p>
                    <p className="text-[14px] font-black text-emerald-600 dark:text-emerald-400 font-mono">{completedTasks} {t("dash_shipped_label", "Shipped")}</p>
                  </div>
                </div>

                {/* Chart Visualization Area */}
                <div className="h-[210px] w-full flex-1 my-1">
                  <ResponsiveContainer width="100%" height="100%">
                    {employeeChartMode === "area" ? (
                      <AreaChart data={weeklyActivityData} margin={{ top: 12, right: 12, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="empInFlightGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5B5FEF" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#5B5FEF" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="empCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 700 }}
                          dy={5}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0]?.payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold space-y-1">
                                  <p className="font-extrabold text-[12.5px] text-indigo-300">{d?.fullDay || label}</p>
                                  <div className="flex items-center justify-between gap-4 pt-1">
                                    <span className="text-slate-300">Active In-Flight:</span>
                                    <span className="font-mono font-black text-indigo-400">{d?.inFlight} deliverables</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-slate-300">Completed Shipped:</span>
                                    <span className="font-mono font-black text-emerald-400">{d?.cumulativeCompleted} deliverables</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-slate-300">Daily Inflow:</span>
                                    <span className="font-mono font-black text-amber-400">+{d?.created} tasks</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="inFlight"
                          name="Active In-Flight"
                          stroke="#5B5FEF"
                          strokeWidth={2.5}
                          fill="url(#empInFlightGrad)"
                          dot={{ r: 3.5, fill: "#5B5FEF", stroke: "#ffffff", strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: "#5B5FEF", stroke: "#ffffff", strokeWidth: 2 }}
                          isAnimationActive={true}
                          animationDuration={1000}
                        />
                        <Area
                          type="monotone"
                          dataKey="cumulativeCompleted"
                          name="Completed & Shipped"
                          stroke="#10B981"
                          strokeWidth={2.5}
                          fill="url(#empCompletedGrad)"
                          dot={{ r: 3.5, fill: "#10B981", stroke: "#ffffff", strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: "#10B981", stroke: "#ffffff", strokeWidth: 2 }}
                          isAnimationActive={true}
                          animationDuration={1000}
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={weeklyActivityData} margin={{ top: 12, right: 12, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 700 }}
                          dy={5}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 600 }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0F172A",
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "white",
                          }}
                        />
                        <Bar
                          dataKey="inFlight"
                          name="In-Flight Active"
                          fill="#5B5FEF"
                          radius={[5, 5, 0, 0]}
                          maxBarSize={22}
                        />
                        <Bar
                          dataKey="completed"
                          name="Daily Completed"
                          fill="#10B981"
                          radius={[5, 5, 0, 0]}
                          maxBarSize={22}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Footer Legend with Indicators */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11.5px] font-bold">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#5B5FEF] shadow-2xs" />
                      <span className="text-slate-600 dark:text-slate-300">{t("active_inflight_workload", "Active In-Flight Workload")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-2xs" />
                      <span className="text-slate-600 dark:text-slate-300">{t("delivered_and_shipped", "Delivered & Shipped")}</span>
                    </div>
                  </div>
                  <span className="text-slate-400 font-medium hidden sm:inline">
                    {t("sprint_cadence_week", "Sprint Cadence: Mon–Sun")}
                  </span>
                </div>
              </div>
            </div>

            {/* ================= 2. PRIORITY FOCUS ACTION HERO (Full Width) ================= */}
            {topFocusTask && (
              <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 rounded-[28px] p-5 sm:p-6 border border-indigo-100/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-[#5B5FEF] dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <Target className="w-5 h-5 text-[#5B5FEF]" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-950/80 text-[#5B5FEF] dark:text-indigo-300 font-mono text-[11px] font-black">
                        {topFocusTask.taskCode || "ACTIVE-TSK"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200/80 dark:border-rose-900/50 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-500" />
                        {t("priority_action", "Priority Action")}
                      </span>
                      {topFocusTask.dueDate && (
                        <span className="text-[11.5px] font-semibold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {t("due_label", "Due")} {new Date(topFocusTask.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[15px] sm:text-[16px] font-black text-slate-900 dark:text-white truncate">
                      {topFocusTask.title}
                    </h3>
                    {topFocusTask.description && (
                      <p className="text-[12.5px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                        {topFocusTask.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  {topFocusTask.status === "todo" && (
                    <button
                      onClick={() => handleQuickStatusChange(topFocusTask._id, "in_progress")}
                      disabled={updatingTaskId === topFocusTask._id}
                      className="px-4 py-2 rounded-xl bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white text-[12.5px] font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      {updatingTaskId === topFocusTask._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>{t("start_working", "Start Working")}</span>
                    </button>
                  )}

                  {topFocusTask.status === "in_progress" && (
                    <button
                      onClick={() => handleQuickStatusChange(topFocusTask._id, "completed")}
                      disabled={updatingTaskId === topFocusTask._id}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      {updatingTaskId === topFocusTask._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>{t("mark_complete", "Mark Complete")}</span>
                    </button>
                  )}

                  <Link
                    href={`/tasks?search=${encodeURIComponent(topFocusTask.title)}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[12.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>{t("board_view", "Board View")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* ================= 3. MASTER WORKSPACE GRID: DELIVERABLES & AUDIT (8 COLS) + SCHEDULE & TEAM (4 COLS) ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ================= LEFT COLUMN (8 COLS): DELIVERABLES & AUDIT LOG ================= */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. MY ASSIGNED DELIVERABLES BOARD */}
                <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-[17px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-[#5B5FEF]" />
                        {t("my_assigned_deliverables", "My Assigned Deliverables")}
                        <span className="text-[11.5px] font-extrabold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                          {employeeFilteredTasks.length}
                        </span>
                      </h3>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {t("my_assigned_sub", "Interactive sprint execution · 1-click status updates")}
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11.5px] font-bold">
                      {[
                        { id: "all", label: `${t("dash_all", "All")} (${tasks.length})` },
                        { id: "in_progress", label: `${t("in_progress", "In Progress")} (${inProgressTasks})` },
                        { id: "todo", label: `${t("pending", "To Do")} (${todoTasks})` },
                        { id: "completed", label: `${t("dash_shipped_label", "Shipped")} (${completedTasks})` },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            setEmployeeTaskFilter(f.id as any);
                            setEmployeeTaskPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                            employeeTaskFilter === f.id
                              ? "bg-[#5B5FEF] text-white shadow-xs font-black"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Task Items Grid */}
                  <div className="space-y-3">
                    {employeeFilteredTasks.length === 0 ? (
                      <div className="py-12 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                        <CircleDashed className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-[13.5px] font-bold text-slate-700 dark:text-slate-300">{t("no_deliverables_view", "No deliverables in this view")}</p>
                        <p className="text-[12px] text-slate-400 mt-0.5">{t("change_filter_pill", "Change filter pill to see other assigned deliverables.")}</p>
                      </div>
                    ) : (
                      paginatedEmployeeTasks.map((task) => {
                        const isUrgent = task.priority === "urgent" || task.priority === "high";
                        const isDone = task.status === "completed";

                        return (
                          <div
                            key={task._id}
                            className={`p-4 sm:p-5 rounded-[22px] border transition-all duration-200 flex flex-col gap-3 group ${
                              isDone
                                ? "bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800"
                                : isUrgent
                                ? "bg-rose-50/20 dark:bg-rose-950/10 border-rose-200/60 dark:border-rose-900/40 hover:shadow-md"
                                : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md"
                            }`}
                          >
                            {/* Card Top Row: Codes, Badges, Due Date, and Jump Link */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 shadow-2xs">
                                  {task.taskCode || "TSK"}
                                </span>
                                <span
                                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                    task.priority === "urgent"
                                      ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-200 dark:border-rose-900/50"
                                      : task.priority === "high"
                                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-200 dark:border-amber-900/50"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${task.priority === "urgent" ? "bg-rose-500" : task.priority === "high" ? "bg-amber-500" : "bg-slate-400"}`} />
                                  {task.priority}
                                </span>
                                {task.department && (
                                  <span className="text-[11px] font-bold text-slate-400">
                                    {translateDept(task.department)}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {task.dueDate && (
                                  <span className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {t("due_label", "Due")} {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                                <Link
                                  href={`/tasks?search=${encodeURIComponent(task.title)}`}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#5B5FEF] hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                  title="View on Kanban Board"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>

                            {/* Card Middle: Title & Description */}
                            <div className="space-y-0.5">
                              <h4
                                className={`text-[14.5px] sm:text-[15px] font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-[#5B5FEF] transition-colors ${
                                  isDone ? "line-through text-slate-400 dark:text-slate-500" : ""
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Card Bottom: Segmented Status Switcher */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-1 bg-white dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs w-full sm:w-auto">
                                {[
                                  { key: "todo", label: t("pending", "To Do"), bg: "bg-amber-500 text-white" },
                                  { key: "in_progress", label: t("in_progress", "In Progress"), bg: "bg-[#5B5FEF] text-white" },
                                  { key: "review", label: t("dash_step_review", "Review"), bg: "bg-purple-600 text-white" },
                                  { key: "completed", label: t("dash_stat_done", "Done"), bg: "bg-emerald-600 text-white" },
                                ].map((st) => {
                                  const active = task.status === st.key;
                                  return (
                                    <button
                                      key={st.key}
                                      onClick={() => handleQuickStatusChange(task._id, st.key as any)}
                                      disabled={updatingTaskId === task._id}
                                      className={`flex-1 sm:flex-none px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                                        active
                                          ? `${st.bg} shadow-xs scale-102`
                                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                      }`}
                                    >
                                      {updatingTaskId === task._id && active ? (
                                        <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                      ) : (
                                        st.label
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              <span className="text-[11px] font-bold text-slate-400">
                                {isDone ? t("shipped_and_recorded", "Shipped & Recorded") : t("click_status_update", "Click status to update")}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Deliverables Pagination & Show-More Footer */}
                  {employeeFilteredTasks.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] font-bold">
                      <div className="text-slate-500 dark:text-slate-400">
                        {t("dash_showing", "Showing")}{" "}
                        <span className="font-black text-slate-800 dark:text-white">
                          {showAllEmployeeTasks
                            ? `1–${employeeFilteredTasks.length}`
                            : `${(employeeTaskPage - 1) * EMP_TASKS_PER_PAGE + 1}–${Math.min(
                                employeeTaskPage * EMP_TASKS_PER_PAGE,
                                employeeFilteredTasks.length
                              )}`}
                        </span>{" "}
                        {t("dash_of", "of")}{" "}
                        <span className="font-black text-slate-800 dark:text-white">
                          {employeeFilteredTasks.length}
                        </span>{" "}
                        {t("dash_tasks_deliverables", "deliverables")}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Show All / Paginate Toggle */}
                        {employeeFilteredTasks.length > EMP_TASKS_PER_PAGE && (
                          <button
                            type="button"
                            onClick={() => setShowAllEmployeeTasks((prev) => !prev)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer text-[11.5px]"
                          >
                            {showAllEmployeeTasks ? t("show_paginated", "Show Paginated") : `${t("show_all_label", "Show All")} (${employeeFilteredTasks.length})`}
                          </button>
                        )}

                        {/* Page Buttons (when not showing all) */}
                        {!showAllEmployeeTasks && totalEmployeeTaskPages > 1 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEmployeeTaskPage((prev) => Math.max(prev - 1, 1))}
                              disabled={employeeTaskPage === 1}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                              title="Previous Page"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 font-mono font-black text-[11px]">
                              {employeeTaskPage} / {totalEmployeeTaskPages}
                            </span>
                            <button
                              onClick={() => setEmployeeTaskPage((prev) => Math.min(prev + 1, totalEmployeeTaskPages))}
                              disabled={employeeTaskPage === totalEmployeeTaskPages}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                              title="Next Page"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Direct Link to Kanban Board */}
                        <Link
                          href="/tasks"
                          className="px-3.5 py-1.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white text-[11.5px] font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ml-1"
                        >
                          <span>{t("full_board", "Full Board")}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. RECENT DELIVERABLE ACTIVITY & AUDIT TRAIL */}
                <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-4.5 h-4.5 text-[#5B5FEF]" />
                        {t("recent_deliv_audit", "Recent Deliverable Activity & Audit Trail")}
                      </h3>
                      <p className="text-[12px] text-slate-500 font-medium mt-0.5">{t("recent_deliv_sub", "Audit log of your recently modified sprint deliverables")}</p>
                    </div>
                    <Link href="/tasks" className="text-[12.5px] font-bold text-[#5B5FEF] hover:underline flex items-center gap-1 group">
                      <span>{t("dash_all_deliverables", "All Deliverables")}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentActivities.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 font-medium">{t("dash_no_activity", "No activity recorded yet.")}</div>
                    ) : (
                      recentActivities.map((act) => (
                        <div key={act.id} className="py-3 flex items-center justify-between gap-4 group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 group-hover:bg-[#5B5FEF] group-hover:text-white transition-colors">
                              <CheckSquare className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate group-hover:text-[#5B5FEF] transition-colors">
                                {act.title}
                              </p>
                              <p className="text-[11px] text-slate-400 font-medium">{act.time}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`min-w-[85px] text-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs ${act.status.color}`}
                            >
                              {act.status.label}
                            </span>
                            <span
                              className={`min-w-[65px] text-center px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider border shadow-2xs ${act.priorityBadge}`}
                            >
                              {act.priority}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {totalActivityPages > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-400">
                        <span>{t("dash_page", "Page")}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-[11px]">
                          {activityPage}
                        </span>
                        <span>{t("dash_of", "of")} {totalActivityPages}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setActivityPage((prev) => Math.max(prev - 1, 1))}
                          disabled={activityPage === 1}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActivityPage((prev) => Math.min(prev + 1, totalActivityPages))}
                          disabled={activityPage === totalActivityPages}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
                          title="Next Page"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* ================= RIGHT COLUMN (4 COLS): SCHEDULE, VELOCITY & TEAM ================= */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 1. PERSONAL SPRINT SCHEDULE & DEADLINES (COMPACT, RICH, ZERO VOID) */}
                <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 flex items-center justify-center shadow-2xs">
                        <Calendar className="w-4 h-4 text-[#5B5FEF]" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight">
                          {t("sprint_schedule", "Sprint Schedule")}
                        </h3>
                        <p className="text-[11.5px] text-slate-400 font-medium">{t("calendar_milestones", "Calendar & sprint milestones")}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleJumpToToday}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                    >
                      {t("today", "Today")}
                    </button>
                  </div>

                  {/* Month Navigator */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handlePrevMonth}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[13px] font-black text-slate-800 dark:text-white tracking-wide">
                      {currentMonthYear}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day-of-week headers */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <div>{t("day_mo", "Mo")}</div><div>{t("day_tu", "Tu")}</div><div>{t("day_we", "We")}</div><div>{t("day_th", "Th")}</div><div>{t("day_fr", "Fr")}</div><div>{t("day_sa", "Sa")}</div><div>{t("day_su", "Su")}</div>
                  </div>

                  {/* Day buttons grid */}
                  <div className="grid grid-cols-7 text-center gap-1">
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <div key={`emp-empty-${i}`} className="h-8" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateObj = new Date(year, month, dayNum);
                      const isToday =
                        new Date().getDate() === dayNum &&
                        new Date().getMonth() === month &&
                        new Date().getFullYear() === year;

                      const isSelected =
                        selectedDate.getDate() === dayNum &&
                        selectedDate.getMonth() === month &&
                        selectedDate.getFullYear() === year;

                      const dayTasks = getTasksForDate(dateObj);
                      const hasTasks = dayTasks.length > 0;
                      const hasUrgent = dayTasks.some((t) => t.priority === "urgent" || t.priority === "high");

                      return (
                        <div key={`emp-day-${dayNum}`} className="flex items-center justify-center">
                          <button
                            onClick={() => setSelectedDate(dateObj)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center relative transition-all cursor-pointer font-bold text-[11.5px] ${
                              isSelected
                                ? "bg-[#5B5FEF] text-white shadow-md shadow-[#5B5FEF]/30 font-black scale-105"
                                : isToday
                                ? "ring-2 ring-[#5B5FEF] text-[#5B5FEF] dark:text-indigo-400 font-black bg-indigo-50/50 dark:bg-indigo-950/30"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            {dayNum}
                            {hasTasks && (
                              <span
                                className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                                  isSelected ? "bg-white" : hasUrgent ? "bg-rose-500" : "bg-emerald-500"
                                }`}
                              />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Agenda & Upcoming Deadlines Section */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11.5px] font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#5B5FEF]" />
                        {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {selectedDate.toDateString() === new Date().toDateString() && (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] font-bold">
                            {t("today", "Today")}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-400">
                        {selectedDateTasks.length > 0 ? `${selectedDateTasks.length} ${t("scheduled_label", "Scheduled")}` : t("upcoming_milestones", "Upcoming Milestones")}
                      </span>
                    </div>

                    {selectedDateTasks.length > 0 ? (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                        {selectedDateTasks.map((tItem) => (
                          <div
                            key={tItem._id}
                            className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 group hover:border-[#5B5FEF]/40 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#5B5FEF] transition-colors">
                                {tItem.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[9.5px] font-black text-slate-400">
                                  {tItem.taskCode || "TSK"}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-1 rounded ${
                                  tItem.priority === "urgent" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400" :
                                  tItem.priority === "high" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" :
                                  "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                                }`}>
                                  {tItem.priority}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 shrink-0">
                              {tItem.status.replace("_", " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="p-2 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{t("no_deadlines_date", "No specific deadlines on this date")}</span>
                          <span className="text-[#5B5FEF] font-bold text-[10.5px]">{t("upcoming_label", "Upcoming:")}</span>
                        </div>
                        
                        {upcomingSprintDeadlines.slice(0, 3).map((upTask) => {
                          const relDeadline = getRelativeDeadline(upTask.dueDate);
                          const isUrgent = upTask.priority === "urgent" || upTask.priority === "high";

                          return (
                            <div
                              key={upTask._id}
                              className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 hover:border-slate-200 transition-colors"
                            >
                              <div className="min-w-0">
                                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {upTask.title}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                                  <span className="font-mono font-bold text-slate-400">{upTask.taskCode || "TSK"}</span>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className={`font-semibold ${
                                    relDeadline.includes("Overdue") ? "text-rose-600 font-bold" :
                                    relDeadline.includes("Today") ? "text-amber-600 font-bold" :
                                    "text-slate-500 dark:text-slate-400"
                                  }`}>
                                    {relDeadline}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0 border ${
                                isUrgent
                                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-200 dark:border-rose-900/40"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                              }`}>
                                {upTask.status.replace("_", " ")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. SPRINT DELIVERY VELOCITY */}
                <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-[14.5px] font-black text-slate-900 dark:text-white leading-tight">
                          {t("sprint_velocity", "Sprint Velocity")}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">{t("delivery_resolution_rate", "Delivery resolution rate")}</p>
                      </div>
                    </div>
                    <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60">
                      {productivityPercent}% {t("rate", "Rate")}
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                      <div
                        className="h-full bg-gradient-to-r from-[#5B5FEF] via-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(productivityPercent, 4)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{t("in_progress", "In Flight")}</p>
                        <p className="text-[14px] font-black text-[#5B5FEF] dark:text-indigo-400">{inProgressTasks}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{t("pending_backlog", "Backlog")}</p>
                        <p className="text-[14px] font-black text-amber-600 dark:text-amber-400">{todoTasks}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{t("dash_stat_done", "Shipped")}</p>
                        <p className="text-[14px] font-black text-emerald-600 dark:text-emerald-400">{completedTasks}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. DEPARTMENT TEAM & WORKSPACE ROSTER */}
                <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                        <Users className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-[14.5px] font-black text-slate-900 dark:text-white leading-tight">
                          {t("department_team", "Department Team")}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {user?.department ? translateDept(user.department) : t("dept_operations", "Operations")} {t("unit_label", "Unit")}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10.5px] font-extrabold border border-emerald-200/60 dark:border-emerald-900/60">
                      {(dashboardData?.deptColleagues || []).length + 1} {t("active_status", "Active")}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(dashboardData?.deptColleagues || []).length === 0 ? (
                      <div className="py-5 text-center bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-3">
                        <Building2 className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{t("leading_unit", "Leading")} {user?.department ? translateDept(user.department) : t("unit_label", "this unit")}</p>
                        <p className="text-[10.5px] text-slate-400 mt-0.5">{t("primary_contact", "Primary point of contact.")}</p>
                      </div>
                    ) : (
                      (dashboardData?.deptColleagues || []).slice(0, 4).map((col: any) => (
                        <div
                          key={col.id || col.email}
                          className="p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex items-center justify-between gap-2.5 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5B5FEF] to-[#7B7FFA] text-white flex items-center justify-center font-black text-[11px] shrink-0 overflow-hidden shadow-2xs">
                              {col.avatarUrl ? (
                                <img src={col.avatarUrl} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" />
                              ) : (
                                col.name?.slice(0, 2).toUpperCase() || "TM"
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-bold text-slate-900 dark:text-white truncate group-hover:text-[#5B5FEF] transition-colors">
                                {col.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                {col.role || "Team Member"}
                              </p>
                            </div>
                          </div>
                          {col.email && (
                            <a
                              href={`mailto:${col.email}`}
                              className="p-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-400 hover:text-[#5B5FEF] border border-slate-200 dark:border-slate-600 shadow-2xs transition-colors shrink-0 cursor-pointer"
                              title={`Email ${col.name}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400">{t("team_collaboration", "Team Collaboration")}</span>
                    <Link
                      href="/tasks"
                      className="text-[#5B5FEF] hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>{t("share_workload", "Share Workload")}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
        </ScrollReveal>
      </main>
      )}

      {/* ================= MODAL: PROJECT INITIATIVE DETAILS ================= */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-[28px] max-w-2xl w-full flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Accent Strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${
              selectedProject.department === "Engineering" ? "from-[#5B5FEF] to-[#818CF8]" :
              selectedProject.department === "Operations" ? "from-amber-500 to-amber-400" :
              selectedProject.department === "Design" ? "from-sky-500 to-sky-400" :
              selectedProject.department === "IT & Security" ? "from-emerald-500 to-teal-400" :
              selectedProject.department === "Sales" ? "from-rose-500 to-pink-400" : "from-purple-500 to-indigo-400"
            }`} />

            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    {selectedProject.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5FEF] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                    {translateDept(selectedProject.department)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {selectedProject.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase tracking-wide bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50">
                    {selectedProject.priority} Priority
                  </span>
                </div>
                <h2 className="text-[19px] sm:text-[21px] font-black text-slate-900 dark:text-white leading-tight">
                  {selectedProject.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* 4 Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">{t("work_done", "Work Done")}</span>
                  <p className="text-[16px] font-black text-[#5B5FEF] dark:text-indigo-400">{selectedProject.progress}%</p>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold">{selectedProject.completedTasks} / {selectedProject.totalTasks} {t("tasks", "Tasks")}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">{t("target_date", "Target Date")}</span>
                  <p className="text-[15px] font-black text-slate-800 dark:text-slate-200">{selectedProject.targetDate}</p>
                  <span className="text-[10.5px] text-emerald-600 font-bold">{t("on_schedule", "On Schedule")}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">{t("team_assigned", "Team Assigned")}</span>
                  <p className="text-[16px] font-black text-slate-800 dark:text-slate-200">{selectedProject.contributorsCount}</p>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold">{t("dash_personnel_handling", "Personnel Handling")}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">{t("budget_health", "Budget Health")}</span>
                  <p className="text-[15px] font-black text-emerald-600 dark:text-emerald-400">{selectedProject.budgetHealth || "Optimized"}</p>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-bold">99.9% Efficiency</span>
                </div>
              </div>

              {/* Progress Bar in Modal */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-[12px] font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{t("overall_deliv_progress", "Overall Deliverables Progress")}</span>
                  <span className="text-[#5B5FEF] dark:text-indigo-400 font-extrabold">{selectedProject.progress}% {t("completed", "Completed")}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5B5FEF] to-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(selectedProject.progress, 5)}%` }}
                  />
                </div>
              </div>

              {/* Appointed Project Manager */}
              <div>
                <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-500" /> {t("dash_appointed_manager", "Appointed Project Manager")}
                </h4>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#5B5FEF] text-white flex items-center justify-center font-black text-[13px] shrink-0 overflow-hidden shadow-xs">
                      {selectedProject.manager?.avatarUrl ? (
                        <img src={selectedProject.manager.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        selectedProject.manager?.initials || "PM"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-slate-900 dark:text-white truncate">
                        {selectedProject.manager?.name || "Appointed Manager"}
                      </p>
                      <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {selectedProject.manager?.role || t("dash_project_lead", "Project Lead")} · {selectedProject.manager?.email || "manager@empsphere.io"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const mgrId = selectedProject.manager?._id;
                      setSelectedProject(null);
                      handleOpenDispatch(mgrId, selectedProject.department);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4D51DB] text-white text-[11.5px] font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t("dash_dispatch_initiative", "Dispatch Task")}</span>
                  </button>
                </div>
              </div>

              {/* Personnel Handling */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#5B5FEF]" /> {t("dash_personnel_handling", "Personnel Handling")} ({selectedProject.contributorsCount})
                  </h4>
                  <span className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400">
                    {translateDept(selectedProject.department)} {t("badge_team", "Team")}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {selectedProject.departmentContributors?.length > 0 ? (
                    selectedProject.departmentContributors.map((c: any, i: number) => (
                      <div
                        key={c.id || i}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2.5"
                      >
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-[#5B5FEF] flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                          {c.avatarUrl ? (
                            <img src={c.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            c.initials || "TM"
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{c.role || "Team Contributor"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 py-4 text-center text-slate-400 text-[12px]">
                      {selectedProject.contributorsCount} team members assigned to {selectedProject.department}.
                    </div>
                  )}
                </div>
              </div>

              {/* Active Department Deliverables & Tasks */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-500" /> {t("active_pipeline", "Active Deliverables & Tasks")}
                  </h4>
                  <Link
                    href={`/tasks?department=${encodeURIComponent(selectedProject.department)}`}
                    className="text-[11.5px] font-bold text-[#5B5FEF] dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>{t("view_all_tasks", "View All Tasks")}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                {selectedProject.departmentTasks?.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedProject.departmentTasks.slice(0, 5).map((t: any) => (
                      <div
                        key={t._id || t.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {t.status === "completed" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <PlayCircle className="w-4 h-4 text-[#5B5FEF] shrink-0" />
                          )}
                          <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">
                            {t.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase ${
                            t.priority === "urgent" ? "bg-rose-50 text-rose-600 border border-rose-200" :
                            t.priority === "high" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {t.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                            t.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                            t.status === "in_progress" ? "bg-indigo-50 text-[#5B5FEF]" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {t.status || "pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                      {t("no_standalone_tasks", `No standalone tasks filed yet for ${selectedProject.department}. You can dispatch new tasks directly to the manager.`)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between gap-3">
              <Link
                href={`/tasks?department=${encodeURIComponent(selectedProject.department)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[12px] font-bold hover:border-[#5B5FEF] transition-all"
              >
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{t("tasks_workspace", "Open Tasks Workspace")}</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {t("cancel", "Close")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mgrId = selectedProject.manager?._id;
                    const dept = selectedProject.department;
                    setSelectedProject(null);
                    handleOpenDispatch(mgrId, dept);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B5FEF] hover:bg-[#4D51DB] text-white text-[12px] font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t("dash_dispatch_initiative", "Dispatch Action")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ================= MODAL: DISPATCH TASK/PROJECT TO MANAGER ================= */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-xl w-full flex flex-col shadow-2xl border border-purple-500/30 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50/60 via-indigo-50/30 to-transparent dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/30">
                  <Zap className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-[18px] font-black text-slate-900 dark:text-white">
                    {t("dispatch_modal_title", "Dispatch Deliverable to Manager")}
                  </h2>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                    {t("dispatch_modal_sub", "Super Admin Task & Strategic Project Assignment")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDispatchSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
              {/* Select Manager */}
              <div>
                <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("assign_to_manager", "Assign to Department Manager")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={dispatchManagerId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setDispatchManagerId(selectedId);
                    const mgr = managersList.find((m: any) => (m.id || m._id) === selectedId) ||
                                employees.find((emp: any) => (emp.id || emp._id) === selectedId);
                    if (mgr?.department) {
                      setDispatchDepartment(mgr.department);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none transition-colors cursor-pointer"
                >
                  <option value="" disabled>{t("select_mgr_contributor", "-- Select a Manager or Contributor --")}</option>
                  {managersList.length > 0 && (
                    <optgroup label={t("optgroup_managers", "👑 Appointed Department Managers")}>
                      {managersList.map((m: any) => (
                        <option key={m.id || m._id} value={m.id || m._id}>
                          {m.name} ({translateDept(m.department)} • {m.activeTasks} {t("active_tasks", "Active Tasks")})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label={t("optgroup_all_personnel", "👥 All Enterprise Personnel")}>
                    {employees.map((emp: any) => (
                      <option key={emp.id || emp._id} value={emp.id || emp._id}>
                        {emp.firstName} {emp.lastName} ({translateDept(emp.department)} • {emp.role})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Project / Task Title */}
              <div>
                <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("dispatch_title_label", "Project / Task Title")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dispatchTitle}
                  onChange={(e) => setDispatchTitle(e.target.value)}
                  placeholder={t("dispatch_title_placeholder", "e.g. Q4 Security Compliance Audit & Access Verification")}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none transition-colors"
                />
              </div>

              {/* Department & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("dept_division", "Department Division")}
                  </label>
                  <select
                    value={dispatchDepartment}
                    onChange={(e) => setDispatchDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none transition-colors cursor-pointer"
                  >
                    <option value="Engineering">{translateDept("Engineering")}</option>
                    <option value="Operations">{translateDept("Operations")}</option>
                    <option value="Design">{translateDept("Design")}</option>
                    <option value="Human Resources">{translateDept("Human Resources")}</option>
                    <option value="Product">{translateDept("Product")}</option>
                    <option value="Finance">{translateDept("Finance")}</option>
                    <option value="Marketing">{translateDept("Marketing")}</option>
                    <option value="Executive">{translateDept("Executive")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("priority_level", "Priority Level")}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "urgent", label: t("priority_urgent", "Urgent"), color: "bg-red-500 text-white" },
                      { id: "high", label: t("priority_high", "High"), color: "bg-amber-500 text-white" },
                      { id: "medium", label: t("priority_medium", "Medium"), color: "bg-indigo-600 text-white" },
                      { id: "low", label: t("priority_low", "Low"), color: "bg-slate-500 text-white" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setDispatchPriority(p.id as any)}
                        className={`py-2 rounded-xl text-[11px] font-black text-center transition-all cursor-pointer ${
                          dispatchPriority === p.id
                            ? `${p.color} shadow-xs scale-102`
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("target_completion_date", "Target Completion Date")}
                </label>
                <input
                  type="date"
                  value={dispatchDueDate}
                  onChange={(e) => setDispatchDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("deliverable_scope_specs", "Deliverable Scope & Specifications")}
                </label>
                <textarea
                  rows={3}
                  value={dispatchDescription}
                  onChange={(e) => setDispatchDescription(e.target.value)}
                  placeholder={t("deliverable_scope_placeholder", "Describe project objectives, key requirements, and deliverables expected from the manager...")}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none transition-colors resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[13px] font-bold transition-all cursor-pointer"
                >
                  {t("cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[13px] font-black flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDispatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("dispatching_deliverable", "Dispatching Deliverable...")}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>{t("dispatch_deliverable_btn", "Dispatch Deliverable")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: APPOINT / PROMOTE MANAGER ================= */}
      {isAppointModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-xl w-full flex flex-col shadow-2xl border border-purple-500/30 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50/60 via-indigo-50/30 to-transparent dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[18px] font-black text-slate-900 dark:text-white">
                    {t("appoint_modal_title", "Appoint / Promote Manager")}
                  </h2>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                    {t("appoint_modal_sub", "Super Admin Leadership & System Role Governance")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAppointModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAppointSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
              {/* Select Member */}
              <div>
                <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("select_member_appoint", "Select Member to Appoint / Promote")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={appointUserId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setAppointUserId(selectedId);
                    const target = employees.find((emp: any) => (emp.id || emp._id) === selectedId);
                    if (target) {
                      if (target.department) setAppointDepartment(target.department);
                      const isMgr = target.role && target.role.toLowerCase().includes("manager");
                      setAppointRoleTitle(isMgr ? target.role : `${target.department || "Engineering"} Manager`);
                      // Default to manager for leadership appointment
                      setAppointSystemRole("manager");
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-[#5B5FEF] outline-none transition-colors cursor-pointer"
                >
                  <option value="" disabled>{t("select_workspace_member", "-- Select a Workspace Member --")}</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id || emp._id} value={emp.id || emp._id}>
                      {emp.firstName} {emp.lastName} — {translateDept(emp.department)} ({emp.systemRole || emp.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* System Role Selection */}
              <div>
                <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("designated_privilege", "Designated System Privilege (RBAC)")} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "manager", label: t("role_manager_label", "Manager"), desc: t("role_manager_desc", "Team Lead & Task Assignee") },
                    { id: "employee", label: t("role_employee_label", "Employee"), desc: t("role_employee_desc", "Staff Contributor") },
                    { id: "admin", label: t("role_admin_label", "Admin"), desc: t("role_admin_desc", "Operations Controller") },
                    { id: "system_admin", label: t("role_sysadmin_label", "Sys Admin"), desc: t("role_sysadmin_desc", "Security & Auditing") },
                  ].map((sRole) => (
                    <button
                      key={sRole.id}
                      type="button"
                      onClick={() => {
                        setAppointSystemRole(sRole.id as any);
                        if (sRole.id === "manager" && appointRoleTitle.toLowerCase().includes("engineer")) {
                          setAppointRoleTitle("Engineering Manager");
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        appointSystemRole === sRole.id
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-500/50"
                      }`}
                    >
                      <p className="text-[12px] font-black leading-tight">{sRole.label}</p>
                      <p className={`text-[10px] mt-0.5 leading-tight ${appointSystemRole === sRole.id ? "text-purple-100" : "text-slate-400"}`}>
                        {sRole.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Department & Role Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("assigned_dept_label", "Assigned Department")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={appointDepartment}
                    onChange={(e) => setAppointDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none transition-colors cursor-pointer"
                  >
                    <option value="Engineering">{translateDept("Engineering")}</option>
                    <option value="Operations">{translateDept("Operations")}</option>
                    <option value="Design">{translateDept("Design")}</option>
                    <option value="Human Resources">{translateDept("Human Resources")}</option>
                    <option value="Product">{translateDept("Product")}</option>
                    <option value="Finance">{translateDept("Finance")}</option>
                    <option value="Marketing">{translateDept("Marketing")}</option>
                    <option value="Executive">{translateDept("Executive")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("designation_job_title", "Designation / Job Title")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={appointRoleTitle}
                    onChange={(e) => setAppointRoleTitle(e.target.value)}
                    placeholder={t("lead_engineering_manager_placeholder", "e.g. Lead Engineering Manager")}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:border-purple-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAppointModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[13px] font-bold transition-all cursor-pointer"
                >
                  {t("cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isAppointing}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-black flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isAppointing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t("saving_credentials", "Saving Leadership Credentials...")}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t("confirm_appointment", "Confirm Appointment")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
