"use client";

import { useState, useEffect, useMemo } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() => import("./AnalyticsCharts"), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[340px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800" />
        <div className="h-[340px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[340px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800" />
        <div className="h-[340px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800" />
      </div>
    </div>
  ),
});

import {
  Users,
  TrendingUp,
  Briefcase,
  Clock,
  CheckCircle2,
  Layers,
  Activity,
  Calendar,
  ChevronDown,
  Check,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { AnalyticsSkeleton } from "@/components/ui/Skeleton";

// Initial fallbacks for charts
const defaultMonthlyGrowth = [
  { month: "Jan", users: 4, active: 3, completed: 3 },
  { month: "Feb", users: 8, active: 6, completed: 6 },
  { month: "Mar", users: 12, active: 10, completed: 10 },
  { month: "Apr", users: 15, active: 12, completed: 12 },
  { month: "May", users: 18, active: 15, completed: 15 },
  { month: "Jun", users: 22, active: 19, completed: 19 },
];

const defaultStatusBreakdown = [
  { name: "Completed", value: 4, color: "#10B981" },
  { name: "In Progress", value: 2, color: "#38BDF8" },
  { name: "In Review", value: 1, color: "#8B5CF6" },
  { name: "Pending", value: 2, color: "#F59E0B" },
];

const defaultPriorityDistribution = [
  { priority: "Urgent", count: 2, color: "#EF4444" },
  { priority: "High", count: 3, color: "#F97316" },
  { priority: "Medium", count: 4, color: "#3B82F6" },
  { priority: "Low", count: 1, color: "#64748B" },
];

const defaultWeeklyStats = [
  { day: "Mon", expected: 4, actual: 3 },
  { day: "Tue", expected: 5, actual: 4 },
  { day: "Wed", expected: 6, actual: 5 },
  { day: "Thu", expected: 5, actual: 4 },
  { day: "Fri", expected: 4, actual: 4 },
  { day: "Sat", expected: 2, actual: 2 },
  { day: "Sun", expected: 1, actual: 1 },
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  // 4 Top Filter Dropdown States
  const [timeRange, setTimeRange] = useState<"all" | "7d" | "30d" | "90d" | "ytd">("30d");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"overview" | "velocity" | "workload" | "efficiency">("overview");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [kpis, setKpis] = useState({
    totalUsers: "0",
    totalTasks: "0",
    productivity: "0%",
    completedTasks: "0",
    activeHours: "0 Active",
  });

  const [growthData, setGrowthData] = useState<any[]>(defaultMonthlyGrowth);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>(defaultStatusBreakdown);
  const [priorityData, setPriorityData] = useState<any[]>(defaultPriorityDistribution);
  const [taskData, setTaskData] = useState<any[]>(defaultWeeklyStats);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [demographicsData, setDemographicsData] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [deptColleaguesList, setDeptColleaguesList] = useState<any[]>([]);

  // Dismiss dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-analytics-dropdown]")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);

      const [analyticsRes, tasksRes] = await Promise.all([
        api.get("/users/analytics", { params: { _t: Date.now().toString() } }),
        api.get("/tasks", { params: { _t: Date.now().toString() } }).catch(() => ({ data: { data: { tasks: [] } } })),
        new Promise((r) => setTimeout(r, isManualRefresh ? 600 : 0)),
      ]);

      if (analyticsRes.data?.data) {
        const {
          isAdmin,
          kpis,
          monthlyGrowth,
          taskStatusBreakdown,
          priorityDistribution,
          departmentDistribution,
          taskCompletionStats,
          userDemographics,
        } = analyticsRes.data.data;

        const isPrivileged =
          !!isAdmin ||
          user?.systemRole === "super_admin" ||
          user?.systemRole === "system_admin" ||
          user?.systemRole === "admin" ||
          user?.role === "admin" ||
          user?.role === "Super Administrator";

        setIsAdminView(isPrivileged);
        if (kpis) setKpis(kpis);
        if (monthlyGrowth && monthlyGrowth.length > 0) setGrowthData(monthlyGrowth);
        if (taskStatusBreakdown && taskStatusBreakdown.length > 0)
          setStatusBreakdown(taskStatusBreakdown);
        if (priorityDistribution && priorityDistribution.length > 0)
          setPriorityData(priorityDistribution);
        if (departmentDistribution && departmentDistribution.length > 0)
          setDeptData(departmentDistribution);
        if (taskCompletionStats && taskCompletionStats.length > 0)
          setTaskData(taskCompletionStats);
        if (userDemographics && userDemographics.length > 0)
          setDemographicsData(userDemographics);
        if (analyticsRes.data.data.deptColleagues) {
          setDeptColleaguesList(analyticsRes.data.data.deptColleagues);
        }
      }

      if (tasksRes.data?.data?.tasks) {
        setTasksList(tasksRes.data.data.tasks);
      }

      if (isManualRefresh) {
        toast.success("Analytics & metrics synchronized live!");
      }
    } catch (err) {
      console.error("Failed to load analytics metrics:", err);
      if (isManualRefresh) toast.error("Failed to refresh analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Distinct department names for dropdown
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    deptData.forEach((d) => d.name && set.add(d.name));
    tasksList.forEach((t) => t.department && set.add(t.department));
    ["Engineering", "Operations", "Design", "Sales & Marketing", "HR"].forEach((d) => set.add(d));
    return Array.from(set);
  }, [deptData, tasksList]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (timeRange !== "30d") count++;
    if (departmentFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (viewMode !== "overview") count++;
    return count;
  }, [timeRange, departmentFilter, priorityFilter, viewMode]);

  const handleResetFilters = () => {
    setTimeRange("30d");
    setDepartmentFilter("all");
    setPriorityFilter("all");
    setViewMode("overview");
  };

  // Dynamically compute filtered metrics according to selected dropdowns
  const computedData = useMemo(() => {
    let filteredTasks = [...tasksList];

    if (departmentFilter !== "all") {
      filteredTasks = filteredTasks.filter(
        (t) => (t.department || "").toLowerCase() === departmentFilter.toLowerCase(),
      );
    }

    if (priorityFilter !== "all") {
      filteredTasks = filteredTasks.filter(
        (t) => (t.priority || "").toLowerCase() === priorityFilter.toLowerCase(),
      );
    }

    const now = new Date();
    if (timeRange === "7d") {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTasks = filteredTasks.filter((t) => new Date(t.createdAt || now) >= cutoff);
    } else if (timeRange === "30d") {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredTasks = filteredTasks.filter((t) => new Date(t.createdAt || now) >= cutoff);
    } else if (timeRange === "90d") {
      const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filteredTasks = filteredTasks.filter((t) => new Date(t.createdAt || now) >= cutoff);
    } else if (timeRange === "ytd") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filteredTasks = filteredTasks.filter((t) => new Date(t.createdAt || now) >= startOfYear);
    }

    if (tasksList.length > 0) {
      const total = filteredTasks.length;
      const completed = filteredTasks.filter((t) => t.status === "completed").length;
      const inProgress = filteredTasks.filter((t) => t.status === "in_progress").length;
      const review = filteredTasks.filter((t) => t.status === "review").length;
      const todo = filteredTasks.filter((t) => t.status === "todo").length;
      const productivityVal = total > 0 ? `${Math.round((completed / total) * 100)}%` : "0%";

      const dynamicKpis = {
        totalUsers: kpis.totalUsers,
        totalTasks: String(total),
        productivity: productivityVal,
        completedTasks: String(completed),
        activeHours: `${inProgress + review} Active`,
      };

      const dynamicStatus = [
        { name: "Completed", value: completed, color: "#10B981" },
        { name: "In Progress", value: inProgress, color: "#38BDF8" },
        { name: "In Review", value: review, color: "#8B5CF6" },
        { name: "Pending", value: todo, color: "#F59E0B" },
      ];

      const urgentCount = filteredTasks.filter((t) => t.priority === "urgent").length;
      const highCount = filteredTasks.filter((t) => t.priority === "high").length;
      const mediumCount = filteredTasks.filter((t) => t.priority === "medium").length;
      const lowCount = filteredTasks.filter((t) => t.priority === "low").length;

      const dynamicPriority = [
        { priority: "Urgent", count: urgentCount, color: "#EF4444" },
        { priority: "High", count: highCount, color: "#F97316" },
        { priority: "Medium", count: mediumCount, color: "#3B82F6" },
        { priority: "Low", count: lowCount, color: "#64748B" },
      ];

      return {
        kpis: dynamicKpis,
        statusBreakdown: dynamicStatus,
        priorityData: dynamicPriority,
        growthData,
        taskData,
        deptData:
          departmentFilter !== "all"
            ? deptData.map((d) =>
                d.name?.toLowerCase() === departmentFilter.toLowerCase()
                  ? { ...d, value: 100 }
                  : { ...d, value: 0 },
              )
            : deptData,
      };
    }

    return {
      kpis,
      statusBreakdown,
      priorityData,
      growthData,
      taskData,
      deptData,
    };
  }, [
    tasksList,
    departmentFilter,
    priorityFilter,
    timeRange,
    kpis,
    statusBreakdown,
    priorityData,
    growthData,
    taskData,
    deptData,
  ]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md text-[12.5px] font-bold space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <p className="text-slate-400 font-extrabold uppercase text-[11px] tracking-wider mb-1 border-b border-slate-800 pb-1">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="text-slate-300 font-medium">{entry.name}:</span>
              <span className="text-white font-extrabold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-transparent pb-28 lg:pb-32 transition-colors duration-300">
      <Topbar
        title={t("analytics_title", "Performance & Analytics")}
        subtitle={
          isAdminView
            ? t("analytics_admin_sub", "Comprehensive enterprise performance, headcount growth, and task analytics.")
            : t("analytics_user_sub", "Detailed breakdown of your task velocity, delivery stats, and productivity trends.")
        }
        icon={<Activity className="w-5 h-5 text-[#5B5FEF]" />}
      />

      {loading ? (
        <main className="px-5 sm:px-7 lg:px-8 max-w-[1600px] mx-auto mt-7 space-y-6">
          <AnalyticsSkeleton />
        </main>
      ) : (
        <main className={`px-5 sm:px-7 lg:px-8 max-w-[1600px] mx-auto mt-7 animate-in fade-in duration-500 space-y-6 transition-opacity duration-300 ${refreshing ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
          {/* =========================================================================
              ANALYTICS TOP CONTROL BAR: 4 SMART DROPDOWN FILTERS & REFRESH
             ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: 4 Smart Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Dropdown 1: Time Period */}
              <div className="relative" data-analytics-dropdown>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "time" ? null : "time")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-bold border transition-all cursor-pointer shadow-2xs ${
                    timeRange !== "30d"
                      ? "bg-[#5B5FEF]/10 border-[#5B5FEF]/40 text-[#5B5FEF] dark:text-indigo-400 font-extrabold"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-[#5B5FEF]" />
                  <span>
                    {timeRange === "all"
                      ? "All Time"
                      : timeRange === "7d"
                      ? "Last 7 Days"
                      : timeRange === "30d"
                      ? "Last 30 Days"
                      : timeRange === "90d"
                      ? "Last 90 Days"
                      : "Year to Date"}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeDropdown === "time" ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === "time" && (
                  <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 text-left">
                    <div className="px-3 py-1.5 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      Time Period
                    </div>
                    {[
                      { id: "all", label: "All Time (Historical)" },
                      { id: "7d", label: "Last 7 Days (Sprint)" },
                      { id: "30d", label: "Last 30 Days (Monthly)" },
                      { id: "90d", label: "Last 90 Days (Quarterly)" },
                      { id: "ytd", label: "Year to Date (2026)" },
                    ].map((tOpt) => (
                      <button
                        key={tOpt.id}
                        type="button"
                        onClick={() => {
                          setTimeRange(tOpt.id as any);
                          setActiveDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-[12px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          timeRange === tOpt.id
                            ? "bg-[#5B5FEF]/10 text-[#5B5FEF] dark:text-indigo-400 font-extrabold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{tOpt.label}</span>
                        {timeRange === tOpt.id && <Check className="w-3.5 h-3.5 text-[#5B5FEF]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown 2: Department */}
              <div className="relative" data-analytics-dropdown>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "dept" ? null : "dept")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-bold border transition-all cursor-pointer shadow-2xs ${
                    departmentFilter !== "all"
                      ? "bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-extrabold"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                  <span className="truncate max-w-[130px]">
                    {departmentFilter === "all" ? "All Departments" : departmentFilter}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeDropdown === "dept" ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === "dept" && (
                  <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 text-left max-h-72 overflow-y-auto custom-scrollbar">
                    <div className="px-3 py-1.5 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      Filter Department
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDepartmentFilter("all");
                        setActiveDropdown(null);
                      }}
                      className={`w-full px-3 py-2 text-[12px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        departmentFilter === "all"
                          ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 font-extrabold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>All Departments</span>
                      {departmentFilter === "all" && <Check className="w-3.5 h-3.5 text-sky-500" />}
                    </button>
                    {availableDepartments.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setDepartmentFilter(dept);
                          setActiveDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-[12px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          departmentFilter === dept
                            ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 font-extrabold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{dept}</span>
                        {departmentFilter === dept && <Check className="w-3.5 h-3.5 text-sky-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown 3: Priority Severity */}
              <div className="relative" data-analytics-dropdown>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "priority" ? null : "priority")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-bold border transition-all cursor-pointer shadow-2xs ${
                    priorityFilter !== "all"
                      ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-extrabold"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span className="capitalize">
                    {priorityFilter === "all" ? "All Priorities" : `${priorityFilter} Priority`}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeDropdown === "priority" ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === "priority" && (
                  <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 text-left">
                    <div className="px-3 py-1.5 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      Priority Severity
                    </div>
                    {[
                      { id: "all", label: "All Priorities" },
                      { id: "urgent", label: "🚨 Urgent Severity" },
                      { id: "high", label: "🔥 High Priority" },
                      { id: "medium", label: "⚡ Medium Priority" },
                      { id: "low", label: "📌 Low Priority" },
                    ].map((pOpt) => (
                      <button
                        key={pOpt.id}
                        type="button"
                        onClick={() => {
                          setPriorityFilter(pOpt.id);
                          setActiveDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-[12px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          priorityFilter === pOpt.id
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-extrabold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{pOpt.label}</span>
                        {priorityFilter === pOpt.id && <Check className="w-3.5 h-3.5 text-amber-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dropdown 4: Focus View Mode */}
              <div className="relative" data-analytics-dropdown>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === "view" ? null : "view")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] font-bold border transition-all cursor-pointer shadow-2xs ${
                    viewMode !== "overview"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {viewMode === "overview"
                      ? "Executive Overview"
                      : viewMode === "velocity"
                      ? "Delivery Velocity"
                      : viewMode === "workload"
                      ? "Workload Capacity"
                      : "Completion Efficiency"}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${activeDropdown === "view" ? "rotate-180" : ""}`} />
                </button>
                {activeDropdown === "view" && (
                  <div className="absolute right-0 sm:left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 text-left">
                    <div className="px-3 py-1.5 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      Analytics View Mode
                    </div>
                    {[
                      { id: "overview", label: "📊 Executive Overview" },
                      { id: "velocity", label: "🚀 Delivery Velocity" },
                      { id: "workload", label: "📋 Workload Capacity" },
                      { id: "efficiency", label: "⚡ Completion Efficiency" },
                    ].map((vOpt) => (
                      <button
                        key={vOpt.id}
                        type="button"
                        onClick={() => {
                          setViewMode(vOpt.id as any);
                          setActiveDropdown(null);
                        }}
                        className={`w-full px-3 py-2 text-[12px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          viewMode === vOpt.id
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{vOpt.label}</span>
                        {viewMode === vOpt.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Quick Reset + Live Sync Refresh */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Active Filter Count / Reset Button */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-[12px] font-bold transition-all cursor-pointer shadow-2xs"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ({activeFiltersCount})</span>
                </button>
              )}

              {/* Refresh Live Analytics */}
              <button
                type="button"
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[12px] font-bold transition-all shadow-2xs cursor-pointer"
                title="Refresh live analytics data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#5B5FEF] ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Sync Live</span>
              </button>
            </div>
          </div>

          {/* Top 4 KPI Metrics - Clean, Modern & Minimalist Design */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[
              {
                title: isAdminView ? t("total_ent_users", "Total Enterprise Users") : "Department Colleagues",
                value: computedData.kpis.totalUsers,
                subtitle: isAdminView ? t("verified_members", "Verified Team Members") : `In ${user?.department || "Your Team"}`,
                icon: Users,
                iconColor: "text-indigo-600 dark:text-indigo-400",
                iconBg: "bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50",
                trendBadge: "Active",
                trendBadgeColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40",
              },
              {
                title: t("prod_velocity", "Productivity Velocity"),
                value: computedData.kpis.productivity,
                subtitle: t("task_comp_rate", "Task Completion Rate"),
                icon: TrendingUp,
                iconColor: "text-emerald-600 dark:text-emerald-400",
                iconBg: "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50",
                trendBadge: "Efficiency",
                trendBadgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40",
              },
              {
                title: t("completed_tasks_title", "Completed Tasks"),
                value: computedData.kpis.completedTasks,
                subtitle: t("completed_milestones", "Delivered Milestones"),
                icon: CheckCircle2,
                iconColor: "text-sky-600 dark:text-sky-400",
                iconBg: "bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/50",
                trendBadge: "Finished",
                trendBadgeColor: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40",
              },
              {
                title: t("in_prog_review", "In Progress & Review"),
                value: typeof computedData.kpis.activeHours === "string" ? computedData.kpis.activeHours.replace(/[^\d]/g, "") || computedData.kpis.activeHours : computedData.kpis.activeHours,
                subtitle: t("active_pipeline", "Current Active Pipeline"),
                icon: Clock,
                iconColor: "text-amber-600 dark:text-amber-400",
                iconBg: "bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/50",
                trendBadge: "In Progress",
                trendBadgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40",
              },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border transition-all duration-200 flex flex-col justify-between ${
                    viewMode === "efficiency"
                      ? "border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-md"
                      : "border-slate-200/90 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {/* Top: Title & Clean Icon Container */}
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] sm:text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate mr-1">
                      {kpi.title}
                    </p>
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.iconBg}`}>
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${kpi.iconColor}`} />
                    </div>
                  </div>

                  {/* Middle: Large Stat Number & Trend Badge */}
                  <div className="mt-2.5 sm:mt-3 flex items-baseline gap-2">
                    <h3 className="text-[22px] sm:text-[30px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
                      {kpi.value}
                    </h3>
                    <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md ${kpi.trendBadgeColor}`}>
                      {kpi.trendBadge}
                    </span>
                  </div>

                  {/* Bottom: Subtitle */}
                  <p className="text-[11px] sm:text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2 truncate">
                    {kpi.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Dynamically Loaded Charts Section */}
          <AnalyticsCharts
            computedData={computedData}
            isAdminView={isAdminView}
            viewMode={viewMode}
            t={t}
            user={user}
            demographicsData={demographicsData}
            deptColleaguesList={deptColleaguesList}
          />
        </main>
      )}
    </div>
  );
}
