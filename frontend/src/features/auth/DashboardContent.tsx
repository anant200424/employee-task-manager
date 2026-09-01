"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Trash2,
  CheckSquare,
  Search
} from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Task } from "@/types/auth";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface DashboardStats {
  label: string;
  value: number;
}

interface ActivityItem {
  title: string;
  time: string;
}

const mockLineData = [
  { name: "Mon", completed: 12, inProgress: 8, pending: 4 },
  { name: "Tue", completed: 18, inProgress: 10, pending: 5 },
  { name: "Wed", completed: 15, inProgress: 15, pending: 8 },
  { name: "Thu", completed: 22, inProgress: 12, pending: 6 },
  { name: "Fri", completed: 28, inProgress: 14, pending: 4 },
  { name: "Sat", completed: 10, inProgress: 5, pending: 2 },
  { name: "Sun", completed: 5, inProgress: 3, pending: 1 },
];

const mockSalaryData = [
  { name: "Jan", Engineering: 45000, Design: 24000, HR: 18000 },
  { name: "Feb", Engineering: 47000, Design: 25000, HR: 18500 },
  { name: "Mar", Engineering: 46000, Design: 24500, HR: 19000 },
  { name: "Apr", Engineering: 52000, Design: 27000, HR: 20000 },
  { name: "May", Engineering: 51000, Design: 26000, HR: 20000 },
  { name: "Jun", Engineering: 54000, Design: 28000, HR: 21000 },
];

const mockAttendanceData = [
  { name: "W1", present: 96, late: 3, absent: 1 },
  { name: "W2", present: 98, late: 2, absent: 0 },
  { name: "W3", present: 92, late: 5, absent: 3 },
  { name: "W4", present: 97, late: 2, absent: 1 },
];

const mockPerformanceData = [
  { name: "Excellent", value: 45, color: "#10B981" },
  { name: "Good", value: 35, color: "#5B5FEF" },
  { name: "Average", value: 15, color: "#F59E0B" },
  { name: "Poor", value: 5, color: "#EF4444" },
];

export const DashboardContent = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats[]>([
    { label: "Total Tasks", value: 0 },
    { label: "In Progress", value: 0 },
    { label: "In Review", value: 0 },
    { label: "Completed", value: 0 },
  ]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Chart data states
  const [lineData, setLineData] = useState<any[]>(mockLineData);
  const [salaryData, setSalaryData] = useState<any[]>(mockSalaryData);
  const [performanceData, setPerformanceData] = useState<any[]>(mockPerformanceData);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newTaskStatus] = useState<"todo" | "in_progress" | "review" | "completed">("in_progress");
  const [newTaskTag, setNewTaskTag] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, tasksRes] = await Promise.allSettled([
        api.get("/users/dashboard"),
        api.get("/tasks"),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data.data) {
        if (dashRes.value.data.data.stats) {
           setStats(dashRes.value.data.data.stats);
        }
        if (dashRes.value.data.data.recentActivity) {
           setRecentActivity(dashRes.value.data.data.recentActivity);
        }
        // Handle admin chart data dynamically
        const charts = dashRes.value.data.data.charts;
        if (charts) {
          if (charts.lineData) setLineData(charts.lineData);
          if (charts.deptHeadcount) setSalaryData(charts.deptHeadcount);
          if (charts.priorityStats) setPerformanceData(charts.priorityStats);
        }
      }

      if (tasksRes.status === "fulfilled" && tasksRes.value.data.data?.tasks) {
        setTasks(tasksRes.value.data.data.tasks);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleTask = async (task: Task) => {
    const nextStatus = task.status === "completed" ? "in_progress" : "completed";
    try {
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
      );
      await api.patch(`/tasks/${task._id}`, { status: nextStatus });
      loadData(); // refresh stats
    } catch (err) {
      console.error("Failed to update task:", err);
      loadData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      await api.delete(`/tasks/${taskId}`);
      loadData(); // refresh stats
    } catch (err) {
      console.error("Failed to delete task:", err);
      loadData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsCreating(true);
    try {
      const res = await api.post("/tasks", {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        priority: newTaskPriority,
        status: newTaskStatus,
        tags: newTaskTag ? [newTaskTag.trim()] : ["Task"],
      });

      if (res.data.data?.task) {
        setTasks((prev) => [res.data.data.task, ...prev]);
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskTag("");
        setShowModal(false);
        loadData(); // refresh stats
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "todo" && t.status === "todo") ||
      (activeFilter === "in_progress" && (t.status === "in_progress" || t.status === "todo")) ||
      (activeFilter === "review" && t.status === "review") ||
      (activeFilter === "completed" && t.status === "completed");

    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Calculate Productivity %
  const totalTasks = stats.find((s) => s.label === "Total Tasks")?.value || 0;
  const completedTasks = stats.find((s) => s.label === "Completed")?.value || 0;
  const productivityPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - (productivityPercent / 100) * circumference;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <Topbar
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening today."
      />

      <main className="px-5 sm:px-7 lg:px-8 max-w-[1600px] mx-auto mt-6 animate-in fade-in duration-500 h-[calc(100vh-140px)]">
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="xl:col-span-7 h-full flex flex-col gap-6">
            
            {/* Welcome Hero */}
            <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1E293B] to-[#0F172A] dark:from-[#0B1120] dark:to-[#020617] p-8 lg:p-10 shadow-[0_8px_30px_rgba(15,23,42,0.12)] border border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shrink-0">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#5B5FEF]/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
               
               <div className="relative z-10 space-y-2">
                 <h2 className="text-[28px] lg:text-[34px] font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
                   Good morning, {user?.firstName || "there"} 👋
                 </h2>
                 <p className="text-[14px] lg:text-[15px] text-slate-300 leading-relaxed font-medium max-w-xl">
                   Stay organized, track your progress, and get more done today.
                 </p>
               </div>
               <div className="relative z-10 shrink-0">
                 <button
                   onClick={() => setShowModal(true)}
                   className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-7 py-3 rounded-xl text-[14px] font-bold shadow-lg transition-all hover:-translate-y-1 active:translate-y-0 cursor-pointer flex items-center gap-2 group"
                 >
                   <span className="text-lg leading-none group-hover:scale-110 transition-transform">+</span> Create Task
                 </button>
               </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
               {[
                 { label: "Total Tasks", value: stats.find(s=>s.label==="Total Tasks")?.value || 0, trend: "+12.5%", trendColor: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300", accent: "bg-slate-500" },
                 { label: "In Progress", value: stats.find(s=>s.label==="In Progress")?.value || 0, trend: "+4.2%", trendColor: "text-blue-700 bg-blue-50 dark:bg-blue-500/20 dark:text-blue-400", accent: "bg-blue-500" },
                 { label: "Completed", value: stats.find(s=>s.label==="Completed")?.value || 0, trend: "+18.4%", trendColor: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/20 dark:text-emerald-400", accent: "bg-emerald-500" },
                 { label: "Pending", value: stats.find(s=>s.label==="In Review")?.value || 0, trend: "-2.3%", trendColor: "text-amber-700 bg-amber-50 dark:bg-amber-500/20 dark:text-amber-400", accent: "bg-amber-500" },
               ].map((stat, idx) => (
                 <div key={idx} className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200/60 dark:border-slate-800 hover:border-[#5B5FEF]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer">
                    <div className={`absolute top-0 left-0 w-full h-1 ${stat.accent} opacity-20 group-hover:opacity-100 transition-opacity`} />
                    <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    <div className="mt-4 flex items-end justify-between">
                      <h3 className="text-[32px] xl:text-[36px] font-black text-slate-900 dark:text-white leading-none tracking-tight">{stat.value}</h3>
                      <span className={`inline-block mb-1 px-2.5 py-1 rounded-md text-[11px] font-extrabold ${stat.trendColor}`}>
                         {stat.trend}
                      </span>
                    </div>
                 </div>
               ))}
            </div>

            {/* My Tasks Section (Scrollable List) */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 sm:p-8 shadow-sm border border-slate-200/60 dark:border-slate-800 flex-1 flex flex-col min-h-0">
               <div className="shrink-0">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-[18px] font-extrabold text-slate-900">My Tasks</h3>
                      <p className="text-[13px] text-slate-500 font-medium">Keep track of everything you need to accomplish.</p>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "All" },
                        { id: "todo", label: "To Do" },
                        { id: "in_progress", label: "In Progress" },
                        { id: "review", label: "Review" },
                        { id: "completed", label: "Completed" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveFilter(tab.id)}
                          className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                            activeFilter === tab.id
                              ? "bg-[#5B5FEF] text-white shadow-md shadow-[#5B5FEF]/20"
                              : "text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* Search & Sort */}
                 <div className="flex items-center gap-3 mb-6">
                   <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search tasks..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-[13px] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF] transition-all"
                      />
                   </div>
                   <div className="shrink-0">
                      <select className="py-2 pl-3 pr-8 rounded-lg border border-slate-200 text-[13px] font-bold text-slate-700 bg-white focus:outline-none cursor-pointer appearance-none">
                         <option>Sort by</option>
                         <option>Date</option>
                         <option>Priority</option>
                      </select>
                   </div>
                 </div>
               </div>

               {/* Task List (Scrollable Area) */}
               <div className="flex-1 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                 {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-[#5B5FEF]" />
                      <p className="text-[13px] font-semibold">Loading tasks...</p>
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-xl mt-4">
                      <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-[15px] font-extrabold text-slate-900">No tasks found</h4>
                      <p className="text-[13px] text-slate-500 mt-1">Adjust filters or create a new task.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-4">
                      {filteredTasks.map((task) => {
                        const isCompleted = task.status === "completed";
                        const statusColor = {
                          todo: "text-slate-600 bg-slate-100",
                          in_progress: "text-blue-700 bg-blue-50",
                          review: "text-purple-700 bg-purple-50",
                          completed: "text-emerald-700 bg-emerald-50"
                        }[task.status] || "text-slate-600 bg-slate-100";
                        
                        const priorityColor = {
                          urgent: "text-red-600",
                          high: "text-amber-600",
                          medium: "text-blue-600",
                          low: "text-slate-500"
                        }[task.priority || "medium"];

                        return (
                          <div
                            key={task._id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[16px] border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm transition-all cursor-pointer"
                          >
                            <div className="flex gap-4 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleTask(task)}
                                className={`shrink-0 w-5 h-5 rounded-[6px] mt-0.5 flex items-center justify-center border-2 transition-colors cursor-pointer ${
                                  isCompleted
                                    ? "bg-[#5B5FEF] border-[#5B5FEF] text-white"
                                    : "bg-white border-slate-300 hover:border-[#5B5FEF]"
                                }`}
                              >
                                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                 <h4 className={`text-[14px] font-bold truncate ${isCompleted ? "line-through text-slate-400" : "text-slate-900"}`}>
                                   {task.title}
                                 </h4>
                                 <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1">
                                   {task.description || "No description provided."}
                                 </p>
                                 
                                 {/* Mobile Metadata */}
                                 <div className="flex sm:hidden flex-wrap items-center gap-3 mt-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${statusColor}`}>
                                      {task.status.replace("_", " ")}
                                    </span>
                                    <span className={`flex items-center gap-1 text-[11px] font-bold ${priorityColor}`}>
                                       <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
                                       {task.priority}
                                    </span>
                                 </div>
                              </div>
                            </div>

                            {/* Desktop Metadata */}
                            <div className="hidden sm:flex items-center gap-5 shrink-0">
                               <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize ${statusColor}`}>
                                 {task.status.replace("_", " ")}
                               </span>
                               
                               <div className={`flex items-center gap-1.5 text-[12px] font-bold w-[70px] ${priorityColor}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full bg-current`} />
                                  <span className="capitalize">{task.priority}</span>
                               </div>

                               {/* Assignee Avatars */}
                               <div className="flex w-[60px]">
                                  <div className="w-7 h-7 rounded-full bg-[#1E293B] border-2 border-white flex items-center justify-center text-[10px] text-white font-bold overflow-hidden">
                                     {user?.avatarUrl ? (
                                       <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" />
                                     ) : (
                                       user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "ME"
                                     )}
                                  </div>
                               </div>

                               <div className="text-[12px] font-semibold text-slate-600 w-[90px]">
                                 {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                               </div>

                               <div className="w-[60px] flex items-center justify-center">
                                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                                    {task.tags?.[0] || 'Tag'}
                                  </span>
                               </div>

                               <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(task._id)}
                                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN (Scrollable) ================= */}
          <div className="xl:col-span-5 h-full overflow-y-auto pr-4 pb-12 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
             
             {/* Productivity Card */}
             <div className="bg-white dark:bg-slate-900 rounded-[24px] p-7 shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#5B5FEF]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none group-hover:scale-110 transition-transform" />
                <div className="relative z-10">
                  <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">Productivity</h3>
                  <div className="mt-3">
                     <span className="text-[36px] font-black text-slate-900 dark:text-white leading-none tracking-tight">{productivityPercent}%</span>
                     <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">Great progress this<br/>week</p>
                  </div>
                </div>
                <div className="relative w-24 h-24 shrink-0">
                   <svg className="w-full h-full transform -rotate-90">
                     <circle cx="48" cy="48" r="38" stroke="#F1F5F9" strokeWidth="5" fill="none" />
                     <circle 
                        cx="48" 
                        cy="48" 
                        r="38" 
                        stroke="#4355CC" 
                        strokeWidth="5" 
                        fill="none" 
                        strokeLinecap="round"
                        style={{ strokeDasharray: circumference, strokeDashoffset, transition: "stroke-dashoffset 1s ease-in-out" }}
                     />
                   </svg>
                </div>
             </div>

             {/* Recent Activity */}
             <div className="bg-white dark:bg-slate-900 rounded-[24px] p-7 shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all">
                <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
                <div className="space-y-5 relative before:absolute before:inset-0 before:left-[11px] before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                  {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                    <div key={idx} className="relative flex gap-4">
                       <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-[5px] border-[#5B5FEF] shrink-0 z-10 shadow-sm" />
                       <div>
                         <span className="text-[11px] font-bold text-[#5B5FEF] block mb-0.5 uppercase tracking-wide">Update</span>
                         <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-200 leading-snug">{activity.title}</h4>
                         <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{activity.time}</p>
                       </div>
                    </div>
                  )) : (
                    <div className="text-[13px] font-medium text-slate-500 dark:text-slate-400 pl-8">No recent activity.</div>
                  )}
                </div>
             </div>

             {/* Task Performance Chart */}
             <div className="bg-white dark:bg-slate-900 rounded-[24px] p-7 shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">Task Performance</h3>
                  <select className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 outline-none cursor-pointer">
                    <option>This Week</option>
                    <option>Last Week</option>
                  </select>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#10B981' }} />
                      <Line type="monotone" dataKey="inProgress" stroke="#5B5FEF" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#5B5FEF' }} />
                      <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#F59E0B' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-6 text-[11px] font-bold text-slate-600">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10B981]" /> Completed</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#5B5FEF]" /> In Progress</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Pending</div>
                </div>
             </div>

             {/* Salary & Department Budgets (Bar Chart) */}
             <div className="bg-white dark:bg-slate-900 rounded-[24px] p-7 shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">
                      {user?.role === "admin" ? "Staff Headcount" : "Salary & Budgets"}
                    </h3>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {user?.role === "admin" ? "Registered employees by department" : "Departmental expenses"}
                    </p>
                  </div>
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salaryData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="Engineering" stackId="a" fill="#5B5FEF" radius={[0, 0, 4, 4]} barSize={12} />
                      <Bar dataKey="Design" stackId="a" fill="#F2C078" barSize={12} />
                      <Bar dataKey="HR" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {user?.role === "admin" ? (
                  <div className="flex items-center justify-center gap-4 mt-6 text-[11px] font-bold text-slate-600">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#5B5FEF]" /> Engineering ({salaryData[0]?.Engineering || 0})</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#F2C078]" /> Design ({salaryData[0]?.Design || 0})</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10B981]" /> HR ({salaryData[0]?.HR || 0})</div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-4 mt-6 text-[11px] font-bold text-slate-600">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#5B5FEF]" /> Eng</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#F2C078]" /> Design</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10B981]" /> HR</div>
                  </div>
                )}
             </div>

             {/* Attendance Trends (Area Chart) */}
             <div className="bg-white dark:bg-slate-900 rounded-[24px] p-7 shadow-sm border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white">Attendance Trends</h3>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Monthly check-in rates</p>
                  </div>
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockAttendanceData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="present" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
                      <Area type="monotone" dataKey="late" stroke="#F59E0B" strokeWidth={2} fillOpacity={0} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-6 text-[11px] font-bold text-slate-600">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10B981]" /> Present</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Late</div>
                </div>
             </div>

             {/* Overall Performance (Pie/Donut Chart) */}
             <div className="bg-white rounded-[18px] p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-slate-900">
                      {user?.role === "admin" ? "Task Priorities" : "Overall Performance"}
                    </h3>
                    <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                      {user?.role === "admin" ? "Priority distribution of all tasks" : "Employee rating distribution"}
                    </p>
                  </div>
                </div>
                <div className="h-[220px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={performanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {performanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center text for Donut Chart */}
                  {user?.role === "admin" ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                       <span className="text-[24px] font-black text-slate-900 leading-none">{totalTasks}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Total Tasks</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                       <span className="text-[28px] font-black text-slate-900 leading-none">45%</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Excellent</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-x-4 gap-y-2 mt-4 text-[11px] font-bold text-slate-600 flex-wrap">
                  {performanceData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} /> {item.name} ({item.value})
                    </div>
                  ))}
                </div>
             </div>

          </div>
        </div>
      </main>

      {/* =========================================================
          PREMIUM NEW TASK MODAL
      ========================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[520px] rounded-[24px] bg-white shadow-2xl overflow-hidden">
            <div className="bg-white px-7 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[20px] font-extrabold text-slate-900">Create New Task</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="p-7 space-y-5">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Task Title *</label>
                <input type="text" required value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="e.g. Update Q3 Marketing Strategy" className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Description (Optional)</label>
                <textarea rows={3} value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} placeholder="Add context, links, or sub-tasks..." className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Priority Level</label>
                  <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as never)} className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all cursor-pointer">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Category Tag</label>
                  <input type="text" value={newTaskTag} onChange={(e) => setNewTaskTag(e.target.value)} placeholder="e.g. Design" className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#5B5FEF] focus:ring-4 focus:ring-[#5B5FEF]/10 focus:outline-none transition-all" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isCreating} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4F46E5] text-white text-[14px] font-bold shadow-md shadow-[#5B5FEF]/20 transition-all cursor-pointer disabled:opacity-50">
                  {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
