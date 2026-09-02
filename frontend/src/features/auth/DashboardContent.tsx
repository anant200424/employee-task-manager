"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Bell,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  TrendingUp,
  Activity,
  ArrowRight,
  CheckSquare,
  Sparkles,
  UserCheck,
  Building2,
  Users,
  Zap,
  Award,
  ShieldCheck,
  Plus,
  FileText,
} from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { Task } from "@/types/auth";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";

const getStoredTasks = (): Task[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("nexus_cached_tasks");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const DashboardContent = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";
  const [tasks, setTasks] = useState<Task[]>(getStoredTasks);
  const [loading, setLoading] = useState<boolean>(() => getStoredTasks().length === 0);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Interactive Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const loadData = async (isBackground = false) => {
    if (!isBackground && tasks.length === 0) {
      setLoading(true);
    }
    try {
      const [dashRes, tasksRes, analyticsRes] = await Promise.allSettled([
        api.get("/users/dashboard"),
        api.get("/tasks"),
        api.get("/users/analytics"),
      ]);

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
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(tasks.length > 0);
  }, []);

  // Real-time Metrics Calculation from Live Tasks
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const inReviewTasks = tasks.filter((t) => t.status === "review").length;
  const pendingTasks = tasks.filter((t) => t.status === "todo" || t.status === "review").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  
  // Real Overdue Calculation
  const overdueTasks = tasks.filter((t) => {
    if (t.status === "completed" || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    const now = new Date();
    return due < now;
  }).length;

  const productivityPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Real Donut Chart Data (Status Breakdown)
  const taskStatusDistribution = useMemo(() => {
    const todo = tasks.filter((t) => t.status === "todo").length;
    const inProg = inProgressTasks;
    const rev = inReviewTasks;
    const comp = completedTasks;

    if (totalTasks === 0) {
      return [
        { name: t("status_todo"), value: 25, count: 0, color: "#F59E0B" },
        { name: t("status_in_progress"), value: 25, count: 0, color: "#38BDF8" },
        { name: t("status_review"), value: 25, count: 0, color: "#8B5CF6" },
        { name: t("status_done"), value: 25, count: 0, color: "#10B981" },
      ];
    }

    return [
      { name: t("status_done"), value: Math.round((comp / totalTasks) * 100), count: comp, color: "#10B981" },
      { name: t("status_in_progress"), value: Math.round((inProg / totalTasks) * 100), count: inProg, color: "#38BDF8" },
      { name: t("status_review"), value: Math.round((rev / totalTasks) * 100), count: rev, color: "#8B5CF6" },
      { name: t("status_todo"), value: Math.round((todo / totalTasks) * 100), count: todo, color: "#F59E0B" },
    ];
  }, [tasks, totalTasks, inProgressTasks, inReviewTasks, completedTasks, t]);

  // Real Weekly Activity Data
  const weeklyActivityData = useMemo(() => {
    const days = [t("days_mo"), t("days_tu"), t("days_we"), t("days_th"), t("days_fr"), t("days_sa"), t("days_su")];
    const counts = days.map((day) => ({ day, created: 0, completed: 0 }));

    tasks.forEach((t) => {
      const createdDate = new Date(t.createdAt);
      const dayIndex = (createdDate.getDay() + 6) % 7; // Monday = 0
      if (dayIndex >= 0 && dayIndex < 7) {
        counts[dayIndex].created += 1;
      }
      if (t.status === "completed") {
        const updatedDate = new Date(t.updatedAt || t.createdAt);
        const compDayIndex = (updatedDate.getDay() + 6) % 7;
        if (compDayIndex >= 0 && compDayIndex < 7) {
          counts[compDayIndex].completed += 1;
        }
      }
    });

    return counts;
  }, [tasks, t]);

  // Department Helper
  const getDeptTranslation = (name: string) => {
    const map: Record<string, string> = {
      "Operations": t("dept_operations"),
      "Engineering": t("dept_engineering"),
      "Sales & Business Dev": t("dept_sales"),
      "Sales": t("dept_sales"),
      "Design": t("dept_design"),
      "Human Resources": t("dept_hr"),
      "HR": t("dept_hr"),
      "Executive Leadership": t("dept_leadership"),
    };
    return map[name] || name;
  };

  // Department Performance & Task Execution Matrix
  const departmentPerformance = useMemo(() => {
    const defaultDepts = ["Engineering", "Operations", "Design", "Marketing", "HR"];
    const deptMap: Record<string, { total: number; completed: number; inProgress: number; pending: number }> = {
      Engineering: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      Operations: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      Design: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      Marketing: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      HR: { total: 0, completed: 0, inProgress: 0, pending: 0 },
    };

    tasks.forEach((t) => {
      const dept = t.department || "Engineering";
      if (!deptMap[dept]) {
        deptMap[dept] = { total: 0, completed: 0, inProgress: 0, pending: 0 };
      }
      deptMap[dept].total += 1;
      if (t.status === "completed") deptMap[dept].completed += 1;
      else if (t.status === "in_progress") deptMap[dept].inProgress += 1;
      else deptMap[dept].pending += 1;
    });

    const colors: Record<string, { bg: string; text: string; bar: string }> = {
      Engineering: { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-[#5B5FEF]", bar: "bg-[#5B5FEF]" },
      Operations: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600", bar: "bg-amber-500" },
      Design: { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-600", bar: "bg-sky-500" },
      Marketing: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-600", bar: "bg-purple-500" },
      HR: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600", bar: "bg-emerald-500" },
    };

    return Object.entries(deptMap)
      .filter(([name, stats]) => stats.total > 0 || defaultDepts.slice(0, 3).includes(name))
      .map(([name, stats]) => {
        const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        const color = colors[name] || { bg: "bg-slate-50 dark:bg-slate-800", text: "text-slate-600", bar: "bg-[#5B5FEF]" };
        return {
          name,
          ...stats,
          rate,
          color,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [tasks]);

  // Calendar Calculation Helpers
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
    return tasks.filter((t) => {
      if (t.dueDate) {
        const dueStr = new Date(t.dueDate).toISOString().split("T")[0];
        if (dueStr === dateStr) return true;
      }
      const createdStr = new Date(t.createdAt).toISOString().split("T")[0];
      return createdStr === dateStr;
    });
  };

  const selectedDateTasks = useMemo(() => {
    return getTasksForDate(selectedDate);
  }, [selectedDate, tasks]);

  // Pagination State for Day Schedule
  const [schedulePage, setSchedulePage] = useState(1);
  const SCHEDULE_ITEMS_PER_PAGE = 5;

  // Reset page when selected date changes
  useEffect(() => {
    setSchedulePage(1);
  }, [selectedDate]);

  const totalSchedulePages = Math.ceil(selectedDateTasks.length / SCHEDULE_ITEMS_PER_PAGE) || 1;
  const paginatedScheduleTasks = useMemo(() => {
    const start = (schedulePage - 1) * SCHEDULE_ITEMS_PER_PAGE;
    return selectedDateTasks.slice(start, start + SCHEDULE_ITEMS_PER_PAGE);
  }, [selectedDateTasks, schedulePage]);

  // Pagination State for Recent Activity
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITY_ITEMS_PER_PAGE = 5;
  const totalActivityPages = Math.ceil(tasks.length / ACTIVITY_ITEMS_PER_PAGE) || 1;

  // Real Recent Activity Stream
  const recentActivities = useMemo(() => {
    const sorted = [...tasks].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );

    const start = (activityPage - 1) * ACTIVITY_ITEMS_PER_PAGE;
    const paginated = sorted.slice(start, start + ACTIVITY_ITEMS_PER_PAGE);

    return paginated.map((actItem) => {
      const isCompleted = actItem.status === "completed";
      const isInProgress = actItem.status === "in_progress";
      const isReview = actItem.status === "review";

      let statusBadge = { label: t("status_todo"), color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/40" };
      if (isCompleted) statusBadge = { label: t("status_done"), color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/40" };
      else if (isInProgress) statusBadge = { label: t("status_in_progress"), color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/80 dark:border-blue-900/40" };
      else if (isReview) statusBadge = { label: t("status_review"), color: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/80 dark:border-purple-900/40" };

      let priorityBadgeClass = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/50";
      if (actItem.priority === "urgent") priorityBadgeClass = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/40";
      else if (actItem.priority === "high") priorityBadgeClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/40";
      else if (actItem.priority === "medium") priorityBadgeClass = "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/80 dark:border-sky-900/40";

      const diffMs = Date.now() - new Date(actItem.updatedAt || actItem.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      let timeStr = "Just now";
      if (diffMins >= 60 * 24) timeStr = `${Math.floor(diffMins / (60 * 24))}d ago`;
      else if (diffMins >= 60) timeStr = `${Math.floor(diffMins / 60)}h ago`;
      else if (diffMins > 0) timeStr = `${diffMins}m ago`;

      return {
        id: actItem._id,
        title: actItem.title,
        status: statusBadge,
        time: timeStr,
        priority: actItem.priority,
        priorityBadge: priorityBadgeClass,
      };
    });
  }, [tasks, activityPage, t]);

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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-transparent transition-colors duration-300">
      <Topbar
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening across your workspace today."
      />

      {loading ? (
        <main className="flex-1 px-4 lg:px-8 py-6 space-y-6 max-w-[1600px] mx-auto w-full">
          <DashboardSkeleton />
        </main>
      ) : (
        <main className="flex-1 px-4 lg:px-8 py-6 space-y-6 max-w-[1600px] mx-auto w-full animate-in fade-in duration-300">
        
        {/* ================= HERO BANNER ================= */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40 rounded-lg text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#5B5FEF]" /> {t("admin_overview")}
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40 rounded-lg text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> {t("workspace_overview")}
                </span>
              )}
            </div>
            <h2 className="text-[22px] sm:text-[25px] font-black tracking-tight leading-tight text-slate-900 dark:text-white">
              {t("good_day")}, {user?.firstName || (isAdmin ? "Admin" : "Team Member")} {user?.lastName || ""} 👋
            </h2>
            <p className="text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {isAdmin ? (
                <>
                  You currently have <strong className="text-slate-900 dark:text-white font-bold">{totalTasks} {t("total_tasks").toLowerCase()}</strong> across your enterprise teams and departments.
                </>
              ) : (
                <>
                  You currently have <strong className="text-slate-900 dark:text-white font-bold">{totalTasks} assigned {t("tasks_label")}</strong> in your workspace queue.
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/tasks"
              className="bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white px-4 py-2.5 rounded-xl text-[13.5px] font-bold shadow-xs transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isAdmin ? t("manage_tasks") : t("view_my_tasks")}</span>
            </Link>
          </div>
        </div>

        {/* ================= KPI METRICS GRID (ALL 6 CLICKABLE TICKETS) ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            {
              label: t("total_tasks"),
              value: totalTasks,
              href: "/tasks?status=all",
              hoverBorder: "hover:border-[#5B5FEF]/60 dark:hover:border-[#5B5FEF]/60",
              topBar: "bg-[#5B5FEF]",
              hint: t("all_statuses"),
            },
            {
              label: t("pending"),
              value: pendingTasks,
              href: "/tasks?status=todo",
              hoverBorder: "hover:border-amber-500/60 dark:hover:border-amber-500/60",
              topBar: "bg-[#F59E0B]",
              hint: t("status_todo"),
            },
            {
              label: t("in_progress"),
              value: inProgressTasks,
              href: "/tasks?status=in_progress",
              hoverBorder: "hover:border-sky-500/60 dark:hover:border-sky-500/60",
              topBar: "bg-[#38BDF8]",
              hint: t("status_in_progress"),
            },
            {
              label: t("completed"),
              value: completedTasks,
              href: "/tasks?status=completed",
              hoverBorder: "hover:border-emerald-500/60 dark:hover:border-emerald-500/60",
              topBar: "bg-[#10B981]",
              hint: t("status_done"),
            },
            {
              label: t("overdue"),
              value: overdueTasks,
              href: "/tasks?status=overdue",
              hoverBorder: "hover:border-red-500/60 dark:hover:border-red-500/60",
              topBar: "bg-[#EF4444]",
              hint: t("status_overdue"),
            },
            {
              label: t("completion_rate"),
              value: `${productivityPercent}%`,
              href: "/analytics",
              hoverBorder: "hover:border-purple-500/60 dark:hover:border-purple-500/60",
              topBar: "bg-[#8B5CF6]",
              hint: t("analytics"),
            },
          ].map((stat, idx) => (
            <Link
              key={idx}
              href={stat.href}
              className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-[22px] p-5 shadow-sm border border-slate-200/70 dark:border-slate-800 ${stat.hoverBorder} hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group flex flex-col justify-between card-shimmer hover-shimmer`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${stat.topBar} transition-all duration-200 group-hover:h-2`} />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5B5FEF] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
                </div>
                <h3 className="text-[28px] xl:text-[32px] font-black text-slate-900 dark:text-white leading-none tracking-tight">
                  {stat.value}
                </h3>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-[#5B5FEF] transition-colors">
                <span>{stat.hint}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* ================= MAIN DASHBOARD BODY (2 COLUMNS) ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN: CHARTS & VELOCITY ================= */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            {/* Top Charts Row: Donut + Weekly Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Real Status Breakdown Donut Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/70 dark:border-slate-800 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">{t("task_distribution")}</h3>
                    <p className="text-[12px] text-slate-500 font-medium">{t("realtime_breakdown")}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold">
                    {totalTasks} {t("tasks_label")}
                  </span>
                </div>

                <div className="h-[210px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {taskStatusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [`${item.payload.count} ${t("tasks_label")} (${val}%)`, name]}
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "white"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[20px] font-black text-slate-900 dark:text-white">{productivityPercent}%</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("status_done")}</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {taskStatusDistribution.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">{item.name}</p>
                        <p className="text-[13px] font-black text-slate-900 dark:text-white">{item.count} <span className="text-[11px] font-medium text-slate-400">({item.value}%)</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Weekly Task Velocity Bar Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/70 dark:border-slate-800 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">{t("weekly_activity")}</h3>
                    <p className="text-[12px] text-slate-500 font-medium">{t("weekly_subtitle")}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#5B5FEF]" /> {t("live_badge")}
                  </span>
                </div>

                <div className="h-[210px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivityData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" opacity={0.5} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "white"
                        }}
                      />
                      <Bar dataKey="created" name={t("created_label")} fill="#5B5FEF" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name={t("completed_label")} fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#5B5FEF]" />
                    <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{t("created_label")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300">{t("completed_label")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Execution & Workload Matrix */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/70 dark:border-slate-800 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div>
                  <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4.5 h-4.5 text-[#5B5FEF]" />
                    {t("dept_workload")}
                  </h3>
                  <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                    {t("dept_subtitle")}
                  </p>
                </div>
                <Link
                  href="/employees"
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-xl text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
                >
                  <Users className="w-3.5 h-3.5 text-[#5B5FEF]" /> {t("team_directory")}
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departmentPerformance.map((dept, idx) => (
                  <Link
                    key={idx}
                    href={`/tasks?search=${encodeURIComponent(dept.name)}`}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-[#5B5FEF]/40 dark:hover:border-[#5B5FEF]/40 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${dept.color.bar}`} />
                          <h4 className="text-[14px] font-extrabold text-slate-900 dark:text-white group-hover:text-[#5B5FEF] transition-colors">
                            {getDeptTranslation(dept.name)}
                          </h4>
                        </div>
                        <span className="text-[11.5px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                          {dept.rate}% {t("status_done")}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 text-center text-[12px] font-semibold border-y border-slate-100 dark:border-slate-700/50 my-2">
                        <div>
                          <p className="text-slate-400 text-[10.5px] font-bold uppercase tracking-wider">{t("total_label")}</p>
                          <p className="text-slate-800 dark:text-slate-200 font-extrabold text-[13px] mt-0.5">{dept.total}</p>
                        </div>
                        <div>
                          <p className="text-sky-500 text-[10.5px] font-bold uppercase tracking-wider">{t("active_label")}</p>
                          <p className="text-sky-600 dark:text-sky-400 font-extrabold text-[13px] mt-0.5">{dept.inProgress}</p>
                        </div>
                        <div>
                          <p className="text-emerald-500 text-[10.5px] font-bold uppercase tracking-wider">{t("completed_label")}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[13px] mt-0.5">{dept.completed}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="w-full bg-slate-200/80 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${dept.color.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(dept.rate, 6)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 dark:text-slate-500 font-bold">
                        <span>{dept.pending} {t("pending_backlog")}</span>
                        <span className="text-[#5B5FEF] opacity-0 group-hover:opacity-100 transition-opacity">{t("view_tasks_arrow")}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Live Recent Activity Feed */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">{t("recent_activity")}</h3>
                    <p className="text-[12px] text-slate-500 font-medium">{t("recent_subtitle")}</p>
                  </div>
                  <Link href="/tasks" className="text-[13px] font-bold text-[#5B5FEF] hover:underline flex items-center gap-1.5 group">
                    <span>{t("view_all_tasks")}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentActivities.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 font-medium">{t("no_recent_activities")}</div>
                  ) : (
                    recentActivities.map((act) => (
                      <div key={act.id} className="py-3 flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 group-hover:bg-[#5B5FEF] group-hover:text-white transition-colors">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate group-hover:text-[#5B5FEF] transition-colors">
                              {act.title}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">{act.time}</p>
                          </div>
                        </div>

                        {/* Right: Perfectly Aligned Fixed-Width Status & Priority Badges */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`min-w-[96px] text-center px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wide border shadow-2xs ${act.status.color}`}
                          >
                            {act.status.label}
                          </span>
                          <span
                            className={`min-w-[70px] text-center px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-2xs ${act.priorityBadge}`}
                          >
                            {t(`priority_${act.priority}`)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity Pagination Controls */}
              {totalActivityPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                    <span>{t("page")}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-[11px]">
                      {activityPage}
                    </span>
                    <span>{t("of")} {totalActivityPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActivityPage((prev) => Math.max(prev - 1, 1))}
                      disabled={activityPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title={t("previous")}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActivityPage((prev) => Math.min(prev + 1, totalActivityPages))}
                      disabled={activityPage === totalActivityPages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title={t("next")}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ================= RIGHT COLUMN: INTERACTIVE CALENDAR & DAY HISTORY ================= */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            
            {/* 1. Real Interactive Calendar Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">{t("workspace_calendar")}</h3>
                <span className="text-[11px] font-bold text-[#5B5FEF] bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 px-2.5 py-1 rounded-lg">
                  {t("interactive")}
                </span>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between text-[14px] font-black text-slate-800 dark:text-slate-200 mb-4 px-1">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>{currentMonthYear}</span>
                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 text-center text-[11px] font-extrabold text-slate-400 uppercase mb-2">
                <div>{t("days_mo")}</div>
                <div>{t("days_tu")}</div>
                <div>{t("days_we")}</div>
                <div>{t("days_th")}</div>
                <div>{t("days_fr")}</div>
                <div>{t("days_sa")}</div>
                <div>{t("days_su")}</div>
              </div>

              {/* Calendar Days Matrix */}
              <div className="grid grid-cols-7 text-center text-[12px] font-bold gap-y-2">
                {/* Empty offset slots */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9" />
                ))}

                {/* Month Days */}
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

                  return (
                    <div key={`day-${dayNum}`} className="flex flex-col items-center justify-center">
                      <button
                        onClick={() => setSelectedDate(dateObj)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center relative transition-all cursor-pointer font-bold ${
                          isSelected
                            ? "bg-[#5B5FEF] text-white shadow-md shadow-[#5B5FEF]/30 scale-105"
                            : isToday
                            ? "border-2 border-[#5B5FEF] text-[#5B5FEF] dark:text-[#818CF8]"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {dayNum}
                        {hasTasks && !isSelected && (
                          <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Selected Day Task History & Details (Paginated at 5 tasks) */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                      {t("day_schedule")}
                    </h3>
                    <p className="text-[12px] text-slate-500 font-medium">
                      {selectedDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {selectedDateTasks.length} {selectedDateTasks.length === 1 ? t("task_singular") : t("tasks_plural")}
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedDateTasks.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-[13px] text-slate-400 font-medium">{t("no_tasks_date")}</p>
                    </div>
                  ) : (
                    paginatedScheduleTasks.map((tItem) => (
                      <div
                        key={tItem._id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 hover:border-[#5B5FEF]/30 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B5FEF] dark:text-[#818CF8]">
                            {t(`priority_${tItem.priority}`)} {t("col_priority")}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {t(`status_${tItem.status}`)}
                          </span>
                        </div>
                        <h4 className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{tItem.title}</h4>
                        {tItem.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{tItem.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Schedule Pagination Controls (Max 5 per page) */}
              {totalSchedulePages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[12px] font-bold text-slate-500">
                    {t("page")} {schedulePage} {t("of")} {totalSchedulePages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSchedulePage((prev) => Math.max(prev - 1, 1))}
                      disabled={schedulePage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSchedulePage((prev) => Math.min(prev + 1, totalSchedulePages))}
                      disabled={schedulePage === totalSchedulePages}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Urgent Reminders Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-red-500" /> {t("high_priority_attention")}
                </h3>
              </div>

              <div className="space-y-3">
                {tasks
                  .filter((tItem) => tItem.priority === "urgent" || tItem.priority === "high")
                  .slice(0, 3)
                  .map((task) => (
                    <div
                      key={task._id}
                      className="p-3.5 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : t("no_due_date")}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 shrink-0">
                        {t(`priority_${task.priority}`)}
                      </span>
                    </div>
                  ))}

                {tasks.filter((tItem) => tItem.priority === "urgent" || tItem.priority === "high").length === 0 && (
                  <div className="py-4 text-center text-[12px] text-slate-400 font-medium">
                    {t("no_urgent_tasks")}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Sprint Velocity & Milestone Progress Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> {t("sprint_goals")}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t("velocity_on_track")}
                  </span>
                </div>

                {/* Milestone Progress Bar */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-4">
                  <div className="flex items-center justify-between text-[12px] mb-2 font-bold">
                    <span className="text-slate-600 dark:text-slate-300">{t("monthly_milestone")}</span>
                    <span className="text-[#5B5FEF] font-black">{productivityPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#5B5FEF] to-[#10B981] rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(productivityPercent, 8)}%` }}
                    />
                  </div>
                </div>

                {/* Top Contributors Leaderboard */}
                <div>
                  <h4 className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#5B5FEF]" /> {t("top_contributors")}
                  </h4>
                  <div className="space-y-2">
                    {topContributors.length === 0 ? (
                      <div className="text-[12px] text-slate-400 font-medium py-2 text-center">
                        Active contributors will appear as tasks are assigned.
                      </div>
                    ) : (
                      topContributors.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 hover:border-[#5B5FEF]/30 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-[#0052CC] text-white flex items-center justify-center font-black text-[10px] shrink-0 overflow-hidden shadow-2xs">
                              {c.avatarUrl ? (
                                <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                c.initials
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{c.department}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-[#5B5FEF] dark:text-indigo-300 font-extrabold text-[11px] rounded-md shrink-0">
                            {c.completed} / {c.total} {t("tasks_label")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Quick Shortcuts & System Health Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#5B5FEF]" /> {t("quick_shortcuts")}
                </h3>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <Link
                  href="/tasks"
                  className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-[#5B5FEF] hover:text-white text-slate-700 dark:text-slate-200 border border-indigo-100/80 dark:border-indigo-900/40 text-[12px] font-bold flex items-center gap-2 transition-all cursor-pointer group"
                >
                  <Plus className="w-3.5 h-3.5 text-[#5B5FEF] group-hover:text-white transition-colors" />
                  <span className="truncate">{t("create_task")}</span>
                </Link>
                <Link
                  href="/employees"
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-[#5B5FEF] hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 text-[12px] font-bold flex items-center gap-2 transition-all cursor-pointer group"
                >
                  <Users className="w-3.5 h-3.5 text-[#5B5FEF] group-hover:text-white transition-colors" />
                  <span className="truncate">{t("invite_member")}</span>
                </Link>
                <Link
                  href="/analytics"
                  className="p-3 rounded-xl col-span-2 bg-slate-50 dark:bg-slate-800 hover:bg-[#5B5FEF] hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 text-[12px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <FileText className="w-3.5 h-3.5 text-[#5B5FEF] group-hover:text-white transition-colors" />
                  <span>{t("export_report")}</span>
                </Link>
              </div>

              {/* Platform SLA Health Card */}
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[12px] font-extrabold text-emerald-800 dark:text-emerald-300">
                    {t("system_operational")}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {t("system_uptime")}
                </span>
              </div>
            </div>

          </div>

        </div>

      </main>
      )}
    </div>
  );
};
