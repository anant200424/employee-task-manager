"use client";

import { useState, useEffect } from "react";
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
  ComposedChart
} from "recharts";
import { Users, TrendingUp, Briefcase, Clock, Loader2 } from "lucide-react";

// Fallback Mock Data for Analytics in case of empty DB states
const fallbackMonthlyGrowth = [
  { month: "Jan", users: 5, active: 3 },
  { month: "Feb", users: 10, active: 7 },
  { month: "Mar", users: 15, active: 11 },
  { month: "Apr", users: 20, active: 15 },
  { month: "May", users: 25, active: 19 },
  { month: "Jun", users: 30, active: 22 },
];

const fallbackDeptDistribution = [
  { name: "Engineering", value: 100, color: "#5B5FEF" },
];

const fallbackTaskCompletionStats = [
  { day: "Mon", expected: 5, actual: 3 },
  { day: "Tue", expected: 5, actual: 4 },
  { day: "Wed", expected: 5, actual: 5 },
  { day: "Thu", expected: 5, actual: 4 },
  { day: "Fri", expected: 5, actual: 3 },
];

const fallbackUserDemographics = [
  { age: "18-24", count: 1 },
  { age: "25-34", count: 1 },
  { age: "35-44", count: 1 },
  { age: "45-54", count: 0 },
  { age: "55+", count: 0 },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(true);
  const [kpis, setKpis] = useState({
    totalUsers: "0",
    productivity: "0%",
    completedTasks: "0",
    activeHours: "0 Tasks Active",
  });
  const [growthData, setGrowthData] = useState<any[]>(fallbackMonthlyGrowth);
  const [deptData, setDeptData] = useState<any[]>(fallbackDeptDistribution);
  const [taskData, setTaskData] = useState<any[]>(fallbackTaskCompletionStats);
  const [demographicsData, setDemographicsData] = useState<any[]>(fallbackUserDemographics);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/analytics");
      if (res.data?.data) {
        const { isAdmin, kpis, monthlyGrowth, departmentDistribution, taskCompletionStats, userDemographics } = res.data.data;
        setIsAdminView(!!isAdmin);
        if (kpis) setKpis(kpis);
        if (monthlyGrowth && monthlyGrowth.length > 0) setGrowthData(monthlyGrowth);
        if (departmentDistribution && departmentDistribution.length > 0) setDeptData(departmentDistribution);
        if (taskCompletionStats && taskCompletionStats.length > 0) setTaskData(taskCompletionStats);
        if (userDemographics && userDemographics.length > 0) setDemographicsData(userDemographics);
      }
    } catch (err) {
      console.error("Failed to load analytics metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <Topbar title="Analytics" subtitle={isAdminView ? "Deep dive into your organization's performance and metrics." : "Review your productivity and task completion stats."} />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#5B5FEF]" />
          <p className="text-[14px] font-semibold text-slate-500">Loading metrics dashboard...</p>
        </div>
      ) : (
        <main className="px-5 sm:px-7 lg:px-8 max-w-[1600px] mx-auto mt-6 animate-in fade-in duration-500 space-y-6">
          {/* KPI Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: isAdminView ? "Total Users" : "User Profile", value: kpis.totalUsers, trend: "+12.5%", icon: Users, color: "text-[#5B5FEF] dark:text-[#818CF8]", bg: "bg-[#EEF0FF] dark:bg-[#5B5FEF]/20" },
              { title: "Avg. Productivity", value: kpis.productivity, trend: "+5.2%", icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/20" },
              { title: "Tasks Completed", value: kpis.completedTasks, trend: "+18.1%", icon: Briefcase, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/20" },
              { title: "Active Tasks", value: kpis.activeHours, trend: "-2.4%", icon: Clock, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/20" },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 rounded-[24px] p-7 shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-between hover:shadow-md transition-all group">
                 <div>
                   <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{kpi.title}</p>
                   <div className="flex items-end gap-3 mt-3">
                     <h3 className="text-[32px] font-black text-slate-900 dark:text-white leading-none tracking-tight">{kpi.value}</h3>
                     <span className={`text-[12px] font-extrabold mb-1 px-2.5 py-1 rounded-md ${kpi.trend.startsWith('+') ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-rose-700 bg-rose-50 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                       {kpi.trend}
                     </span>
                   </div>
                 </div>
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${kpi.bg} ${kpi.color}`}>
                   <kpi.icon className="w-7 h-7" />
                 </div>
              </div>
            ))}
          </div>

          {/* Growth & Engagement Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className={`${isAdminView ? "lg:col-span-2" : "lg:col-span-3"} bg-white dark:bg-slate-900 rounded-[24px] p-7 shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all relative overflow-hidden group`}>
               <div className="absolute top-0 left-0 w-full h-1 bg-[#5B5FEF] opacity-20 group-hover:opacity-100 transition-opacity" />
               <div className="mb-8">
                 <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">{isAdminView ? "Growth & Engagement" : "My Task Submissions"}</h3>
                 <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{isAdminView ? "Monthly active users vs total registrations" : "Monthly task creations vs task completions"}</p>
               </div>
               <div className="h-[320px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={growthData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                     <defs>
                       <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#5B5FEF" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#5B5FEF" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.1} />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} dy={10} />
                     <YAxis hide />
                     <Tooltip cursor={{ stroke: '#5B5FEF', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 'bold' }} />
                     <Area type="monotone" dataKey="users" fillOpacity={1} fill="url(#colorUsers)" stroke="#5B5FEF" strokeWidth={4} />
                     <Line type="monotone" dataKey="active" stroke="#10B981" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#fff' }} activeDot={{ r: 8 }} />
                   </ComposedChart>
                 </ResponsiveContainer>
               </div>
               <div className="flex items-center justify-center gap-6 mt-6 text-[12px] font-bold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#5B5FEF]/50 border border-[#5B5FEF]" /> {isAdminView ? "Total Users" : "Assigned Tasks"}</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10B981]" /> {isAdminView ? "Active Users" : "Completed Tasks"}</div>
               </div>
             </div>

             {isAdminView && (
               <div className="bg-white dark:bg-slate-900 rounded-[24px] p-7 shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-[#10B981] opacity-20 group-hover:opacity-100 transition-opacity" />
                 <div className="mb-6">
                   <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">Department Split</h3>
                   <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Distribution of employees</p>
                 </div>
                 <div className="h-[250px] w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={deptData}
                         cx="50%"
                         cy="50%"
                         innerRadius={75}
                         outerRadius={95}
                         paddingAngle={4}
                         dataKey="value"
                         stroke="none"
                       >
                         {deptData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} className="drop-shadow-sm transition-all duration-300 hover:opacity-80" />
                         ))}
                       </Pie>
                       <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 'bold' }} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
                 <div className="space-y-3 mt-4 overflow-y-auto max-h-[140px] pr-1">
                    {deptData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[13px] font-bold animate-in fade-in duration-300">
                        <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }} />
                          {item.name}
                        </div>
                        <span className="text-slate-900 dark:text-white">{item.value}%</span>
                      </div>
                    ))}
                 </div>
               </div>
             )}
          </div>

          {/* Performance & Demographics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className={`${isAdminView ? "" : "lg:col-span-2"} bg-white dark:bg-slate-900 rounded-[24px] p-7 shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all relative overflow-hidden group`}>
               <div className="absolute top-0 left-0 w-full h-1 bg-[#5B5FEF] opacity-20 group-hover:opacity-100 transition-opacity" />
               <div className="mb-8">
                 <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">{isAdminView ? "Task Performance Tracking" : "My Task Deliverables"}</h3>
                 <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{isAdminView ? "Expected vs Actual completions" : "Weekly expected vs actual completed tasks"}</p>
               </div>
               <div className="h-[280px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={taskData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.1} />
                     <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} dy={10} />
                     <YAxis hide />
                     <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 'bold' }} />
                     <Bar dataKey="expected" fill="#334155" fillOpacity={0.15} radius={[6, 6, 6, 6]} barSize={24} />
                     <Bar dataKey="actual" fill="#5B5FEF" radius={[6, 6, 6, 6]} barSize={24} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
               <div className="flex items-center justify-center gap-6 mt-6 text-[12px] font-bold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" /> Expected</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#5B5FEF]" /> Actual</div>
               </div>
             </div>

             {isAdminView && (
               <div className="bg-white dark:bg-slate-900 rounded-[24px] p-7 shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-[#F59E0B] opacity-20 group-hover:opacity-100 transition-opacity" />
                 <div className="mb-8">
                   <h3 className="text-[18px] font-extrabold text-slate-900 dark:text-white">User Demographics</h3>
                   <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Age distribution of workforce</p>
                 </div>
                 <div className="h-[280px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={demographicsData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" strokeOpacity={0.1} />
                       <XAxis type="number" hide />
                       <YAxis dataKey="age" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} />
                       <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 'bold' }} />
                       <Bar dataKey="count" fill="#F2C078" radius={[0, 6, 6, 0]} barSize={20}>
                         {demographicsData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index === 1 ? '#5B5FEF' : '#F2C078'} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>
             )}
          </div>
        </main>
      )}
    </div>
  );
}
