"use client";

import React from "react";
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
} from "recharts";
import {
  Users,
  TrendingUp,
  Clock,
  PieChart as PieChartIcon,
  Calendar,
  Sparkles,
  Layers,
} from "lucide-react";

interface AnalyticsChartsProps {
  computedData: any;
  isAdminView: boolean;
  viewMode: string;
  t: (key: string, fallback?: string) => string;
  user: any;
  demographicsData: any[];
  deptColleaguesList: any[];
}

// Custom Chart Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md text-[12.5px] font-bold space-y-1 animate-in fade-in zoom-in-95 duration-150">
        {label && (
          <p className="text-slate-400 font-extrabold uppercase text-[11px] tracking-wider mb-1 border-b border-slate-800 pb-1">
            {label}
          </p>
        )}
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

export default function AnalyticsCharts({
  computedData,
  isAdminView,
  viewMode,
  t,
  user,
  demographicsData,
  deptColleaguesList,
}: AnalyticsChartsProps) {
  const totalStatusTasks = computedData.statusBreakdown.reduce(
    (acc: number, curr: any) => acc + (Number(curr.value) || 0),
    0,
  );
  const completedItem = computedData.statusBreakdown.find(
    (s: any) => s.name === "Completed",
  );
  const completedCount = completedItem?.value || 0;
  const completedPercent =
    totalStatusTasks > 0
      ? Math.round((completedCount / totalStatusTasks) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Section 1: Monthly Velocity Trend & Task Status Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <div
          className={`lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-xs border transition-all relative overflow-hidden flex flex-col justify-between ${
            viewMode === "velocity"
              ? "border-[#5B5FEF] ring-2 ring-indigo-500/25 shadow-lg"
              : "border-slate-200/80 dark:border-slate-800 hover:shadow-md"
          }`}
        >
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-[17px] sm:text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#5B5FEF]" />
                {isAdminView
                  ? t("org_growth_velocity", "Organization Growth & Task Velocity")
                  : t("monthly_delivery_velocity", "Monthly Task Delivery Velocity")}
              </h3>
              <p className="text-[12.5px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {isAdminView
                  ? "Real-time sprint trajectory: cumulative deliverables, completed output & headcount"
                  : "Monthly assigned deliverables vs successfully completed output"}
              </p>
            </div>
            {/* Dynamic KPI Badges */}
            <div className="flex items-center gap-2 text-[11px] sm:text-[11.5px] font-black text-slate-600 dark:text-slate-300 flex-wrap">
              <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 sm:px-3 py-1 rounded-xl border border-indigo-200/80 dark:border-indigo-800/50">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B5FEF]" />
                {isAdminView ? "Deliverables: 400" : "Assigned"}
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 sm:px-3 py-1 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                Completed: {completedCount} ({completedPercent}%)
              </div>
              {isAdminView && (
                <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2.5 sm:px-3 py-1 rounded-xl border border-purple-200/80 dark:border-purple-800/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                  Team: {computedData.kpis?.totalUsers || 128}
                </div>
              )}
            </div>
          </div>

          <div className="h-[260px] sm:h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={computedData.growthData}
                margin={{ top: 12, right: 12, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B5FEF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#5B5FEF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.32} />
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
                  tick={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  name={isAdminView ? "Deliverables Pipeline" : "Assigned Tasks"}
                  dataKey="active"
                  fill="url(#velocityGradient)"
                  stroke="#5B5FEF"
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: "#5B5FEF", stroke: "#fff", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  name="Completed Tasks"
                  dataKey="completed"
                  fill="url(#completedGradient)"
                  stroke="#10B981"
                  strokeWidth={3}
                  activeDot={{ r: 6, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }}
                />
                {isAdminView && (
                  <Line
                    type="monotone"
                    name="Headcount / Team"
                    dataKey="users"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3.5, fill: "#8B5CF6", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: "#8B5CF6" }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Executive Velocity KPI Strip */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Pipeline
              </span>
              <div className="text-[14px] sm:text-[16px] font-black text-slate-900 dark:text-white mt-0.5 truncate">
                {computedData.kpis?.totalTasks || "400"}
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-extrabold text-indigo-600 dark:text-indigo-400 truncate block">
                Assigned
              </span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Completed
              </span>
              <div className="text-[14px] sm:text-[16px] font-black text-slate-900 dark:text-white mt-0.5 truncate">
                {completedCount}
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-extrabold text-emerald-600 dark:text-emerald-400 truncate block">
                {completedPercent}% Rate
              </span>
            </div>

            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                {isAdminView ? "Team" : "Active"}
              </span>
              <div className="text-[14px] sm:text-[16px] font-black text-slate-900 dark:text-white mt-0.5 truncate">
                {isAdminView ? `${computedData.kpis?.totalUsers || "128"}` : computedData.kpis?.activeHours || "Active"}
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-extrabold text-purple-600 dark:text-purple-400 truncate block">
                {isAdminView ? "Optimal" : "In Pipeline"}
              </span>
            </div>
          </div>
        </div>

        {/* Task Status Breakdown Donut Chart */}
        <div
          className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-xs border transition-all relative overflow-hidden flex flex-col justify-between ${
            viewMode === "workload"
              ? "border-sky-500 ring-2 ring-sky-500/25 shadow-lg"
              : "border-slate-200/80 dark:border-slate-800 hover:shadow-md"
          }`}
        >
          <div className="mb-3">
            <h3 className="text-[17px] sm:text-[18px] font-black text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-[#5B5FEF]" />
              {t("task_status_breakdown", "Task Status Breakdown")}
            </h3>
            <p className="text-[12.5px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Current distribution across workflow stages
            </p>
          </div>

          {/* Donut Chart with Centered Metric Overlay */}
          <div className="h-[200px] sm:h-[210px] w-full relative flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={computedData.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={4}
                  cornerRadius={5}
                  dataKey="value"
                  stroke="none"
                >
                  {computedData.statusBreakdown.map((entry: any, index: number) => (
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

            {/* Centered Donut KPI Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Total Tasks
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {totalStatusTasks}
              </span>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 mt-1">
                {completedPercent}% Done
              </span>
            </div>
          </div>

          {/* Enhanced Status Breakdown Cards with Mini Progress Bars */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-3">
            {computedData.statusBreakdown.map((item: any, idx: number) => {
              const itemPct =
                totalStatusTasks > 0
                  ? Math.round((Number(item.value) / totalStatusTasks) * 100)
                  : 0;

              return (
                <div
                  key={idx}
                  className="p-2 sm:p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11.5px] sm:text-[12px] font-bold text-slate-700 dark:text-slate-300 truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[12px] sm:text-[13px] font-black text-slate-900 dark:text-white shrink-0">
                      {item.value}
                    </span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="mt-1.5">
                    <div className="w-full bg-slate-200/70 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${itemPct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[9.5px] font-extrabold text-slate-400">
                      <span>Share</span>
                      <span style={{ color: item.color }}>{itemPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Weekly Delivery Cadence & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance Tracking (Mon-Sun) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-[17px] sm:text-[18px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-[#5B5FEF]" />
                {t("weekly_task_cadence", "Weekly Task Cadence (Mon – Sun)")}
              </h3>
              <p className="text-[12.5px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Expected schedule vs actual completed deliverables
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700 w-fit">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-600" />
                Expected
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#5B5FEF]" />
                Actual
              </div>
            </div>
          </div>

          <div className="h-[250px] sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={computedData.taskData}
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
                  tick={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="expected"
                  name="Expected Tasks"
                  fill="#94A3B8"
                  fillOpacity={0.3}
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="actual"
                  name="Actual Completed"
                  fill="#5B5FEF"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workload Priority Breakdown */}
        <div
          className={`bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-xs border transition-all flex flex-col justify-between ${
            viewMode === "workload"
              ? "border-amber-500 ring-2 ring-amber-500/25 shadow-lg"
              : "border-slate-200/80 dark:border-slate-800 hover:shadow-md"
          }`}
        >
          <div className="mb-5">
            <h3 className="text-[17px] sm:text-[18px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-[#5B5FEF]" />
              {t("workload_priority", "Workload by Priority Level")}
            </h3>
            <p className="text-[12.5px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Severity split of current assigned tasks
            </p>
          </div>

          <div className="h-[250px] sm:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={computedData.priorityData}
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
                  tick={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="priority"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Tasks Count"
                  radius={[0, 8, 8, 0]}
                  barSize={20}
                >
                  {computedData.priorityData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 3: Admin vs Employee Tailored Section */}
      {isAdminView ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Split */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all">
            <div className="mb-5">
              <h3 className="text-[17px] sm:text-[18px] font-extrabold text-slate-900 dark:text-white">
                {t("dept_distribution_title", "Department Distribution")}
              </h3>
              <p className="text-[12.5px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Percentage allocation of workforce
              </p>
            </div>
            <div className="space-y-3.5">
              {computedData.deptData.map((d: any, idx: number) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12.5px] sm:text-[13px] font-bold">
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all">
            <div className="mb-5">
              <h3 className="text-[17px] sm:text-[18px] font-extrabold text-slate-900 dark:text-white">
                {t("workforce_demographics", "Workforce Age Demographics")}
              </h3>
              <p className="text-[12.5px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                Age distribution across employee profiles
              </p>
            </div>
            <div className="h-[230px] sm:h-[240px] w-full">
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
                    tick={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    name="Employees"
                    fill="#F2C078"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee: My Department Colleagues */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[17px] sm:text-[18px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#5B5FEF]" />
                  My Team Colleagues ({user?.department || "General"})
                </h3>
                <p className="text-[12.5px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Teammates collaborating with you in this department
                </p>
              </div>
            </div>

            {(deptColleaguesList || []).length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                  Workspace connected
                </p>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Active team members will show up here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {(deptColleaguesList || []).map((col: any) => (
                  <div
                    key={col.id || col.email}
                    className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#5B5FEF] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                        {col.avatarUrl ? (
                          <img src={col.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          col.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-extrabold text-slate-900 dark:text-white truncate">
                          {col.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium truncate">
                          {col.role || "Team Member"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Employee: Delivery Efficiency & Velocity Index */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <h3 className="text-[17px] sm:text-[18px] font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Personal Velocity Benchmark
                </h3>
                <p className="text-[12.5px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Monthly delivery reliability and milestone fulfillment
                </p>
              </div>

              <div className="space-y-4 my-2">
                <div>
                  <div className="flex items-center justify-between text-[12.5px] font-bold mb-1.5">
                    <span className="text-slate-600 dark:text-slate-300">Completion Efficiency</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      {computedData.kpis.productivity}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(parseInt(computedData.kpis.productivity) || 10, 8)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-2">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">
                      Shipped
                    </span>
                    <p className="text-[16px] sm:text-[18px] font-black text-slate-900 dark:text-white mt-0.5">
                      {computedData.kpis.completedTasks}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                    <span className="text-[10px] sm:text-[11px] font-extrabold text-sky-600 dark:text-sky-400 uppercase">
                      In Pipeline
                    </span>
                    <p className="text-[16px] sm:text-[18px] font-black text-slate-900 dark:text-white mt-0.5 truncate">
                      {computedData.kpis.activeHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-bold text-slate-400">
              Reliability index calculated from assigned deliverables.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
