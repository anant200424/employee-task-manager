"use client";

import { useState, useEffect, useMemo } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { api } from "@/lib/api";
import {
  Line,
  BarChart,
  Bar,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  Briefcase,
  Clock,
  Loader2,
  CheckCircle2,
  ListTodo,
  Layers,
  PieChart as PieChartIcon,
  Activity,
  Calendar,
  Sparkles,
} from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);

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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/analytics");
      if (res.data?.data) {
        const {
          isAdmin,
          kpis,
          monthlyGrowth,
          taskStatusBreakdown,
          priorityDistribution,
          departmentDistribution,
          taskCompletionStats,
          userDemographics,
        } = res.data.data;

        setIsAdminView(!!isAdmin);
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
      }
    } catch (err) {
      console.error("Failed to load analytics metrics:", err);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen bg-transparent pb-14 transition-colors duration-300">
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
        <main className="px-5 sm:px-7 lg:px-8 max-w-[1600px] mx-auto mt-7 animate-in fade-in duration-500 space-y-6">
          {/* Top 4 KPI Metrics - Clean, Modern & Minimalist Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                title: isAdminView ? t("total_ent_users", "Total Enterprise Users") : t("my_assigned_tasks", "My Assigned Tasks"),
                value: isAdminView ? kpis.totalUsers : kpis.totalTasks,
                subtitle: isAdminView ? t("verified_members", "Verified Team Members") : t("total_workload_items", "Total Workload Items"),
                icon: isAdminView ? Users : ListTodo,
                iconColor: "text-indigo-600 dark:text-indigo-400",
                iconBg: "bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50",
                trendBadge: "Active",
                trendBadgeColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40",
              },
              {
                title: t("prod_velocity", "Productivity Velocity"),
                value: kpis.productivity,
                subtitle: t("task_comp_rate", "Task Completion Rate"),
                icon: TrendingUp,
                iconColor: "text-emerald-600 dark:text-emerald-400",
                iconBg: "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50",
                trendBadge: "Efficiency",
                trendBadgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40",
              },
              {
                title: t("completed_tasks_title", "Completed Tasks"),
                value: kpis.completedTasks,
                subtitle: t("completed_milestones", "Delivered Milestones"),
                icon: CheckCircle2,
                iconColor: "text-sky-600 dark:text-sky-400",
                iconBg: "bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900/50",
                trendBadge: "Finished",
                trendBadgeColor: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40",
              },
              {
                title: t("in_prog_review", "In Progress & Review"),
                value: typeof kpis.activeHours === "string" ? kpis.activeHours.replace(/[^\d]/g, "") || kpis.activeHours : kpis.activeHours,
                subtitle: t("active_pipeline", "Current Active Pipeline"),
                icon: Clock,
                iconColor: "text-amber-600 dark:text-amber-400",
                iconBg: "bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900/50",
                trendBadge: "In Flight",
                trendBadgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40",
              },
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-slate-200/90 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Top: Title & Clean Icon Container */}
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {kpi.title}
                    </p>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.iconBg}`}>
                      <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                    </div>
                  </div>

                  {/* Middle: Large Stat Number & Trend Badge */}
                  <div className="mt-3 flex items-baseline gap-2.5">
                    <h3 className="text-[28px] sm:text-[32px] font-black text-slate-900 dark:text-white tracking-tight leading-none">
                      {kpi.value}
                    </h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${kpi.trendBadgeColor}`}>
                      {kpi.trendBadge}
                    </span>
                  </div>

                  {/* Bottom: Subtitle */}
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-2">
                    {kpi.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Section 1: Monthly Velocity Trend & Task Status Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Area Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-[#5B5FEF]" />
                    {isAdminView ? t("org_growth_velocity", "Organization Growth & Task Velocity") : t("monthly_delivery_velocity", "Monthly Task Delivery Velocity")}
                  </h3>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAdminView
                      ? "Monthly registrations vs completed enterprise deliverables"
                      : "Monthly assigned tasks vs successfully completed deliverables"}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[12px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 w-fit">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5B5FEF]" />
                    {isAdminView ? "Total Users" : "Assigned"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    Completed
                  </div>
                </div>
              </div>

              <div className="h-[300px] sm:h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={growthData}
                    margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                  >
                    <defs>
                      <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B5FEF" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#5B5FEF" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#94A3B8"
                      strokeOpacity={0.15}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B", fontWeight: 700 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B", fontWeight: 700 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      name={isAdminView ? "Total Users" : "Assigned Tasks"}
                      dataKey="users"
                      fill="url(#velocityGradient)"
                      stroke="#5B5FEF"
                      strokeWidth={3.5}
                      activeDot={{ r: 6, fill: "#5B5FEF", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      name="Completed Tasks"
                      dataKey="active"
                      stroke="#10B981"
                      strokeWidth={3.5}
                      dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#10B981" }}
                      activeDot={{ r: 7, fill: "#10B981" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Status Breakdown Donut Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChartIcon className="w-4.5 h-4.5 text-[#5B5FEF]" />
                  {t("task_status_breakdown", "Task Status Breakdown")}
                </h3>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Current distribution across all workflow stages
                </p>
              </div>

              <div className="h-[210px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Legend Pills */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {statusBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-slate-300">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-[12.5px] font-extrabold text-slate-900 dark:text-white">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Weekly Delivery Cadence & Priority Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Performance Tracking (Mon-Sun) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-[#5B5FEF]" />
                    {t("weekly_task_cadence", "Weekly Task Cadence (Mon – Sun)")}
                  </h3>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Expected schedule vs actual completed deliverables
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[12px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700 w-fit">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-600" />
                    Expected
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#5B5FEF]" />
                    Actual Done
                  </div>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={taskData}
                    margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#94A3B8"
                      strokeOpacity={0.15}
                    />
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
                      tick={{ fontSize: 12, fill: "#64748B", fontWeight: 700 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="expected"
                      name="Expected Tasks"
                      fill="#94A3B8"
                      fillOpacity={0.3}
                      radius={[6, 6, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      dataKey="actual"
                      name="Actual Completed"
                      fill="#5B5FEF"
                      radius={[6, 6, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Workload Priority Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="mb-6">
                <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-[#5B5FEF]" />
                  {t("workload_priority", "Workload by Priority Level")}
                </h3>
                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Severity split of current assigned tasks
                </p>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priorityData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#94A3B8"
                      strokeOpacity={0.15}
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B", fontWeight: 700 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="priority"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#64748B", fontWeight: 700 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      name="Tasks Count"
                      radius={[0, 8, 8, 0]}
                      barSize={24}
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section 3: If Admin, display Department Distribution & Demographics */}
          {isAdminView && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Split */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all">
                <div className="mb-6">
                  <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">
                    {t("dept_distribution_title", "Department Distribution")}
                  </h3>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Percentage allocation of workforce
                  </p>
                </div>
                <div className="space-y-3.5">
                  {deptData.map((d, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px] font-bold">
                        <span className="text-slate-700 dark:text-slate-300">{d.name}</span>
                        <span className="text-slate-900 dark:text-white font-extrabold">
                          {d.value}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${d.value}%`, backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workforce Demographics */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all">
                <div className="mb-6">
                  <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">
                    {t("workforce_demographics", "Workforce Age Demographics")}
                  </h3>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Age distribution across employee profiles
                  </p>
                </div>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={demographicsData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, bottom: 0, left: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#94A3B8"
                        strokeOpacity={0.15}
                      />
                      <XAxis type="number" hide allowDecimals={false} />
                      <YAxis
                        dataKey="age"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748B", fontWeight: 700 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="count"
                        name="Employees"
                        fill="#F2C078"
                        radius={[0, 6, 6, 0]}
                        barSize={20}
                      >
                        {demographicsData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 1 ? "#5B5FEF" : "#F2C078"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
