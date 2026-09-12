"use client";

import React, { useEffect, useState, useMemo, useRef, Fragment } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  ArrowUpDown,
  Edit2,
  Trash2,
  Building2,
  Check,
  Flame,
  Download,
  FileSpreadsheet,
  FileCode,
  Printer,
  ChevronDown,
  Eye,
  Sparkles,
  Share2,
  Maximize2,
  Minimize2,
  LayoutList,
  Kanban,
  BarChart3,
  Calendar,
  Layers,
  FolderKanban,
  Copy,
  RefreshCw,
  X,
  CheckSquare,
  CalendarDays,
  TrendingUp,
  RotateCcw,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Topbar } from "@/components/dashboard/Topbar";
import { api, taskApi } from "@/lib/api";
import { Task, AssignedUser } from "@/types/auth";
import { NewTaskModal } from "./NewTaskModal";
import { EditTaskModal } from "./EditTaskModal";
import { TasksSkeleton } from "@/components/ui/Skeleton";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { exportTasksToCSV, exportTasksToExcel, exportTasksToJSON, printTasksReport } from "@/lib/exportUtils";
import { toast } from "react-hot-toast";
import { filterFuzzy } from "@/lib/searchUtils";

type ActiveTab = "list" | "summary" | "board" | "timeline" | "reports";

export const TasksContent = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();

  const systemRole = useMemo(() => {
    if (user?.systemRole) return user.systemRole;
    if (user?.role === "admin") return "admin";
    if (user?.role?.toLowerCase().includes("manager")) return "manager";
    return "employee";
  }, [user]);

  const isSuperAdmin = systemRole === "super_admin";
  const isSystemAdmin = systemRole === "system_admin" || isSuperAdmin;
  const isAdmin = systemRole === "admin" || isSystemAdmin;
  const isManager = systemRole === "manager";
  const canCreateTask = isAdmin || isManager;

  // Primary State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("list");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [groupBy, setGroupBy] = useState<"none" | "status" | "priority" | "department">("none");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineItemsPerPage, setTimelineItemsPerPage] = useState<number>(10);

  // Group collapse state for grouped tables
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Active 3-dot dropdown menu tracker
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Refs for click outside to dismiss all dropdown menus
  const filterRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Dropdown toggles
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen effect: lock scroll, hide sidebar via body class, listen for Esc key
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add("tasks-fullscreen");
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsFullscreen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.classList.remove("tasks-fullscreen");
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.classList.remove("tasks-fullscreen");
    }
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  // Selected row checkboxes
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Bulk Actions State
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Sync filter from URL query params
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    dateFilter !== "all" ||
    departmentFilter !== "all" ||
    onlyMyTasks ||
    groupBy !== "none" ||
    sortBy !== "latest"
  );

  const resetAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setDateFilter("all");
    setDepartmentFilter("all");
    setOnlyMyTasks(false);
    setGroupBy("none");
    setSortBy("latest");
    toast.success("Filters reset to default");
  };

  // Close ALL dropdowns and popups on clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (exportRef.current && !exportRef.current.contains(target)) {
        setIsExportOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(target)) {
        setIsFilterOpen(false);
      }
      if (groupRef.current && !groupRef.current.contains(target)) {
        setIsGroupOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(target)) {
        setIsSortOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setActiveMenuTaskId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hydrate initial tasks from cache if available so UI never flashes empty
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexus_cached_tasks");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
          setLoading(false);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!authLoading && (isAuthenticated || user)) {
      fetchTasks();
    }
  }, [authLoading, isAuthenticated, dateFilter, sortBy, statusFilter]);

  const fetchTasks = async (showToast = false) => {
    try {
      if (!showToast && tasks.length === 0) setLoading(true);
      else if (showToast) setRefreshing(true);

      const params: Record<string, string> = {
        _t: Date.now().toString(),
      };
      if (dateFilter !== "all") params.dateFilter = dateFilter;
      if (sortBy) params.sort = sortBy;
      if (statusFilter === "trash") params.trash = "true";

      const [res] = await Promise.all([
        api.get("/tasks", { params }),
        new Promise((resolve) => setTimeout(resolve, showToast ? 600 : 0)),
      ]);

      if (res.data?.data?.tasks) {
        setTasks(res.data.data.tasks);
        try {
          localStorage.setItem("nexus_cached_tasks", JSON.stringify(res.data.data.tasks));
        } catch {}
        if (showToast) toast.success(`Refreshed! Synchronized ${res.data.data.tasks.length} live tasks.`);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      if (showToast) toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "todo").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const inReview = tasks.filter((t) => t.status === "review").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === "completed") return false;
      return new Date(t.dueDate) < new Date();
    }).length;

    return { total, pending, inProgress, inReview, completed, overdue };
  }, [tasks]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set);
  }, [tasks]);

  // Filtered tasks list with smart typo-tolerant fuzzy search
  const filteredTasks = useMemo(() => {
    let list = tasks.filter((task) => {
      let matchesStatus = true;
      if (statusFilter === "all" || statusFilter === "trash") {
        matchesStatus = true;
      } else if (statusFilter === "overdue") {
        matchesStatus = Boolean(
          task.dueDate && task.status !== "completed" && new Date(task.dueDate) < new Date(),
        );
      } else if (statusFilter === "pending") {
        matchesStatus = task.status === "todo" || task.status === "review";
      } else {
        matchesStatus = task.status === statusFilter;
      }

      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesDept = departmentFilter === "all" || task.department === departmentFilter;

      let matchesMyTasks = true;
      if (onlyMyTasks && user?._id) {
        const assignees = task.assignedTo || [];
        matchesMyTasks = assignees.some((a) => (typeof a === "string" ? a === user._id : a._id === user._id));
      }

      return matchesStatus && matchesPriority && matchesDept && matchesMyTasks;
    });

    if (searchQuery.trim()) {
      list = filterFuzzy(list, searchQuery, (t) => [
        t.title,
        t.description,
        t.taskCode,
        t.department,
      ]);
    }

    return list;
  }, [tasks, searchQuery, statusFilter, priorityFilter, departmentFilter, onlyMyTasks, user]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage) || 1;
  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredTasks, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter, dateFilter, departmentFilter, onlyMyTasks, sortBy, groupBy]);

  // Timeline Pagination
  const totalTimelinePages = Math.ceil(filteredTasks.length / timelineItemsPerPage) || 1;
  const paginatedTimelineTasks = useMemo(() => {
    return filteredTasks.slice(
      (timelinePage - 1) * timelineItemsPerPage,
      timelinePage * timelineItemsPerPage,
    );
  }, [filteredTasks, timelinePage, timelineItemsPerPage]);

  useEffect(() => {
    setTimelinePage(1);
  }, [searchQuery, statusFilter, priorityFilter, dateFilter, departmentFilter, onlyMyTasks, sortBy, groupBy, timelineItemsPerPage]);

  // Quick update task status directly from Jira status pill with OPTIMISTIC UI
  const handleQuickStatusChange = async (taskId: string, newStatus: string) => {
    const previousTasks = tasks;
    // 1. Instantly update UI for hyper-fast response
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus as any } : t)),
    );
    toast.success("Task status updated!", { id: `status-${taskId}` });

    // 2. Persist to server in background
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
    } catch (err: any) {
      // Rollback optimistic update on failure
      setTasks(previousTasks);
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  // Quick update priority with OPTIMISTIC UI
  const handleQuickPriorityChange = async (taskId: string, newPriority: string) => {
    const previousTasks = tasks;
    // 1. Instantly update UI
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, priority: newPriority as any } : t)),
    );
    toast.success("Task priority updated!", { id: `priority-${taskId}` });
    setActiveMenuTaskId(null);

    // 2. Persist in background
    try {
      await api.patch(`/tasks/${taskId}`, { priority: newPriority });
    } catch (err: any) {
      // Rollback optimistic update
      setTasks(previousTasks);
      toast.error(err.response?.data?.message || "Failed to update priority");
    }
  };

  // Delete Task Handler with OPTIMISTIC UI
  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Are you sure you want to delete task ${task.taskCode} ("${task.title}")?`)) {
      return;
    }
    const previousTasks = tasks;
    // 1. Instantly remove from view
    setTasks((prev) => prev.filter((t) => t._id !== task._id));
    toast.success(`Task ${task.taskCode} deleted successfully.`);
    setActiveMenuTaskId(null);

    // 2. Persist in background
    try {
      await api.delete(`/tasks/${task._id}`);
    } catch (err: any) {
      // Rollback
      setTasks(previousTasks);
      toast.error(err.response?.data?.message || "Failed to delete task");
    }
  };

  // Restore Soft-Deleted Task Handler with OPTIMISTIC UI
  const handleRestoreTask = async (task: Task) => {
    const previousTasks = tasks;
    // 1. Instantly remove from trash view
    setTasks((prev) => prev.filter((t) => t._id !== task._id));
    toast.success(`Task ${task.taskCode} restored successfully!`);
    setActiveMenuTaskId(null);

    // 2. Persist in background
    try {
      await taskApi.restoreTask(task._id);
    } catch (err: any) {
      setTasks(previousTasks);
      toast.error(err.response?.data?.message || "Failed to restore task");
    }
  };

  // Duplicate Task Handler
  const handleDuplicateTask = async (task: Task) => {
    try {
      const assigneeIds = (task.assignedTo || []).map((a) => (typeof a === "string" ? a : a._id));
      const res = await api.post("/tasks", {
        title: `${task.title} (Copy)`,
        description: task.description,
        priority: task.priority,
        status: "todo",
        dueDate: task.dueDate,
        department: task.department,
        tags: task.tags,
        assignedTo: assigneeIds,
      });
      if (res.data?.data?.task) {
        setTasks((prev) => [res.data.data.task, ...prev]);
        toast.success(`Cloned as ${res.data.data.task.taskCode}!`);
      }
      setActiveMenuTaskId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to duplicate task");
    }
  };

  // Copy Task Key / Link
  const handleCopyKey = (task: Task) => {
    navigator.clipboard.writeText(task.taskCode);
    toast.success(`Copied "${task.taskCode}" to clipboard!`);
    setActiveMenuTaskId(null);
  };

  const handleCopyLink = (task: Task) => {
    const url = `${window.location.origin}/tasks?search=${task.taskCode}`;
    navigator.clipboard.writeText(url);
    toast.success(`Task link copied to clipboard!`);
    setActiveMenuTaskId(null);
  };

  // Toggle group collapse
  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Grouped tasks mapping
  const groupedTasks = useMemo(() => {
    if (groupBy === "none") return null;

    const map: Record<string, Task[]> = {};
    if (groupBy === "status") {
      map["To Do"] = filteredTasks.filter((t) => t.status === "todo");
      map["In Progress"] = filteredTasks.filter((t) => t.status === "in_progress");
      map["In Review"] = filteredTasks.filter((t) => t.status === "review");
      map["Completed"] = filteredTasks.filter((t) => t.status === "completed");
    } else if (groupBy === "priority") {
      map["Urgent"] = filteredTasks.filter((t) => t.priority === "urgent");
      map["High"] = filteredTasks.filter((t) => t.priority === "high");
      map["Medium"] = filteredTasks.filter((t) => t.priority === "medium");
      map["Low"] = filteredTasks.filter((t) => t.priority === "low");
    } else if (groupBy === "department") {
      filteredTasks.forEach((t) => {
        const d = t.department || "General";
        if (!map[d]) map[d] = [];
        map[d].push(t);
      });
    }
    return map;
  }, [groupBy, filteredTasks]);

  // Format Jira-style dates
  const formatJiraDateTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatJiraDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatJiraTimeOnly = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Jira Status Dropdown Pill
  const renderJiraStatusPill = (task: Task) => {
    const statusStyles: Record<string, { bg: string; text: string; border: string; label: string; pillClass: string }> = {
      todo: {
        bg: "bg-[#DFE1E6]/70 dark:bg-[#182030] hover:bg-[#DFE1E6]",
        text: "text-[#42526E] dark:text-[#CBD5E1]",
        border: "border-slate-300 dark:border-slate-600/40",
        label: t("status_todo"),
        pillClass: "status-pill-todo",
      },
      in_progress: {
        bg: "bg-[#DEEBFF] dark:bg-[#0C2444] hover:bg-[#B3D4FF]",
        text: "text-[#0052CC] dark:text-[#38BDF8]",
        border: "border-sky-300 dark:border-sky-500/40",
        label: t("status_in_progress"),
        pillClass: "status-pill-in_progress",
      },
      review: {
        bg: "bg-[#EAE6FF] dark:bg-[#251347] hover:bg-[#C0B6F2]",
        text: "text-[#403294] dark:text-[#C084FC]",
        border: "border-purple-300 dark:border-purple-500/40",
        label: t("status_review"),
        pillClass: "status-pill-review",
      },
      completed: {
        bg: "bg-[#E3FCEF] dark:bg-[#063323] hover:bg-[#ABF5D1]",
        text: "text-[#006644] dark:text-[#34D399]",
        border: "border-emerald-300 dark:border-emerald-500/40",
        label: t("status_done"),
        pillClass: "status-pill-completed",
      },
    };

    const cur = statusStyles[task.status] || statusStyles.todo;

    return (
      <div
        className="relative inline-flex items-center"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <select
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            handleQuickStatusChange(task._id, e.target.value);
          }}
          className={`status-pill ${cur.pillClass} appearance-none px-2.5 py-1 pr-6 rounded-[5px] text-[11px] font-extrabold tracking-wide uppercase cursor-pointer border outline-none transition-all shadow-xs ${cur.bg} ${cur.text} ${cur.border}`}
        >
          <option value="todo">{t("status_todo")}</option>
          <option value="in_progress">{t("status_in_progress")}</option>
          <option value="review">{t("status_review")}</option>
          <option value="completed">{t("status_done")}</option>
        </select>
        <ChevronDown className={`w-3 h-3 absolute right-1.5 pointer-events-none ${cur.text}`} />
      </div>
    );
  };

  // Jira Priority Pill
  const renderJiraPriority = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-red-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
            <span>{t("priority_urgent")}</span>
          </div>
        );
      case "high":
        return (
          <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-orange-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
            <span>{t("priority_high")}</span>
          </div>
        );
      case "medium":
        return (
          <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-sky-400">
            <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.5)]" />
            <span>{t("priority_medium")}</span>
          </div>
        );
      case "low":
        return (
          <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
            <span>{t("priority_low")}</span>
          </div>
        );
      default:
        return <span className="text-[12px] font-medium text-slate-400">—</span>;
    }
  };

  // Reporter / Creator information
  const getReporterInfo = (task: Task) => {
    if (typeof task.createdBy === "object" && task.createdBy?.firstName) {
      const name = `${task.createdBy.firstName} ${task.createdBy.lastName || ""}`.trim();
      const initials = `${task.createdBy.firstName[0]}${task.createdBy.lastName?.[0] || ""}`.toUpperCase();
      return { name, initials };
    }
    return { name: "System Admin", initials: "SA" };
  };

  // Checkbox Selection
  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === paginatedTasks.length && paginatedTasks.length > 0) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(paginatedTasks.map((t) => t._id));
    }
  };

  // Selected tasks helper
  const selectedTasks = useMemo(() => {
    return tasks.filter((t) => selectedTaskIds.includes(t._id));
  }, [tasks, selectedTaskIds]);

  // Bulk Actions
  const handleClearSelection = () => {
    setSelectedTaskIds([]);
    toast.success("Selection cleared");
  };

  const handleBulkExport = () => {
    if (selectedTasks.length === 0) return;
    exportTasksToCSV(selectedTasks, isAdmin ? "EmpSphere_Enterprise_Tasks" : "EmpSphere_My_Tasks");
    toast.success(`Exported ${selectedTasks.length} selected task(s) to CSV!`);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedTaskIds.length === 0) return;
    setBulkLoading(true);
    try {
      let successCount = 0;
      for (const taskId of selectedTaskIds) {
        try {
          await api.patch(`/tasks/${taskId}`, { status: newStatus });
          successCount++;
        } catch (e) {
          console.error(`Failed to update status for task ${taskId}:`, e);
        }
      }
      setTasks((prev) =>
        prev.map((t) =>
          selectedTaskIds.includes(t._id) ? { ...t, status: newStatus as any } : t,
        ),
      );
      toast.success(`Updated status for ${successCount} task(s)!`);
      setSelectedTaskIds([]);
    } catch (err: any) {
      toast.error("Failed to update status for selected tasks.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    setBulkLoading(true);
    try {
      let successCount = 0;
      for (const taskId of selectedTaskIds) {
        try {
          await api.delete(`/tasks/${taskId}`);
          successCount++;
        } catch (e) {
          console.error(`Failed to delete task ${taskId}:`, e);
        }
      }
      setTasks((prev) => prev.filter((t) => !selectedTaskIds.includes(t._id)));
      toast.success(`Deleted ${successCount} task(s) successfully.`);
      setIsBulkDeleteModalOpen(false);
      setSelectedTaskIds([]);
    } catch (err: any) {
      toast.error("Failed to delete selected tasks.");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div
      className={`flex-1 flex flex-col min-h-screen bg-[#FAFBFC] dark:bg-[#090D16] transition-colors duration-300 ${
        isFullscreen ? "fixed inset-0 z-[80] h-screen w-screen overflow-hidden" : ""
      }`}
    >
      {!isFullscreen && (
        <Topbar
          title="Tasks Workspace"
          subtitle={
            isAdmin
              ? "Manage and assign enterprise tasks across teams and employees."
              : "Track and complete your assigned tasks and deliverables."
          }
          icon={<FolderKanban className="w-5 h-5 text-[#5B5FEF]" />}
        />
      )}

      {/* =========================================================================
          DEDICATED FULLSCREEN ZEN WORKSPACE HEADER
         ========================================================================= */}
      {isFullscreen && (
        <div className="bg-white dark:bg-[#101623] border-b border-slate-200/90 dark:border-slate-800 px-4 lg:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B5FEF] to-[#4338CA] text-white flex items-center justify-center font-black text-xs shadow-xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>{t("spaces")}</span>
                <span>/</span>
                <span>Engineering & Ops</span>
                <span>/</span>
                <span className="text-[#5B5FEF] font-extrabold">{isAdmin ? "My Software Team" : "My Assigned Work"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[17px] sm:text-[18px] font-black text-slate-900 dark:text-white tracking-tight">
                  {isAdmin ? t("tasks_workspace", "Tasks Workspace") : t("my_tasks_deliverables", "My Assigned Deliverables")}
                </h1>
                <span className="text-[11px] font-extrabold text-[#0052CC] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200/70 dark:border-blue-800/50 px-2 py-0.5 rounded-full">
                  {filteredTasks.length} {t("tasks_label")}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5FEF] dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/50">
                  <Maximize2 className="w-3 h-3" /> Fullscreen View
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={() => fetchTasks(true)}
              disabled={refreshing}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title={t("refresh")}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#5B5FEF]" : ""}`} />
            </button>

            {/* Export Dropdown in Fullscreen */}
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-[13px] font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title={t("export")}
              >
                <Download className="w-4 h-4 text-[#5B5FEF]" />
                <span className="hidden sm:inline">{t("export")}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      exportTasksToExcel(filteredTasks, isAdmin ? "EmpSphere_Enterprise_Tasks" : "EmpSphere_My_Tasks");
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Export to Excel (.xls)</span>
                  </button>
                  <button
                    onClick={() => {
                      exportTasksToCSV(filteredTasks, isAdmin ? "EmpSphere_Enterprise_Tasks" : "EmpSphere_My_Tasks");
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Export to CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      exportTasksToJSON(filteredTasks, isAdmin ? "EmpSphere_Enterprise_Tasks" : "EmpSphere_My_Tasks");
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Export to JSON</span>
                  </button>
                  <button
                    onClick={() => {
                      printTasksReport(filteredTasks, isAdmin ? "Enterprise Tasks Summary Report" : "My Assigned Tasks Report");
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                  >
                    <Printer className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Create Task Button in Fullscreen */}
            {canCreateTask && (
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="bg-[#0052CC] hover:bg-[#0065FF] text-white px-3.5 py-2 rounded-xl text-[13px] font-black shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t("create")}</span>
              </button>
            )}

            {/* Prominent Exit Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-[12.5px] font-black shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Exit Fullscreen (Esc)"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Exit Fullscreen</span>
              <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-800 dark:bg-slate-200 text-slate-300 dark:text-slate-700 font-mono">
                Esc
              </kbd>
            </button>
          </div>
        </div>
      )}

      <main
        className={
          isFullscreen
            ? "flex-1 min-h-0 flex flex-col p-3 lg:p-4 overflow-hidden space-y-3 w-full"
            : "flex-1 p-4 lg:p-6 pb-28 lg:pb-32 overflow-y-auto custom-scrollbar space-y-4"
        }
      >
        <div
          className={
            isFullscreen
              ? "flex-1 min-h-0 flex flex-col space-y-3 w-full"
              : "max-w-[1600px] mx-auto space-y-4"
          }
        >
          {/* =========================================================================
              1. TOP SPACE / PROJECT HEADER (Jira Image 2 Style - Only in Normal Mode)
             ========================================================================= */}
          {!isFullscreen && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800/80">
              <div>
                {/* Space Breadcrumb */}
                <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  <span>{t("spaces")}</span>
                  <span>/</span>
                  <span className="text-[#5B5FEF] font-extrabold flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5" /> {t("empsphere_workspaces")}
                  </span>
                </div>

                {/* Title & Team Badge */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B5FEF] to-[#4338CA] text-white flex items-center justify-center font-black text-xs shadow-xs">
                    ⚡
                  </div>
                  <h1 className="text-[20px] sm:text-[22px] font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    {isAdmin ? "My Software Team" : "My Assigned Work"}
                    <span className="text-[12px] font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {tasks.length} {t("tasks_label")}
                    </span>
                  </h1>
                </div>
              </div>

              {/* Quick Header Actions */}
              <div className="flex items-center gap-2">
                {/* Refresh Button */}
                <button
                  onClick={() => fetchTasks(true)}
                  disabled={refreshing}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  title={t("refresh")}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#5B5FEF]" : ""}`} />
                </button>

                {/* Export Dropdown */}
                <div ref={exportRef} className="relative">
                  <button
                    onClick={() => setIsExportOpen(!isExportOpen)}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-[13px] font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    title={t("export")}
                  >
                    <Download className="w-4 h-4 text-[#5B5FEF]" />
                    <span>{t("export")}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {isExportOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95">
                      <button
                        onClick={() => {
                          exportTasksToExcel(filteredTasks, isAdmin ? "EmpSphere_Enterprise_Tasks" : "EmpSphere_My_Tasks");
                          setIsExportOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Export to Excel (.xls)</span>
                      </button>
                      <button
                        onClick={() => {
                          exportTasksToCSV(filteredTasks, isAdmin ? "EmpSphere_Enterprise_Tasks" : "EmpSphere_My_Tasks");
                          setIsExportOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Export to CSV</span>
                      </button>
                      <button
                        onClick={() => {
                          exportTasksToJSON(filteredTasks, isAdmin ? "EmpSphere_Enterprise_Tasks" : "EmpSphere_My_Tasks");
                          setIsExportOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                      >
                        <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>Export to JSON</span>
                      </button>
                      <button
                        onClick={() => {
                          printTasksReport(filteredTasks, isAdmin ? "Enterprise Tasks Summary Report" : "My Assigned Tasks Report");
                          setIsExportOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                      >
                        <Printer className="w-4 h-4 text-purple-500 shrink-0" />
                        <span>Print / Save PDF</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  title="Fullscreen View"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* Create Task Button */}
                {canCreateTask && (
                  <button
                    onClick={() => setIsNewTaskModalOpen(true)}
                    className="bg-[#0052CC] hover:bg-[#0065FF] text-white px-4 py-2 rounded-xl text-[13px] font-black shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t("create")}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              2. HORIZONTAL TAB BAR (Image 2 Style: Summary, List, Board, Timeline, Reports)
             ========================================================================= */}
          <div className="flex items-center gap-1 border-b border-slate-200/90 dark:border-slate-800/90 overflow-x-auto custom-scrollbar text-[13.5px] font-bold">
            {[
              { id: "summary", label: t("tab_summary"), icon: BarChart3, count: metrics.total },
              { id: "list", label: t("tab_list"), icon: LayoutList, count: filteredTasks.length },
              { id: "board", label: t("tab_board"), icon: Kanban, count: null },
              { id: "timeline", label: t("tab_timeline"), icon: Calendar, count: null },
              { id: "reports", label: t("tab_reports"), icon: FileSpreadsheet, count: null },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "border-[#0052CC] text-[#0052CC] dark:text-[#5B5FEF] dark:border-[#5B5FEF]"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`text-[11px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-[#0052CC]/10 text-[#0052CC] dark:bg-[#5B5FEF]/20 dark:text-[#818CF8]"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* =========================================================================
              3. JIRA TOOLBAR (Search, Assignee Quick Filter, Filter, Group By)
             ========================================================================= */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Work - Expanded and Prominent */}
              <div className="relative w-full sm:w-80 md:w-96 lg:w-[380px] transition-all">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={t("search_work")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/15 shadow-2xs transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Assignee Avatar Filter (Only My Tasks) */}
              <button
                onClick={() => setOnlyMyTasks(!onlyMyTasks)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12.5px] font-bold transition-all cursor-pointer ${
                  onlyMyTasks
                    ? "bg-[#0052CC]/10 text-[#0052CC] border-[#0052CC]/40 shadow-xs"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                }`}
                title={t("only_my_tasks")}
              >
                <div className="w-5 h-5 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-black">
                  {user?.firstName?.[0] || "U"}
                </div>
                <span>{t("only_my_tasks")}</span>
              </button>
            </div>

            {/* Right Controls: Filters, Group By, Sort By, and Reset Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Dropdown */}
              <div ref={filterRef} className="relative">
                <button
                  onClick={() => {
                    setIsFilterOpen(!isFilterOpen);
                    setIsGroupOpen(false);
                    setIsSortOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12.5px] font-bold transition-all cursor-pointer ${
                    priorityFilter !== "all" || statusFilter !== "all" || dateFilter !== "all" || departmentFilter !== "all"
                      ? "bg-[#0052CC]/10 text-[#0052CC] border-[#0052CC]/40"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{t("filter")}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isFilterOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95 space-y-3">
                    {/* Status Filter */}
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        {t("col_status")}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { id: "all", label: t("all_statuses") },
                          { id: "todo", label: t("status_todo") },
                          { id: "in_progress", label: t("status_in_progress") },
                          { id: "review", label: t("status_review") },
                          { id: "completed", label: t("status_done") },
                          { id: "overdue", label: t("status_overdue") },
                          ...(isAdmin ? [{ id: "trash", label: "Trash / Recovery" }] : []),
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setStatusFilter(s.id)}
                            className={`px-2 py-1 text-[11.5px] font-bold rounded-lg text-left transition-colors ${
                              statusFilter === s.id
                                ? "bg-[#0052CC]/15 text-[#0052CC] dark:text-sky-400 font-black"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority Filter */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        {t("col_priority")}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { id: "all", label: t("all_priorities") },
                          { id: "urgent", label: t("priority_urgent") },
                          { id: "high", label: t("priority_high") },
                          { id: "medium", label: t("priority_medium") },
                          { id: "low", label: t("priority_low") },
                        ].map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setPriorityFilter(p.id)}
                            className={`px-2 py-1 text-[11.5px] font-bold rounded-lg text-left capitalize transition-colors ${
                              priorityFilter === p.id
                                ? "bg-[#0052CC]/15 text-[#0052CC] dark:text-sky-400 font-black"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Due Date Filter */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        {t("col_end_date")}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { id: "all", label: t("any_time") },
                          { id: "today", label: t("due_today") },
                          { id: "week", label: t("due_this_week") },
                          { id: "overdue", label: t("status_overdue") },
                        ].map((d) => (
                          <button
                            key={d.id}
                            onClick={() => setDateFilter(d.id)}
                            className={`px-2 py-1 text-[11.5px] font-bold rounded-lg text-left transition-colors ${
                              dateFilter === d.id
                                ? "bg-[#0052CC]/15 text-[#0052CC] dark:text-sky-400 font-black"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Department Filter */}
                    {departments.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                          {t("all_departments")}
                        </p>
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                          <button
                            onClick={() => setDepartmentFilter("all")}
                            className={`px-2 py-1 text-[11.5px] font-bold rounded-lg text-left transition-colors ${
                              departmentFilter === "all"
                                ? "bg-[#0052CC]/15 text-[#0052CC] font-black"
                                : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            {t("all_departments")}
                          </button>
                          {departments.map((dept) => (
                            <button
                              key={dept}
                              onClick={() => setDepartmentFilter(dept)}
                              className={`px-2 py-1 text-[11.5px] font-bold rounded-lg text-left transition-colors ${
                                departmentFilter === dept
                                  ? "bg-[#0052CC]/15 text-[#0052CC] font-black"
                                  : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reset Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() => {
                          setStatusFilter("all");
                          setPriorityFilter("all");
                          setDateFilter("all");
                          setDepartmentFilter("all");
                          setOnlyMyTasks(false);
                          setIsFilterOpen(false);
                        }}
                        className="text-[11px] font-extrabold text-[#0052CC] hover:underline cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Group Dropdown */}
              <div ref={groupRef} className="relative">
                <button
                  onClick={() => {
                    setIsGroupOpen(!isGroupOpen);
                    setIsFilterOpen(false);
                    setIsSortOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12.5px] font-bold transition-all cursor-pointer ${
                    groupBy !== "none"
                      ? "bg-[#0052CC]/10 text-[#0052CC] border-[#0052CC]/40"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>
                    {groupBy === "none" ? t("group_none") : `${t("group_by")}: ${groupBy}`}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {isGroupOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95">
                    <p className="px-3 py-1 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      {t("group_by")}
                    </p>
                    {[
                      { id: "none", label: t("group_none") },
                      { id: "status", label: t("group_status") },
                      { id: "priority", label: t("group_priority") },
                      { id: "department", label: t("group_department") },
                    ].map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setGroupBy(g.id as any);
                          setIsGroupOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12.5px] font-bold transition-colors flex items-center justify-between ${
                          groupBy === g.id
                            ? "bg-[#0052CC]/10 text-[#0052CC]"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{g.label}</span>
                        {groupBy === g.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div ref={sortRef} className="relative">
                <button
                  onClick={() => {
                    setIsSortOpen(!isSortOpen);
                    setIsFilterOpen(false);
                    setIsGroupOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-[12.5px] font-bold transition-all cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>
                    {t("sort_by")}: {sortBy === "latest" ? t("sort_newest") : sortBy === "oldest" ? t("sort_oldest") : sortBy === "dueDate" ? t("sort_due_date") : t("sort_priority")}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {isSortOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95">
                    {[
                      { id: "latest", label: t("sort_newest") },
                      { id: "oldest", label: t("sort_oldest") },
                      { id: "dueDate", label: t("sort_due_date") },
                      { id: "priority", label: t("sort_priority") },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSortBy(s.id);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-[12.5px] font-bold transition-colors flex items-center justify-between ${
                          sortBy === s.id
                            ? "bg-[#0052CC]/10 text-[#0052CC]"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>{s.label}</span>
                        {sortBy === s.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vertical Divider */}
              <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-750 mx-0.5" />

              {/* Reset Filters Button */}
              <button
                onClick={resetAllFilters}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12.5px] font-bold transition-all cursor-pointer ${
                  hasActiveFilters
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800"
                }`}
                title="Reset all search queries, filters, group by, and sorting"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              4. MAIN CONTENT AREA (Tab views: List, Summary, Board, Timeline, Reports)
             ========================================================================= */}

          {/* TAB 1: SUMMARY TAB */}
          {activeTab === "summary" && (
            <div className={`space-y-4 ${isFullscreen ? "flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1" : ""}`}>
              {/* 6 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total Tasks", value: metrics.total, id: "all", icon: CheckSquare, color: "text-[#5B5FEF] dark:text-[#818CF8]", bg: "bg-[#5B5FEF]/10 dark:bg-[#5B5FEF]/20" },
                  { label: "To Do", value: metrics.pending, id: "todo", icon: Clock, color: "text-[#42526E] dark:text-slate-300", bg: "bg-slate-100 dark:bg-[#151D2E]" },
                  { label: "In Progress", value: metrics.inProgress, id: "in_progress", icon: PlayCircle, color: "text-[#0052CC] dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/15" },
                  { label: "In Review", value: metrics.inReview, id: "review", icon: AlertCircle, color: "text-[#403294] dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/15" },
                  { label: "Done", value: metrics.completed, id: "completed", icon: CheckCircle2, color: "text-[#006644] dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
                  { label: "Overdue", value: metrics.overdue, id: "overdue", icon: Flame, color: "text-red-500 dark:text-rose-400", bg: "bg-red-100 dark:bg-rose-500/15" },
                ].map((card) => {
                  const Icon = card.icon;
                  const isActive = statusFilter === card.id;
                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        setStatusFilter(isActive ? "all" : card.id);
                        setActiveTab("list");
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all hover:-translate-y-1 ${
                        isActive
                          ? "border-[#5B5FEF] bg-[#DEEBFF]/30 dark:bg-[#5B5FEF]/20 shadow-md ring-2 ring-[#5B5FEF]"
                          : "border-slate-200/90 dark:border-[#1C2638] bg-white dark:bg-[#101623] shadow-xs hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-[22px] font-black text-slate-900 dark:text-white leading-none mb-1">
                        {card.value}
                      </h3>
                      <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400">
                        {card.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Summary Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Priority Breakdown */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3">
                  <h4 className="text-[14px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" /> Priority Breakdown
                  </h4>
                  {["urgent", "high", "medium", "low"].map((pri) => {
                    const count = tasks.filter((t) => t.priority === pri).length;
                    const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                    return (
                      <div key={pri} className="space-y-1">
                        <div className="flex justify-between text-[12.5px] font-bold">
                          <span className="capitalize text-slate-700 dark:text-slate-300">{pri}</span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pri === "urgent"
                                ? "bg-red-500"
                                : pri === "high"
                                ? "bg-orange-500"
                                : pri === "medium"
                                ? "bg-blue-500"
                                : "bg-slate-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status Breakdown */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3">
                  <h4 className="text-[14px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Status Distribution
                  </h4>
                  {[
                    { id: "todo", label: "To Do", count: metrics.pending, color: "bg-slate-400" },
                    { id: "in_progress", label: "In Progress", count: metrics.inProgress, color: "bg-sky-500" },
                    { id: "review", label: "In Review", count: metrics.inReview, color: "bg-purple-500" },
                    { id: "completed", label: "Done", count: metrics.completed, color: "bg-emerald-500" },
                  ].map((st) => {
                    const count = tasks.filter((t) => t.status === st.id).length;
                    const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                    return (
                      <div key={st.id} className="space-y-1">
                        <div className="flex justify-between text-[12.5px] font-bold">
                          <span className="text-slate-700 dark:text-slate-300">{st.label}</span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${st.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Shortcuts */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3">
                  <h4 className="text-[14px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#5B5FEF]" /> Workspace Actions
                  </h4>
                  <div className="space-y-2">
                    {canCreateTask && (
                      <button
                        onClick={() => setIsNewTaskModalOpen(true)}
                        className="w-full py-2 px-3 rounded-xl bg-[#0052CC] hover:bg-[#0065FF] text-white text-[13px] font-bold transition-all text-left flex items-center justify-between"
                      >
                        <span>+ Assign New Task</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab("list")}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-[13px] font-bold transition-all text-left flex items-center justify-between"
                    >
                      <span>Switch to Table List View</span>
                      <LayoutList className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab("board")}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-[13px] font-bold transition-all text-left flex items-center justify-between"
                    >
                      <span>Switch to Kanban Board</span>
                      <Kanban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOARD / KANBAN TAB */}
          {activeTab === "board" && (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${isFullscreen ? "flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1" : ""}`}>
              {[
                { id: "todo", title: "TO DO", border: "border-slate-300 dark:border-[#1C2638]", bg: "bg-slate-50 dark:bg-[#101522]" },
                { id: "in_progress", title: "IN PROGRESS", border: "border-sky-300 dark:border-sky-500/30", bg: "bg-sky-50/50 dark:bg-[#0B1B30]/60" },
                { id: "review", title: "IN REVIEW", border: "border-purple-300 dark:border-purple-500/30", bg: "bg-purple-50/50 dark:bg-[#1F1038]/60" },
                { id: "completed", title: "DONE", border: "border-emerald-300 dark:border-emerald-500/30", bg: "bg-emerald-50/50 dark:bg-[#08261B]/60" },
              ].map((col) => {
                const columnTasks = filteredTasks.filter((t) => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    className={`rounded-2xl border ${col.border} ${col.bg} p-3 flex flex-col h-[75vh]`}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80 dark:border-[#1C2638]">
                      <h4 className="text-[12px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {col.title}
                      </h4>
                      <span className="text-[11px] font-black bg-white dark:bg-[#151D2E] px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 shadow-xs">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Cards Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
                      {columnTasks.map((t) => {
                        const assignees = (t.assignedTo || []).filter(
                          (a): a is AssignedUser => typeof a !== "string",
                        );
                        return (
                          <div
                            key={t._id}
                            onClick={() => {
                              setViewingTask(t);
                              setIsViewModalOpen(true);
                            }}
                            className="bg-white dark:bg-[#151D2E] p-3 rounded-xl border border-slate-200/80 dark:border-[#1C2638] shadow-xs hover:shadow-md hover:border-[#5B5FEF]/50 transition-all cursor-pointer space-y-2 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold font-mono text-[#0052CC] bg-[#DEEBFF]/60 dark:bg-[#5B5FEF]/20 dark:text-[#818CF8] px-1.5 py-0.5 rounded">
                                {t.taskCode}
                              </span>
                              {renderJiraPriority(t.priority)}
                            </div>
                            <p className="text-[13px] font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-[#0052CC] transition-colors">
                              {t.title}
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-400">
                              <span>{formatJiraDate(t.dueDate)}</span>
                              {assignees.length > 0 ? (
                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-[#5B5FEF] flex items-center justify-center font-black text-[9px] overflow-hidden">
                                  {assignees[0].avatarUrl ? (
                                    <img src={assignees[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    `${assignees[0].firstName?.[0] || ""}${assignees[0].lastName?.[0] || ""}`
                                  )}
                                </div>
                              ) : (
                                <span>Unassigned</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: JIRA TABULAR LIST VIEW */}
          {activeTab === "list" && (
            <div
              className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-800 overflow-hidden ${
                isFullscreen ? "flex-1 min-h-0 flex flex-col" : ""
              }`}
            >
              {loading ? (
                <TasksSkeleton />
              ) : filteredTasks.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <FolderKanban className="w-7 h-7" />
                  </div>
                  <h3 className="text-[17px] font-black text-slate-900 dark:text-white mb-1">
                    No issues found
                  </h3>
                  <p className="text-[13px] text-slate-500 font-medium max-w-sm mx-auto">
                    {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || dateFilter !== "all"
                      ? "Try adjusting your search criteria or clear current filters."
                      : "No tasks have been assigned in this workspace yet."}
                  </p>
                </div>
              ) : (
                /* Jira Table */
                <div
                  className={`overflow-x-auto w-full custom-scrollbar transition-opacity duration-300 ${
                    isFullscreen ? "flex-1 overflow-y-auto" : ""
                  } ${refreshing ? "opacity-50 pointer-events-none" : "opacity-100"}`}
                >
                  <table className="w-full text-left border-collapse">
                    {/* Sticky Table Header */}
                    <thead>
                      <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-[#F4F5F7] dark:bg-slate-800/95 backdrop-blur-xs text-slate-600 dark:text-slate-300 sticky top-0 z-20">
                        {/* Checkbox */}
                        <th className="py-3.5 px-2.5 w-10 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.length === paginatedTasks.length && paginatedTasks.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-slate-300 text-[#0052CC] focus:ring-0 cursor-pointer"
                          />
                        </th>
                        <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-24 align-middle whitespace-nowrap">
                          {t("col_key")}
                        </th>
                        <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[170px] align-middle">
                          {t("col_summary")}
                        </th>
                        <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-32 align-middle whitespace-nowrap">
                          {t("col_assignee")}
                        </th>
                        <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-28 align-middle whitespace-nowrap">
                          {t("col_reporter")}
                        </th>
                        <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-24 align-middle whitespace-nowrap">
                          {t("col_priority")}
                        </th>
                        <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-28 align-middle whitespace-nowrap">
                          {t("col_status")}
                        </th>
                        <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-24 align-middle whitespace-nowrap">
                          {t("col_resolution")}
                        </th>
                        <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-28 align-middle whitespace-nowrap">
                          {t("col_assign_date")}
                        </th>
                        <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-28 align-middle whitespace-nowrap">
                          {t("col_end_date")}
                        </th>
                        <th className="sticky right-0 z-20 py-3.5 pr-4 pl-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-44 min-w-[165px] align-middle whitespace-nowrap bg-[#F4F5F7] dark:bg-slate-800/95 shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.35)]">
                          {t("col_actions")}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[13px]">
                      {/* Flat or Grouped Rendering */}
                      {(groupBy === "none" ? [ { groupTitle: null, tasks: paginatedTasks } ] : Object.entries(groupedTasks || {}).map(([title, gTasks]) => ({ groupTitle: title, tasks: gTasks }))).map(
                        (groupBlock, groupIndex) => {
                          const isCollapsed = groupBlock.groupTitle ? collapsedGroups[groupBlock.groupTitle] : false;

                          return (
                            <Fragment key={groupIndex}>
                              {/* Group Header Row if grouping is active */}
                              {groupBlock.groupTitle && (
                                <tr
                                  onClick={() => toggleGroup(groupBlock.groupTitle!)}
                                  className="bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-black select-none border-b border-slate-200 dark:border-slate-700"
                                >
                                  <td colSpan={11} className="py-2.5 px-4 text-[12px] text-slate-700 dark:text-slate-200 align-middle">
                                    <div className="flex items-center gap-2">
                                      <ChevronDown
                                        className={`w-3.5 h-3.5 transition-transform ${
                                          isCollapsed ? "-rotate-90" : ""
                                        }`}
                                      />
                                      <span className="uppercase tracking-wider">
                                        {groupBlock.groupTitle} ({groupBlock.tasks.length})
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {/* Task Rows */}
                              {!isCollapsed &&
                                groupBlock.tasks.map((task, rowIndex) => {
                                  const assignees = (task.assignedTo || []).filter(
                                    (a): a is AssignedUser => typeof a !== "string",
                                  );
                                  const reporter = getReporterInfo(task);
                                  const isSelected = selectedTaskIds.includes(task._id);
                                  const isOverdue =
                                    task.dueDate &&
                                    new Date(task.dueDate) < new Date() &&
                                    task.status !== "completed";

                                  return (
                                    <tr
                                      key={task._id}
                                      className={`border-b border-slate-200/85 dark:border-[#1C2638] transition-all duration-150 group ${
                                        activeMenuTaskId === task._id ? "relative z-40" : "relative z-0"
                                      } ${
                                        isSelected
                                          ? "bg-[#DEEBFF]/50 dark:bg-[#16233B]"
                                          : rowIndex % 2 === 0
                                          ? "bg-white dark:bg-[#101623]"
                                          : "bg-slate-50/75 dark:bg-[#0D121D]"
                                      } hover:bg-indigo-50/60 dark:hover:bg-[#161F32]`}
                                    >
                                      {/* Checkbox */}
                                      <td className="py-3 px-2.5 text-center align-middle w-10">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => toggleSelectTask(task._id)}
                                          className="rounded border-slate-300 dark:border-slate-600 text-[#5B5FEF] focus:ring-0 cursor-pointer"
                                        />
                                      </td>

                                      {/* Key (TSK-xxxx with icon) */}
                                      <td className="py-3 px-2 align-middle whitespace-nowrap w-24">
                                        <div
                                          onClick={() => {
                                            setViewingTask(task);
                                            setIsViewModalOpen(true);
                                          }}
                                          className="inline-flex items-center gap-1.5 cursor-pointer hover:underline text-[#0052CC] dark:text-[#818CF8] font-extrabold font-mono text-[12px]"
                                          title={t("view_details")}
                                        >
                                          <CheckSquare className="w-3.5 h-3.5 text-[#0052CC] dark:text-[#818CF8]" />
                                          <span>{task.taskCode}</span>
                                        </div>
                                      </td>

                                      {/* Summary / Title & Department */}
                                      <td className="py-3 px-2 align-middle min-w-[170px] max-w-[260px]">
                                        <div
                                          onClick={() => {
                                            setViewingTask(task);
                                            setIsViewModalOpen(true);
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-[#0052CC] transition-colors">
                                            {task.title}
                                          </p>
                                          {task.department && (
                                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                                              <Building2 className="w-3 h-3" /> {task.department}
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      {/* Assignee (Avatar + Name or Unassigned) */}
                                      <td className="py-3 px-2 align-middle whitespace-nowrap w-32">
                                        {assignees.length === 0 ? (
                                          <span className="text-[12px] font-bold text-slate-400">
                                            {t("unassigned")}
                                          </span>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center font-black text-[10px] shrink-0 overflow-hidden shadow-2xs">
                                              {assignees[0].avatarUrl ? (
                                                <img src={assignees[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                                              ) : (
                                                `${assignees[0].firstName?.[0] || ""}${assignees[0].lastName?.[0] || ""}`
                                              )}
                                            </div>
                                            <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[110px]">
                                              {assignees[0].firstName} {assignees[0].lastName}
                                            </span>
                                          </div>
                                        )}
                                      </td>

                                      {/* Reporter (Avatar + Name) */}
                                      <td className="py-3 px-2 align-middle whitespace-nowrap w-28">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-[#42526E] text-white flex items-center justify-center font-black text-[10px] shrink-0">
                                            {reporter.initials}
                                          </div>
                                          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                                            {reporter.name}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Priority */}
                                      <td className="py-3 px-2 align-middle whitespace-nowrap w-24">{renderJiraPriority(task.priority)}</td>

                                      {/* Status (Jira dropdown pill) */}
                                      <td className="py-3 px-2 align-middle whitespace-nowrap w-28">{renderJiraStatusPill(task)}</td>

                                      {/* Resolution / Status state */}
                                      <td className="py-3 px-2 align-middle whitespace-nowrap text-[12px] font-bold text-slate-500 w-24">
                                        {task.status === "completed" ? (
                                          <span className="text-emerald-600 dark:text-emerald-400">{t("resolved")}</span>
                                        ) : (
                                          <span>{t("unresolved")}</span>
                                        )}
                                      </td>

                                      {/* Task Assign Date */}
                                      <td className="py-3 px-2 align-middle whitespace-nowrap text-[12px] font-semibold text-slate-700 dark:text-slate-300 w-28">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-slate-800 dark:text-slate-200">
                                            {formatJiraDate(task.createdAt)}
                                          </span>
                                          <span className="text-[10.5px] text-slate-400 font-medium">
                                            {formatJiraTimeOnly(task.createdAt)}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Task End Date */}
                                      <td className="py-3 px-2 align-middle whitespace-nowrap text-[12px] font-semibold w-28">
                                        {task.dueDate ? (
                                          <div className="flex flex-col">
                                            <span className={`font-bold ${isOverdue ? "text-red-600 dark:text-red-400 font-extrabold" : "text-slate-800 dark:text-slate-200"}`}>
                                              {formatJiraDate(task.dueDate)}
                                            </span>
                                            {isOverdue ? (
                                              <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-1.5 py-0.5 rounded w-fit mt-0.5 border border-red-200 dark:border-red-900/40">
                                                {t("status_overdue")}
                                              </span>
                                            ) : (
                                              <span className="text-[10.5px] text-slate-400 font-medium">
                                                {formatJiraTimeOnly(task.dueDate)}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="flex flex-col">
                                            <span className="text-slate-400 dark:text-slate-500 font-medium text-[12px]">
                                              —
                                            </span>
                                          </div>
                                        )}
                                      </td>

                                      {/* Row End Actions (Professional Standard Order: View -> Edit -> Delete -> More) */}
                                      <td
                                        className={`sticky right-0 ${
                                          activeMenuTaskId === task._id ? "z-40 shadow-2xl" : "z-10"
                                        } py-3 pr-4 pl-2 text-right align-middle whitespace-nowrap w-44 min-w-[165px] shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.35)] transition-colors ${
                                          isSelected
                                            ? "bg-[#DEEBFF] dark:bg-[#16233B]"
                                            : rowIndex % 2 === 0
                                            ? "bg-white dark:bg-[#101623] group-hover:bg-[#F3F6FF] dark:group-hover:bg-[#161F32]"
                                            : "bg-slate-50 dark:bg-[#0D121D] group-hover:bg-[#F3F6FF] dark:group-hover:bg-[#161F32]"
                                        }`}
                                      >
                                        <div className="flex items-center justify-end gap-1.5 h-full">
                                          {/* 1. View Task (Indigo / Purple Theme) - Available to All */}
                                          <button
                                            onClick={() => {
                                              setViewingTask(task);
                                              setIsViewModalOpen(true);
                                            }}
                                            className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-500/25 border border-indigo-200/80 dark:border-indigo-500/30 shadow-2xs transition-all cursor-pointer"
                                            title={t("view_details")}
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </button>

                                          {/* 2. Edit Task (Sky / Blue Theme) */}
                                          {(isAdmin || isManager) && !task.isDeleted && (
                                            <button
                                              onClick={() => {
                                                setEditingTask(task);
                                                setIsEditModalOpen(true);
                                              }}
                                              className="p-1.5 rounded-lg text-sky-600 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-500/25 border border-sky-200/80 dark:border-sky-500/30 shadow-2xs transition-all cursor-pointer"
                                              title={t("edit_task")}
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}

                                          {/* 3. Restore Task (Emerald Theme) - Admin Only when soft-deleted */}
                                          {isAdmin && task.isDeleted && (
                                            <button
                                              onClick={() => handleRestoreTask(task)}
                                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-500/25 border border-emerald-200/80 dark:border-emerald-500/30 shadow-2xs transition-all cursor-pointer"
                                              title="Restore Soft-Deleted Deliverable"
                                            >
                                              <RotateCcw className="w-3.5 h-3.5" />
                                            </button>
                                          )}

                                          {/* 4. Delete Task (Rose / Red Danger Theme) - Admin Only when active */}
                                          {isAdmin && !task.isDeleted && (
                                            <button
                                              onClick={() => handleDeleteTask(task)}
                                              className="p-1.5 rounded-lg text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-500/25 border border-rose-200/80 dark:border-rose-500/30 shadow-2xs transition-all cursor-pointer"
                                              title={t("delete_task")}
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}

                                          {/* 4. 3-Dot Dropdown Menu (Neutral Slate Theme) */}
                                          <div
                                            ref={activeMenuTaskId === task._id ? menuRef : null}
                                            className={`relative ${activeMenuTaskId === task._id ? "z-50" : ""}`}
                                          >
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuTaskId((prev) => (prev === task._id ? null : task._id));
                                              }}
                                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white border border-slate-200/90 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
                                              title={t("quick_actions")}
                                            >
                                              <MoreHorizontal className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Dropdown Menu Box */}
                                            {activeMenuTaskId === task._id && (
                                              <div
                                                className={`absolute right-0 ${
                                                  paginatedTasks.length > 2 &&
                                                  paginatedTasks.findIndex((pt) => pt._id === task._id) >=
                                                    paginatedTasks.length - 2
                                                    ? "bottom-full mb-1.5 origin-bottom-right"
                                                    : "top-full mt-1.5 origin-top-right"
                                                } w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 text-left`}
                                              >
                                                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                  {t("quick_actions")}
                                                </div>

                                                {/* Copy Key */}
                                                <button
                                                  onClick={() => handleCopyKey(task)}
                                                  className="w-full px-3.5 py-2 text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                                                >
                                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                                  <span>{t("copy_key")} ({task.taskCode})</span>
                                                </button>

                                                {/* Copy Link */}
                                                <button
                                                  onClick={() => handleCopyLink(task)}
                                                  className="w-full px-3.5 py-2 text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                                                >
                                                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                                                  <span>{t("copy_link")}</span>
                                                </button>

                                                {/* View Details */}
                                                <button
                                                  onClick={() => {
                                                    setViewingTask(task);
                                                    setIsViewModalOpen(true);
                                                    setActiveMenuTaskId(null);
                                                  }}
                                                  className="w-full px-3.5 py-2 text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                                                >
                                                  <Eye className="w-3.5 h-3.5 text-[#5B5FEF]" />
                                                  <span>{t("view_details")}</span>
                                                </button>

                                                {/* Admin Only Actions */}
                                                {isAdmin && (
                                                  <>
                                                    {/* Duplicate Task */}
                                                    <button
                                                      onClick={() => handleDuplicateTask(task)}
                                                      className="w-full px-3.5 py-2 text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800"
                                                    >
                                                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                                                      <span>{t("duplicate_task")}</span>
                                                    </button>

                                                    {/* Quick Priority Submenu */}
                                                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                                    <div className="px-3 py-1 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                      {t("col_priority")}
                                                    </div>
                                                    {["urgent", "high", "medium", "low"].map((pri) => (
                                                      <button
                                                        key={pri}
                                                        onClick={() => handleQuickPriorityChange(task._id, pri)}
                                                        className="w-full px-3.5 py-1.5 text-[12px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors capitalize cursor-pointer"
                                                      >
                                                        <span>{t(`priority_${pri}`)}</span>
                                                        {task.priority === pri && <Check className="w-3 h-3 text-[#0052CC]" />}
                                                      </button>
                                                    ))}

                                                    {/* Delete Option */}
                                                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                                                    <button
                                                      onClick={() => handleDeleteTask(task)}
                                                      className="w-full px-3.5 py-2 text-[12.5px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                      <span>{t("delete_task")}</span>
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </Fragment>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Jira Table Footer */}
              <div className="shrink-0 px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-[#F4F5F7]/50 dark:bg-slate-800/40 flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Jira-Style + Create Button at bottom left / Selection badge */}
                <div className="flex items-center gap-3">
                  {selectedTaskIds.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-[#0052CC] dark:text-sky-400 bg-blue-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-sky-800/40">
                        {selectedTaskIds.length} {t("tasks_label")} selected
                      </span>
                      <button
                        onClick={handleClearSelection}
                        className="text-[12px] font-extrabold text-slate-400 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Clear selection"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  ) : isAdmin ? (
                    <button
                      onClick={() => setIsNewTaskModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[13px] font-black text-[#0052CC] hover:text-[#0065FF] transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t("create_task")}</span>
                    </button>
                  ) : null}
                </div>

                {/* Center: Page Size Selector (10, 20, 30, 50, 100) + Tasks Counter */}
                <div className="flex flex-wrap items-center gap-3 text-[12.5px] font-bold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span>{t("show_per_page")}</span>
                    <div className="relative inline-flex items-center">
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1 pr-6 text-[12px] font-bold outline-none hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#0052CC] cursor-pointer shadow-2xs transition-all"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                    </div>
                    <span>{t("per_page")}</span>
                  </div>

                  <span className="text-slate-300 dark:text-slate-700">•</span>

                  {/* Counter & Refresh */}
                  <div className="flex items-center gap-2">
                    <span>
                      {filteredTasks.length > 0
                        ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                            currentPage * itemsPerPage,
                            filteredTasks.length,
                          )} ${t("of")} ${filteredTasks.length}`
                        : `0 ${t("of")} 0`}
                    </span>
                    <button
                      onClick={() => fetchTasks(true)}
                      disabled={refreshing}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={t("refresh")}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#0052CC]" : ""}`} />
                    </button>

                    {/* Seamless Load More Button */}
                    {itemsPerPage < filteredTasks.length && (
                      <button
                        onClick={() => {
                          setItemsPerPage((prev) => Math.min(prev + 10, filteredTasks.length));
                          toast.success("Loaded more deliverables seamlessly", { id: "load-more-toast" });
                        }}
                        className="px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-[#5B5FEF] dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="Load 10 more tasks into view without reloading"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Load More</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Professional Windowed Smart Pagination Controls */}
                {!loading && filteredTasks.length > 0 && totalPages > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* First Page Button (when more than 4 pages) */}
                    {totalPages > 4 && (
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200/90 dark:border-[#1C2638] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A2438] hover:text-[#5B5FEF] dark:hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        title="First page (Page 1)"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                    )}

                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200/90 dark:border-[#1C2638] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A2438] hover:text-[#5B5FEF] dark:hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                      title={t("previous")}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Numbered Buttons with Smart Ellipsis Truncation */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalPages <= 7) return true;
                          if (p === 1 || p === totalPages) return true;
                          if (Math.abs(p - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((p, idx, arr) => {
                          const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                          return (
                            <div key={p} className="flex items-center gap-1">
                              {showEllipsis && (
                                <span className="px-1 text-slate-400 dark:text-slate-500 font-black text-xs select-none">
                                  •••
                                </span>
                              )}
                              <button
                                onClick={() => setCurrentPage(p)}
                                className={`min-w-[32px] h-8 px-2 rounded-xl text-[12px] font-black transition-all cursor-pointer flex items-center justify-center ${
                                  currentPage === p
                                    ? "bg-[#5B5FEF] text-white shadow-[0_2px_8px_rgba(91,95,239,0.35)] scale-105"
                                    : "bg-white dark:bg-[#151D2E] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-[#1C2638] hover:bg-slate-50 dark:hover:bg-[#1A2438] hover:border-[#5B5FEF]/40"
                                }`}
                              >
                                {p}
                              </button>
                            </div>
                          );
                        })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200/90 dark:border-[#1C2638] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A2438] hover:text-[#5B5FEF] dark:hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                      title={t("next")}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Last Page Button (when more than 4 pages) */}
                    {totalPages > 4 && (
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200/90 dark:border-[#1C2638] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A2438] hover:text-[#5B5FEF] dark:hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        title={`Last page (Page ${totalPages})`}
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* Quick Jump-to-Page Input when totalPages > 5 */}
                    {totalPages > 5 && (
                      <div className="hidden md:flex items-center gap-1.5 text-[12px] font-bold text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-[#1C2638]">
                        <span className="text-[11.5px] font-bold text-slate-400">Page</span>
                        <input
                          type="number"
                          min={1}
                          max={totalPages}
                          defaultValue={currentPage}
                          key={`jump-${currentPage}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = parseInt((e.target as HTMLInputElement).value, 10);
                              if (!isNaN(val) && val >= 1 && val <= totalPages) {
                                setCurrentPage(val);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1 && val <= totalPages) {
                              setCurrentPage(val);
                            }
                          }}
                          className="w-12 px-1 py-1 text-center bg-white dark:bg-[#151D2E] border border-slate-200/90 dark:border-[#1C2638] rounded-lg text-[12px] font-extrabold text-slate-800 dark:text-white outline-none focus:border-[#5B5FEF] focus:ring-1 focus:ring-[#5B5FEF]/20"
                          title="Type page number and press Enter"
                        />
                        <span className="text-[11px] text-slate-400 font-bold">of {totalPages}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: INTERACTIVE SPRINT TIMELINE & GANTT VIEW
             ========================================================================= */}
          {activeTab === "timeline" && (
            <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-800 p-5 space-y-5 ${isFullscreen ? "flex-1 min-h-0 overflow-y-auto custom-scrollbar" : ""}`}>
              {/* Timeline Header & Metrics */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-[17px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[#0052CC]" /> Sprint Schedule & Gantt Timeline
                  </h3>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    Interactive project milestone tracking across sprints, due dates, and completion timelines.
                  </p>
                </div>

                {/* Timeline Status Legend */}
                <div className="flex flex-wrap items-center gap-2.5 text-[11.5px] font-bold">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> To Do
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300">
                    <span className="w-2 h-2 rounded-full bg-[#0052CC]" /> In Progress
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
                    <span className="w-2 h-2 rounded-full bg-purple-500" /> In Review
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done
                  </span>
                </div>
              </div>

              {/* Gantt Timeline Board */}
              {loading ? (
                <TasksSkeleton />
              ) : filteredTasks.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#0052CC]" />
                  <p className="font-extrabold text-slate-700 dark:text-slate-300">No tasks in current timeline</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Timeline Days Header */}
                  <div className="hidden lg:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <div className="col-span-4">Task & Assignee</div>
                    <div className="col-span-2 text-center">Sprint Phase</div>
                    <div className="col-span-4 text-center">Timeline Duration & Progress</div>
                    <div className="col-span-2 text-right">Target Due Date</div>
                  </div>

                  {/* Task Timeline Items */}
                  <div className="space-y-2.5">
                    {paginatedTimelineTasks.map((t) => {
                      const assignees = (t.assignedTo || []).filter(
                        (a): a is AssignedUser => typeof a !== "string",
                      );
                      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed";
                      const isDone = t.status === "completed";
                      const isInProgress = t.status === "in_progress";
                      const isReview = t.status === "review";

                      const progressPercent = isDone
                        ? 100
                        : isReview
                        ? 80
                        : isInProgress
                        ? 45
                        : 10;

                      return (
                        <div
                          key={t._id}
                          onClick={() => {
                            setViewingTask(t);
                            setIsViewModalOpen(true);
                          }}
                          className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#0052CC]/60 hover:shadow-xs transition-all cursor-pointer group"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                            {/* Task Key & Title */}
                            <div className="col-span-4 flex items-center gap-2.5">
                              <span className="font-mono text-[11px] font-black text-[#0052CC] bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-200/60 shrink-0">
                                {t.taskCode}
                              </span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-[13px] text-slate-900 dark:text-white truncate group-hover:text-[#0052CC] transition-colors">
                                  {t.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                  <span>{t.department || "Engineering"}</span>
                                  {assignees.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate text-slate-600 dark:text-slate-300 font-semibold">
                                        {assignees[0].firstName} {assignees[0].lastName}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status Chip */}
                            <div
                              className="col-span-2 text-left lg:text-center"
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {renderJiraStatusPill(t)}
                            </div>

                            {/* Gantt Visual Progress Bar */}
                            <div className="col-span-4 space-y-1">
                              <div className="flex justify-between text-[10.5px] font-bold text-slate-500">
                                <span>Sprint Track</span>
                                <span>{progressPercent}% Complete</span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/60">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isDone
                                      ? "bg-emerald-500"
                                      : isOverdue
                                      ? "bg-rose-500"
                                      : isReview
                                      ? "bg-purple-500"
                                      : isInProgress
                                      ? "bg-[#0052CC]"
                                      : "bg-slate-400"
                                  }`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Due Date & Priority */}
                            <div className="col-span-2 flex items-center justify-between lg:justify-end gap-2 text-[12px]">
                              <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-md ${
                                isOverdue
                                  ? "bg-rose-50 text-rose-600 font-black border border-rose-200"
                                  : "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800"
                              }`}>
                                {formatJiraDate(t.dueDate)}
                              </span>
                              {renderJiraPriority(t.priority)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Timeline Pagination Footer */}
                  <div className="shrink-0 px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-[#F4F5F7]/50 dark:bg-slate-800/40 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 mt-4">
                    {/* Left: Deliverables Count Summary */}
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-bold text-slate-500 dark:text-slate-400">
                        {filteredTasks.length > 0
                          ? `Showing ${(timelinePage - 1) * timelineItemsPerPage + 1}-${Math.min(
                              timelinePage * timelineItemsPerPage,
                              filteredTasks.length,
                            )} of ${filteredTasks.length} timeline deliverables`
                          : "0 deliverables"}
                      </span>
                    </div>

                    {/* Center: Page Size Selector (5, 10, 15, 20, 50) */}
                    <div className="flex items-center gap-2 text-[12.5px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Show:</span>
                      <div className="relative inline-flex items-center">
                        <select
                          value={timelineItemsPerPage}
                          onChange={(e) => {
                            setTimelineItemsPerPage(Number(e.target.value));
                            setTimelinePage(1);
                          }}
                          className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1 pr-6 text-[12px] font-bold outline-none hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#0052CC] cursor-pointer shadow-2xs transition-all"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                      </div>
                      <span>per page</span>
                    </div>

                    {/* Right: Next / Previous and Numbered Buttons */}
                    {totalTimelinePages > 1 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* First Page Button */}
                        {totalTimelinePages > 4 && (
                          <button
                            onClick={() => setTimelinePage(1)}
                            disabled={timelinePage === 1}
                            className="p-1.5 rounded-lg border border-slate-200/90 dark:border-[#1C2638] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A2438] hover:text-[#0052CC] dark:hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                            title="First page"
                          >
                            <ChevronsLeft className="w-4 h-4" />
                          </button>
                        )}

                        {/* Previous Button */}
                        <button
                          onClick={() => setTimelinePage((p) => Math.max(1, p - 1))}
                          disabled={timelinePage === 1}
                          className="px-2.5 py-1 rounded-lg border border-slate-200/90 dark:border-[#1C2638] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A2438] hover:text-[#0052CC] dark:hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs text-[12px] font-bold flex items-center gap-1"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Previous</span>
                        </button>

                        {/* Numbered Buttons with Ellipsis */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalTimelinePages }, (_, i) => i + 1)
                            .filter((p) => {
                              if (totalTimelinePages <= 7) return true;
                              if (p === 1 || p === totalTimelinePages) return true;
                              if (Math.abs(p - timelinePage) <= 1) return true;
                              return false;
                            })
                            .map((p, idx, arr) => {
                              const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                              return (
                                <div key={p} className="flex items-center gap-1">
                                  {showEllipsis && (
                                    <span className="px-1 text-slate-400 dark:text-slate-500 font-black text-xs select-none">
                                      •••
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setTimelinePage(p)}
                                    className={`min-w-[32px] h-8 px-2 rounded-xl text-[12px] font-black transition-all cursor-pointer flex items-center justify-center ${
                                      timelinePage === p
                                        ? "bg-[#0052CC] text-white shadow-[0_2px_8px_rgba(0,82,204,0.35)] scale-105"
                                        : "bg-white dark:bg-[#151D2E] text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-[#1C2638] hover:bg-slate-50 dark:hover:bg-[#1A2438] hover:border-[#0052CC]/40"
                                    }`}
                                  >
                                    {p}
                                  </button>
                                </div>
                              );
                            })}
                        </div>

                        {/* Next Button */}
                        <button
                          onClick={() => setTimelinePage((p) => Math.min(totalTimelinePages, p + 1))}
                          disabled={timelinePage === totalTimelinePages}
                          className="px-2.5 py-1 rounded-lg border border-slate-200/90 dark:border-[#1C2638] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A2438] hover:text-[#0052CC] dark:hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs text-[12px] font-bold flex items-center gap-1"
                          title="Next page"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Last Page Button */}
                        {totalTimelinePages > 4 && (
                          <button
                            onClick={() => setTimelinePage(totalTimelinePages)}
                            disabled={timelinePage === totalTimelinePages}
                            className="p-1.5 rounded-lg border border-slate-200/90 dark:border-[#1C2638] bg-white dark:bg-[#151D2E] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A2438] hover:text-[#0052CC] dark:hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                            title="Last page"
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 5: FORMS, ANALYTICS & EXPORT REPORTS HUB
             ========================================================================= */}
          {activeTab === "reports" && (
            <div className={`space-y-5 ${isFullscreen ? "flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1" : ""}`}>
              {/* Reports Export Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Complete Workspace Task Audit */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B5FEF] flex items-center justify-center shadow-2xs">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h4 className="text-[15px] font-black text-slate-900 dark:text-white">
                      Complete Workspace Task Audit
                    </h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Download full spreadsheet with task IDs, assignees, dates, priority tags, and resolution histories.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Download Format ({tasks.length} tasks):
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => exportTasksToExcel(tasks, "Workspace_Task_Audit")}
                        className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[12px] font-extrabold flex flex-col items-center justify-center gap-1 border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Download as Microsoft Excel Spreadsheet (.xls)"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Excel</span>
                      </button>
                      <button
                        onClick={() => printTasksReport(tasks, "Complete Workspace Task Audit")}
                        className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[12px] font-extrabold flex flex-col items-center justify-center gap-1 border border-rose-200/70 dark:border-rose-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Print or Save as PDF Document"
                      >
                        <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => exportTasksToCSV(tasks, "Workspace_Task_Audit")}
                        className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[12px] font-extrabold flex flex-col items-center justify-center gap-1 border border-blue-200/70 dark:border-blue-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Download as CSV Data File"
                      >
                        <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Urgent & Incident Report */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shadow-2xs">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <h4 className="text-[15px] font-black text-slate-900 dark:text-white">
                      Urgent & Overdue Incidents
                    </h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Instant report containing all high-priority bottlenecks and overdue tasks requiring management review.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Download Format:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const incidents = tasks.filter(
                            (t) =>
                              t.priority === "urgent" ||
                              (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed"),
                          );
                          exportTasksToExcel(incidents, "Urgent_Incidents_Report");
                        }}
                        className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[12px] font-extrabold flex flex-col items-center justify-center gap-1 border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Download Incidents as Excel (.xls)"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Excel</span>
                      </button>
                      <button
                        onClick={() => {
                          const incidents = tasks.filter(
                            (t) =>
                              t.priority === "urgent" ||
                              (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed"),
                          );
                          printTasksReport(incidents, "Urgent & Overdue Incidents Report");
                        }}
                        className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[12px] font-extrabold flex flex-col items-center justify-center gap-1 border border-rose-200/70 dark:border-rose-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Print or Save Incidents as PDF"
                      >
                        <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => {
                          const incidents = tasks.filter(
                            (t) =>
                              t.priority === "urgent" ||
                              (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed"),
                          );
                          exportTasksToCSV(incidents, "Urgent_Incidents_Report");
                        }}
                        className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[12px] font-extrabold flex flex-col items-center justify-center gap-1 border border-blue-200/70 dark:border-blue-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Download Incidents as CSV"
                      >
                        <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Executive Summary / Print */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shadow-2xs">
                      <Printer className="w-5 h-5" />
                    </div>
                    <h4 className="text-[15px] font-black text-slate-900 dark:text-white">
                      Executive Printable Brief
                    </h4>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Generate print-ready executive summary suitable for sprint retrospectives and stakeholder updates.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Download Format:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => exportTasksToExcel(tasks, "Executive_Brief_Report")}
                        className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[12px] font-extrabold flex flex-col items-center justify-center gap-1 border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Download Executive Brief in Excel (.xls)"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Excel</span>
                      </button>
                      <button
                        onClick={() => printTasksReport(tasks, "Executive Printable Brief")}
                        className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[12px] font-extrabold flex flex-col items-center justify-center gap-1 border border-rose-200/70 dark:border-rose-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Print or Save Executive Brief as PDF"
                      >
                        <Printer className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => exportTasksToCSV(tasks, "Executive_Brief_Report")}
                        className="py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[12px] font-extrabold flex flex-col items-center justify-center gap-1 border border-blue-200/70 dark:border-blue-800/60 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title="Download Executive Brief in CSV"
                      >
                        <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Workload & Velocity Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Department Distribution Matrix */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-4">
                  <h4 className="text-[14.5px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0052CC]" /> Department Workload Matrix
                  </h4>
                  <div className="space-y-3">
                    {departments.map((dept) => {
                      const deptTasks = tasks.filter((t) => t.department === dept);
                      const doneTasks = deptTasks.filter((t) => t.status === "completed").length;
                      const pct = deptTasks.length > 0 ? Math.round((doneTasks / deptTasks.length) * 100) : 0;
                      return (
                        <div key={dept} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between items-center text-[12.5px] font-bold">
                            <span className="text-slate-900 dark:text-white">{dept}</span>
                            <span className="text-slate-500">
                              {doneTasks} / {deptTasks.length} tasks ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0052CC] rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sprint Efficiency Metrics */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-4">
                  <h4 className="text-[14.5px] font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> Sprint Delivery Intelligence
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Resolution Rate</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {tasks.length > 0 ? Math.round((metrics.completed / tasks.length) * 100) : 0}%
                      </p>
                      <p className="text-[11px] text-emerald-600 font-bold">✓ {metrics.completed} resolved</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Active In-Flight</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {metrics.inProgress + metrics.inReview}
                      </p>
                      <p className="text-[11px] text-[#0052CC] font-bold">⚡ Across all teams</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Overdue Critical</p>
                      <p className="text-2xl font-black text-rose-600">
                        {metrics.overdue}
                      </p>
                      <p className="text-[11px] text-rose-500 font-bold">Needs attention</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase">Pending Backlog</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">
                        {metrics.pending}
                      </p>
                      <p className="text-[11px] text-slate-500 font-bold">Ready for pickup</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= BOTTOM STATUS / SUMMARY BAR ================= */}
        {!isFullscreen && (
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-[12.5px] font-medium text-slate-600 dark:text-slate-400 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span>
                {t("showing")} <strong className="text-slate-900 dark:text-white font-bold">{filteredTasks.length}</strong> {t("of")}{" "}
                <strong className="text-slate-900 dark:text-white font-bold">{tasks.length}</strong> {t("tasks_label")}
              </span>
              {hasActiveFilters && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-200/60 dark:border-amber-900/40">
                  Filtered view
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="text-[12px] font-bold text-[#0052CC] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear all filters</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          FLOATING BULK ACTION BAR (BOTH EMPLOYEE AND ADMIN)
         ========================================================================= */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/90 flex items-center gap-3 max-w-[95vw] flex-wrap justify-center">
            {/* Selection Counter Badge */}
            <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
              <span className="px-2.5 py-1 rounded-xl bg-[#0052CC] dark:bg-[#5B5FEF] text-white font-extrabold text-[12px] flex items-center gap-1.5 shadow-xs">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{selectedTaskIds.length} Selected</span>
              </span>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 1. Export Selected to CSV */}
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[12.5px] font-bold transition-all cursor-pointer shadow-2xs"
                title="Export selected tasks to CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export ({selectedTaskIds.length})</span>
              </button>

              {/* 2. Quick Status Update Buttons (Both Employee & Admin can update status) */}
              <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                <span className="text-[11px] font-bold text-slate-400 px-1.5">Set:</span>
                <button
                  onClick={() => handleBulkStatusChange("todo")}
                  disabled={bulkLoading}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all cursor-pointer"
                >
                  To Do
                </button>
                <button
                  onClick={() => handleBulkStatusChange("in_progress")}
                  disabled={bulkLoading}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-sky-900/60 hover:bg-sky-800 text-sky-300 transition-all cursor-pointer"
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleBulkStatusChange("review")}
                  disabled={bulkLoading}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-purple-900/60 hover:bg-purple-800 text-purple-300 transition-all cursor-pointer"
                >
                  Review
                </button>
                <button
                  onClick={() => handleBulkStatusChange("completed")}
                  disabled={bulkLoading}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>

              {/* 3. Bulk Delete (Admin Only) */}
              {isAdmin && (
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[12.5px] font-bold transition-all cursor-pointer shadow-2xs"
                  title="Delete selected tasks"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}

              {/* 4. Clear Selection Button (Both Employee & Admin) */}
              <div className="pl-1 border-l border-slate-700">
                <button
                  onClick={handleClearSelection}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-[12.5px] font-bold transition-all cursor-pointer"
                  title="Clear selected tasks"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Selection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal (Admin Only) */}
      {isAdmin && isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-[18px] font-black text-slate-900 dark:text-white">
                Delete {selectedTaskIds.length} Tasks?
              </h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <strong className="text-slate-900 dark:text-white">
                  {selectedTaskIds.length} selected task{selectedTaskIds.length > 1 ? "s" : ""}
                </strong>? This action cannot be undone.
              </p>
            </div>

            <div className="max-h-32 overflow-y-auto custom-scrollbar p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
              {selectedTasks.map((t) => (
                <div key={t._id} className="text-[12px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between px-2 py-1">
                  <span className="truncate max-w-[240px]">{t.title}</span>
                  <span className="text-[#0052CC] text-[11px] font-mono">{t.taskCode}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[13px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={handleConfirmBulkDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* New Task Modal */}
      {canCreateTask && (
        <NewTaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          onSuccess={() => fetchTasks()}
        />
      )}

      {/* Edit Task Modal - Admin & Manager */}
      {(isAdmin || isManager) && (
        <EditTaskModal
          task={editingTask}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTask(null);
          }}
          onSuccess={() => fetchTasks()}
          onDelete={(deletedId) => {
            setTasks((prev) => prev.filter((t) => t._id !== deletedId));
          }}
        />
      )}

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={viewingTask}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingTask(null);
        }}
        onStatusUpdated={(taskId, newStatus) => {
          setTasks((prev) =>
            prev.map((t) => (t._id === taskId ? { ...t, status: newStatus as any } : t)),
          );
        }}
        onTaskUpdated={(updatedTask) => {
          setTasks((prev) =>
            prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
          );
          setViewingTask(updatedTask);
        }}
        onEdit={(isAdmin || isManager) ? (task) => {
          setIsViewModalOpen(false);
          setViewingTask(null);
          setEditingTask(task);
          setIsEditModalOpen(true);
        } : undefined}
      />
    </div>
  );
};
