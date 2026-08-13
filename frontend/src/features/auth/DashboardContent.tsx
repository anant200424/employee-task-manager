"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Loader2,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Tag,
  Shield,
  Briefcase,
  UserCheck,
  Building,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Task } from "@/types/auth";

interface StatItem {
  label: string;
  value: number;
}

export const DashboardContent = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatItem[]>([
    { label: "Total Tasks", value: 4 },
    { label: "In Progress", value: 2 },
    { label: "In Review", value: 1 },
    { label: "Completed", value: 1 },
  ]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newTaskStatus, setNewTaskStatus] = useState<"todo" | "in_progress" | "review" | "completed">("in_progress");
  const [newTaskTag, setNewTaskTag] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, tasksRes] = await Promise.allSettled([
        api.get("/users/dashboard"),
        api.get("/tasks"),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data.data?.stats) {
        setStats(dashRes.value.data.data.stats);
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
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
      );
      await api.patch(`/tasks/${task._id}`, { status: nextStatus });
      // Refresh stats
      const res = await api.get("/users/dashboard");
      if (res.data.data?.stats) setStats(res.data.data.stats);
    } catch (err) {
      console.error("Failed to update task:", err);
      loadData();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      await api.delete(`/tasks/${taskId}`);
      const res = await api.get("/users/dashboard");
      if (res.data.data?.stats) setStats(res.data.data.stats);
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
      }

      const dashRes = await api.get("/users/dashboard");
      if (dashRes.data.data?.stats) setStats(dashRes.data.data.stats);
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter tasks based on status and search query
  const filteredTasks = tasks.filter((t) => {
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "in_progress" && (t.status === "in_progress" || t.status === "todo")) ||
      (activeFilter === "review" && t.status === "review") ||
      (activeFilter === "completed" && t.status === "completed");

    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <Topbar
        title={`Hello, ${user?.firstName || "Team Member"} 👋`}
        subtitle="Manage and track your team's tasks with absolute clarity."
      />

      <main className="p-5 sm:p-7 lg:p-8 space-y-7 max-w-[1400px]">
        {/* =========================================================
            1. HERO BANNER CARD
        ========================================================= */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E293B] via-[#2A3B66] to-[#4355CC] p-7 sm:p-9 text-white shadow-[0_12px_36px_rgba(30,41,59,0.18)]">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[11.5px] font-semibold tracking-wide backdrop-blur-sm">
                  EmpSphere Workspace
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11.5px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Employee
                </span>
              </div>
              <h2 className="text-[26px] sm:text-[30px] font-extrabold tracking-tight">
                {user ? `${user.firstName} ${user.lastName}` : "Welcome to EmpSphere"}
              </h2>
              <p className="mt-1 text-[14px] text-blue-100/80 max-w-[540px]">
                Employee ID: <strong className="text-white font-mono">{user?.employeeId || "EMP-1042"}</strong> • Department: <strong className="text-white">{user?.department || "Engineering"}</strong> • Role: <strong className="text-white">{user?.role || "Software Engineer"}</strong>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 rounded-xl bg-white text-[#1E293B] hover:bg-blue-50 px-5 py-3 text-[13.5px] font-bold shadow-sm transition-all cursor-pointer hover:shadow-md"
              >
                <Plus className="w-4 h-4 text-[#4355CC]" />
                New Task
              </button>
            </div>
          </div>
        </section>

        {/* =========================================================
            2. LIVE KPI METRIC CARDS
        ========================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((stat, idx) => {
            const icons = [CheckSquare, Clock, AlertCircle, CheckCircle2];
            const colors = ["bg-blue-50 text-[#4355CC]", "bg-amber-50 text-amber-600", "bg-purple-50 text-purple-600", "bg-emerald-50 text-emerald-600"];
            const borders = ["border-blue-100", "border-amber-100", "border-purple-100", "border-emerald-100"];
            const Icon = icons[idx % icons.length];

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-slate-500">{stat.label}</span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors[idx % colors.length]}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-[28px] font-extrabold text-slate-900 leading-none">{stat.value}</p>
                  <span className="text-[12px] font-medium text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> active
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* =========================================================
            3. MAIN CONTENT GRID (Tasks List + Sidebar Activity)
        ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* LEFT: Task Manager (8 Cols) */}
          <section className="lg:col-span-8 space-y-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)]">
              
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <h3 className="text-[18px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-[#4355CC]" /> Task Manager
                  </h3>
                  <p className="text-[13px] text-slate-500 mt-0.5">
                    Assign, track, and complete tasks seamlessly.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {[
                    { id: "all", label: "All" },
                    { id: "in_progress", label: "In Progress" },
                    { id: "review", label: "Review" },
                    { id: "completed", label: "Done" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                        activeFilter === tab.id
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Quick Add Bar */}
              <div className="flex items-center gap-3 my-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assigned tasks..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#4355CC] focus:outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] text-white text-[13px] font-semibold transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Task
                </button>
              </div>

              {/* Task Items List */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4355CC]" />
                  <p className="text-sm font-medium">Loading workspace tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-14 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 my-2">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#4355CC] flex items-center justify-center mx-auto mb-3">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-[15px] font-bold text-slate-800">No tasks found</h4>
                  <p className="text-[13px] text-slate-500 mt-1 max-w-[320px] mx-auto">
                    {searchQuery
                      ? "No tasks match your search query. Try typing something else."
                      : "You're all caught up! Create a new task to organize your day."}
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4355CC] text-white text-[13px] font-semibold shadow-sm hover:bg-[#3644A8] transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create First Task
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  {filteredTasks.map((task) => {
                    const isCompleted = task.status === "completed";

                    // Priority Pill
                    const priorityConfig = {
                      urgent: "bg-red-50 text-red-700 border-red-200",
                      high: "bg-amber-50 text-amber-700 border-amber-200",
                      medium: "bg-blue-50 text-[#4355CC] border-blue-200",
                      low: "bg-slate-100 text-slate-600 border-slate-200",
                    }[task.priority || "medium"];

                    // Status Pill
                    const statusConfig = {
                      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      review: "bg-purple-50 text-purple-700 border-purple-200",
                      in_progress: "bg-blue-50 text-[#4355CC] border-blue-200",
                      todo: "bg-slate-100 text-slate-700 border-slate-200",
                    }[task.status || "in_progress"];

                    return (
                      <div
                        key={task._id}
                        className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all ${
                          isCompleted
                            ? "bg-slate-50/80 border-slate-200/70 opacity-75"
                            : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        {/* Left: Checkbox + Content */}
                        <div className="flex items-start gap-3.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleTask(task)}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                              isCompleted
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 bg-white hover:border-[#4355CC]"
                            }`}
                          >
                            {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </button>

                          <div>
                            <p
                              className={`text-[14px] font-semibold leading-snug ${
                                isCompleted ? "line-through text-slate-400" : "text-slate-800"
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-[12.5px] text-slate-500 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Tags & Due Date */}
                            <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11.5px]">
                              {/* Status Badge */}
                              <span className={`px-2 py-0.5 rounded-md border font-semibold capitalize ${statusConfig}`}>
                                {task.status.replace("_", " ")}
                              </span>

                              {/* Priority Badge */}
                              <span className={`px-2 py-0.5 rounded-md border font-semibold uppercase tracking-wider text-[10px] ${priorityConfig}`}>
                                {task.priority}
                              </span>

                              {/* Tags */}
                              {task.tags?.map((t) => (
                                <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                  #{t}
                                </span>
                              ))}

                              {/* Due Date */}
                              <span className="text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No date"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Delete Action */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-slate-300 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: Employee Info & Activity Feed (4 Cols) */}
          <section className="lg:col-span-4 space-y-6">
            
            {/* Employee ID Profile Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-[#1E293B] text-white flex items-center justify-center text-base font-bold shadow-sm">
                  {user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "EM"}
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900">
                    {user ? `${user.firstName} ${user.lastName}` : "Employee Profile"}
                  </h4>
                  <p className="text-[12px] text-slate-500 font-medium">{user?.email}</p>
                </div>
              </div>

              {/* Employee Key-Value Details */}
              <div className="space-y-3 text-[13px]">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-slate-400" /> Employee ID
                  </span>
                  <span className="font-mono font-bold text-[#4355CC] bg-blue-50 px-2 py-0.5 rounded-md">
                    {user?.employeeId || "EMP-1042"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-slate-400" /> Department
                  </span>
                  <span className="font-semibold text-slate-800">
                    {user?.department || "Engineering"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" /> Role
                  </span>
                  <span className="font-semibold text-slate-800">
                    {user?.role || "Software Engineer"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-slate-400" /> Security Status
                  </span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[11.5px]">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Team Activity Feed */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)]">
              <h4 className="text-[15px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4355CC]" /> Recent Activity
              </h4>
              <ul className="space-y-4 text-[13px]">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#4355CC] mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800">Logged into EmpSphere dashboard</p>
                    <p className="text-[11.5px] text-slate-400">Just now</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800">Assigned to {user?.department || "Engineering"} tasks</p>
                    <p className="text-[11.5px] text-slate-400">Today</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800">Completed 2FA security registration</p>
                    <p className="text-[11.5px] text-slate-400">Yesterday</p>
                  </div>
                </li>
              </ul>
            </div>

          </section>

        </div>
      </main>

      {/* =========================================================
          NEW TASK MODAL
      ========================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.2)] border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-[18px] font-bold text-slate-900">Create New Task</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 mt-5">
              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Design homepage hero workflow"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Add details, steps, or milestones..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as never)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-800 mb-1">
                    Tag
                  </label>
                  <input
                    type="text"
                    value={newTaskTag}
                    onChange={(e) => setNewTaskTag(e.target.value)}
                    placeholder="e.g. Design, Sprint"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-[13.5px] text-slate-800 focus:border-[#4355CC] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13.5px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-[#4355CC] hover:bg-[#3644A8] text-white text-[13.5px] font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
