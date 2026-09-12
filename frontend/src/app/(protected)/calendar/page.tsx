"use client";

import { useState, useEffect, useMemo } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { useLanguage } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { Task } from "@/types/auth";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Flame,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// Helper to get days in month
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Helper to get starting day of week (Monday = 0)
function getStartDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}

export default function CalendarPage() {
  const { t } = useLanguage();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "today" | "urgent" | "in_progress" | "completed">("all");

  // Fetch real employee tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await api.get("/tasks");
        if (res.data?.data?.tasks) {
          setTasks(res.data.data.tasks);
        }
      } catch (err) {
        console.error("Failed to load tasks for calendar", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Normalize date string (YYYY-MM-DD)
  const getDateKey = (dateInput: Date | string) => {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  // Map tasks to their scheduled dates
  const tasksByDateMap = useMemo(() => {
    const map = new Map<string, Task[]>();

    tasks.forEach((task) => {
      // Prioritize dueDate; fallback to createdAt
      const targetDate = task.dueDate || task.createdAt;
      const key = getDateKey(targetDate);
      if (!key) return;

      const existing = map.get(key) || [];
      existing.push(task);
      map.set(key, existing);
    });

    return map;
  }, [tasks]);

  // Filter tasks based on active filter
  const filterTask = (task: Task) => {
    if (filterType === "urgent") return task.priority === "urgent" || task.priority === "high";
    if (filterType === "in_progress") return task.status === "in_progress";
    if (filterType === "completed") return task.status === "completed";
    return true;
  };

  // Selected date tasks
  const selectedDateKey = getDateKey(selectedDate);
  const selectedDayTasks = useMemo(() => {
    const list = tasksByDateMap.get(selectedDateKey) || [];
    return list.filter((task) => {
      if (filterType === "urgent") return task.priority === "urgent" || task.priority === "high";
      if (filterType === "in_progress") return task.status === "in_progress";
      if (filterType === "completed") return task.status === "completed";
      return true;
    });
  }, [tasksByDateMap, selectedDateKey, filterType]);

  // Overall Month Statistics
  const monthStats = useMemo(() => {
    const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const monthTasks = tasks.filter((t) => {
      const dKey = getDateKey(t.dueDate || t.createdAt);
      return dKey.startsWith(currentMonthPrefix);
    });

    const todayKey = getDateKey(new Date());
    const dueToday = (tasksByDateMap.get(todayKey) || []).filter((t) => t.status !== "completed").length;
    const urgent = monthTasks.filter((t) => (t.priority === "urgent" || t.priority === "high") && t.status !== "completed").length;
    const completed = monthTasks.filter((t) => t.status === "completed").length;

    return {
      totalMonth: monthTasks.length,
      dueToday,
      urgent,
      completed,
    };
  }, [tasks, year, month, tasksByDateMap]);

  return (
    <div className="min-h-screen bg-transparent pb-16 transition-colors duration-300">
      <Topbar
        title={t("workspace_calendar", "Task & Milestone Calendar")}
        subtitle="Manage your scheduled task deliverables, sprint deadlines, and daily assignments."
      />

      <main className="px-5 sm:px-7 lg:px-8 space-y-6 max-w-[1700px] mx-auto mt-6 animate-in fade-in duration-300">
        
        {/* ================= TOP CALENDAR METRIC CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Month Deliverables</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {monthStats.totalMonth} Tasks
              </h3>
              <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Scheduled for {monthNames[month]}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Due Today</p>
              <h3 className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
                {monthStats.dueToday} Tasks
              </h3>
              <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Requires action before EOD
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Urgent Deadlines</p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {monthStats.urgent} Critical
              </h3>
              <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                High priority deliverables
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Shipped & Resolved</p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {monthStats.completed} Completed
              </h3>
              <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Milestones achieved this month
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ================= FILTER PILLS & NAVIGATION HEADER ================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Month Stepper & Today Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
                title="Previous Month"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={nextMonth}
                className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
                title="Next Month"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {monthNames[month]} {year}
              </h2>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-[#5B5FEF]" />}
            </div>

            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[12px] font-extrabold transition-colors cursor-pointer active:scale-95"
            >
              Today
            </button>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[12px] font-bold">
            {[
              { id: "all", label: "All Tasks" },
              { id: "urgent", label: "Urgent / High" },
              { id: "in_progress", label: "In Progress" },
              { id: "completed", label: "Completed" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  filterType === f.id
                    ? "bg-[#5B5FEF] text-white shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= CALENDAR GRID & DETAILS 2-COLUMN LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Month Grid (8 Columns) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-center py-3 text-[12px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider">
              {dayNames.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
              {/* Empty leading padding slots */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[110px] sm:min-h-[125px] bg-slate-50/30 dark:bg-slate-950/20 p-2"
                />
              ))}

              {/* Actual Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const cellDate = new Date(year, month, dayNumber);
                const cellDateKey = getDateKey(cellDate);
                const isToday = cellDateKey === getDateKey(new Date());
                const isSelected = cellDateKey === selectedDateKey;

                const dayTasks = (tasksByDateMap.get(cellDateKey) || []).filter(filterTask);

                return (
                  <div
                    key={dayNumber}
                    onClick={() => setSelectedDate(cellDate)}
                    className={`min-h-[110px] sm:min-h-[125px] p-2 sm:p-2.5 transition-all cursor-pointer flex flex-col justify-between group relative ${
                      isSelected
                        ? "bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-inset ring-[#5B5FEF]"
                        : "bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[12px] sm:text-[13px] font-black flex items-center justify-center transition-all ${
                          isToday
                            ? "bg-[#5B5FEF] text-white shadow-xs"
                            : isSelected
                            ? "text-[#5B5FEF] font-black"
                            : "text-slate-700 dark:text-slate-300 group-hover:text-[#5B5FEF]"
                        }`}
                      >
                        {dayNumber}
                      </span>

                      {dayTasks.length > 0 && (
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>

                    {/* Task Pills Inside Calendar Cell */}
                    <div className="space-y-1 mt-1.5 overflow-hidden flex-1">
                      {dayTasks.slice(0, 2).map((task) => {
                        const isCompleted = task.status === "completed";
                        const isUrgent = task.priority === "urgent" || task.priority === "high";

                        let pillStyle = "bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5FEF] border-indigo-100 dark:border-indigo-900/40";
                        if (isCompleted) {
                          pillStyle = "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/40";
                        } else if (isUrgent) {
                          pillStyle = "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/40";
                        }

                        return (
                          <div
                            key={task._id}
                            className={`px-1.5 py-1 rounded-md text-[10.5px] font-bold truncate border shadow-2xs ${pillStyle}`}
                            title={`${task.taskCode}: ${task.title}`}
                          >
                            <span className="font-extrabold mr-1">{task.taskCode}</span>
                            <span>{task.title}</span>
                          </div>
                        );
                      })}

                      {dayTasks.length > 2 && (
                        <div className="text-[10px] font-extrabold text-slate-400 pl-1">
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Schedule & Task Details Side Panel (4 Columns) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarCheck className="w-4.5 h-4.5 text-[#5B5FEF]" />
                    <span>Daily Deliverables</span>
                  </h3>
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5FEF] dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                  {selectedDayTasks.length} {selectedDayTasks.length === 1 ? "Task" : "Tasks"}
                </span>
              </div>

              {/* Tasks List for Selected Day */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
                {selectedDayTasks.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-[13.5px] font-bold text-slate-700 dark:text-slate-300">
                      No tasks due on this date
                    </p>
                    <p className="text-[12px] text-slate-400 max-w-xs mx-auto">
                      Enjoy your clear schedule or click another highlighted date to review deliverables.
                    </p>
                  </div>
                ) : (
                  selectedDayTasks.map((task) => {
                    const isCompleted = task.status === "completed";
                    const isUrgent = task.priority === "urgent" || task.priority === "high";

                    return (
                      <div key={task._id} className="py-4 space-y-2.5 group">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {task.taskCode}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isUrgent
                                  ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              {task.priority}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isCompleted
                                  ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                                  : "bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300"
                              }`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[14px] font-extrabold text-slate-900 dark:text-white leading-tight">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-semibold text-slate-400">
                            Dept: {task.department || "General"}
                          </span>

                          <Link
                            href={`/tasks?search=${encodeURIComponent(task.taskCode)}`}
                            className="text-[11.5px] font-bold text-[#5B5FEF] hover:underline flex items-center gap-1"
                          >
                            <span>Open in Tasks</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Helper Card */}
            <div className="bg-gradient-to-br from-[#5B5FEF] to-[#4338CA] rounded-3xl p-5 text-white shadow-card relative overflow-hidden">
              <h4 className="text-base font-black">Calendar Sync & Notifications</h4>
              <p className="text-[12px] font-medium text-white/80 mt-1 leading-relaxed">
                Task deadlines are updated automatically whenever tasks are assigned or status is updated on the board.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  href="/tasks"
                  className="px-3.5 py-2 rounded-xl bg-white text-[#5B5FEF] text-[12px] font-black shadow-xs hover:bg-slate-50 transition-colors"
                >
                  View Tasks Board
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
