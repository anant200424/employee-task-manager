"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  Mail,
  Phone,
  Edit2,
  Trash2,
  Loader2,
  Search,
  Filter,
  X,
  Download,
  Lock,
  Unlock,
  Eye,
  Briefcase,
  Building2,
  Users as UsersIcon,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
  RefreshCw,
  MoreHorizontal,
  Copy,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { exportEmployeesToCSV } from "@/lib/exportUtils";
import { EmployeeDetailModal } from "@/features/employees/EmployeeDetailModal";
import { EditEmployeeModal } from "@/features/employees/EditEmployeeModal";
import { EmployeesSkeleton } from "@/components/ui/Skeleton";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

interface UserItem {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  employeeId: string;
  email: string;
  phone: string;
  status: string;
  isBlocked: boolean;
  blockedAt?: string;
  blockedReason?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export default function EmployeesPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View Mode: 'list' (Table) or 'grid' (Cards)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Search & Filters & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "active" | "blocked">("all");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "newest" | "oldest" | "department">("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Selected row checkboxes
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // 3-Dot Dropdown Menu Active User ID
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  // Detail Modal
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Edit Modal
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Block Confirmation Modal
  const [blockConfirmUser, setBlockConfirmUser] = useState<UserItem | null>(null);
  const [blockReason, setBlockReason] = useState("Administrative suspension by manager");
  const [blockingId, setBlockingId] = useState<string | null>(null);

  // Bulk Actions State
  const [isBulkBlockModalOpen, setIsBulkBlockModalOpen] = useState(false);
  const [bulkBlockReason, setBulkBlockReason] = useState("Administrative suspension by manager");
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Click outside to dismiss menus
  const sortRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sortRef.current && !sortRef.current.contains(target)) {
        setIsSortOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setActiveMenuUserId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async (showToast = false) => {
    try {
      if (!showToast) setLoading(true);
      else setRefreshing(true);

      const res = await api.get("/users");
      if (res.data?.data?.users) {
        const mappedUsers: UserItem[] = res.data.data.users
          .filter((u: any) => {
            const role = String(u.role || "").toLowerCase().trim();
            return role !== "admin" && !role.includes("admin") && !role.includes("superadmin");
          })
          .map((u: any) => ({
            id: u._id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Employee",
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            role: u.role || "Software Engineer",
            department: u.department || "Engineering",
            employeeId: u.employeeId || "EMP-1042",
            email: u.email || "",
            phone: `${u.dialCode || ""} ${u.phoneNumber || ""}`.trim() || "No phone",
            status: u.isBlocked ? "Blocked" : "Active",
            isBlocked: Boolean(u.isBlocked),
            blockedAt: u.blockedAt,
            blockedReason: u.blockedReason,
            avatarUrl: u.avatarUrl,
            createdAt: u.createdAt,
          }));
        setUsers(mappedUsers);
        if (showToast) toast.success("Employee roster refreshed!");
      }
    } catch (err) {
      console.error("Failed to load employees directory:", err);
      toast.error("Failed to load employees directory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // Block Action
  const handleConfirmBlock = async () => {
    if (!blockConfirmUser) return;
    if (blockConfirmUser.role === "admin") {
      toast.error("Administrator accounts cannot be blocked.");
      setBlockConfirmUser(null);
      return;
    }

    try {
      setBlockingId(blockConfirmUser.id);
      await api.patch(`/users/${blockConfirmUser.id}/block`, {
        reason: blockReason || "Administrative suspension by manager",
      });
      toast.success(`${blockConfirmUser.name} has been blocked & immediately logged out.`);
      setBlockConfirmUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to block employee.");
    } finally {
      setBlockingId(null);
    }
  };

  // Unblock Action
  const handleUnblockUser = async (user: UserItem) => {
    try {
      setBlockingId(user.id);
      await api.patch(`/users/${user.id}/unblock`);
      toast.success(`${user.name} has been unblocked. Full access restored.`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unblock employee.");
    } finally {
      setBlockingId(null);
    }
  };

  // Delete Action
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    if (deleteConfirmUser.role === "admin") {
      toast.error("Administrator accounts cannot be deleted.");
      setDeleteConfirmUser(null);
      return;
    }

    try {
      setDeletingId(deleteConfirmUser.id);
      await api.delete(`/users/${deleteConfirmUser.id}`);
      toast.success(`Employee ${deleteConfirmUser.name} has been permanently deleted.`);
      setDeleteConfirmUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete employee.");
    } finally {
      setDeletingId(null);
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
    setActiveMenuUserId(null);
  };

  // Selected users helper
  const selectedUsers = useMemo(() => {
    return users.filter((u) => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  const hasBlockedInSelection = useMemo(() => {
    return selectedUsers.some((u) => u.isBlocked);
  }, [selectedUsers]);

  const hasActiveInSelection = useMemo(() => {
    return selectedUsers.some((u) => !u.isBlocked);
  }, [selectedUsers]);

  // Bulk Actions
  const handleBulkExport = () => {
    if (selectedUsers.length === 0) return;
    exportEmployeesToCSV(selectedUsers);
    toast.success(`Exported ${selectedUsers.length} selected employee(s) to CSV!`);
  };

  const handleClearSelection = () => {
    setSelectedUserIds([]);
    toast.success("Selection cleared");
  };

  const handleConfirmBulkBlock = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkLoading(true);
    try {
      const validTargets = selectedUsers.filter((u) => u.role !== "admin" && !u.isBlocked);
      if (validTargets.length === 0) {
        toast.error("No active eligible employees to block.");
        setIsBulkBlockModalOpen(false);
        return;
      }

      let successCount = 0;
      for (const user of validTargets) {
        try {
          await api.patch(`/users/${user.id}/block`, {
            reason: bulkBlockReason || "Administrative suspension by manager",
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to block ${user.id}:`, e);
        }
      }

      toast.success(`Successfully blocked & suspended ${successCount} employee(s).`);
      setIsBulkBlockModalOpen(false);
      setSelectedUserIds([]);
      await fetchUsers();
    } catch (err: any) {
      toast.error("Failed to complete bulk block operation.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkUnblock = async () => {
    const blockedSelected = selectedUsers.filter((u) => u.isBlocked);
    if (blockedSelected.length === 0) {
      toast.error("None of the selected employees are blocked.");
      return;
    }

    setBulkLoading(true);
    try {
      let successCount = 0;
      for (const user of blockedSelected) {
        try {
          await api.patch(`/users/${user.id}/unblock`);
          successCount++;
        } catch (e) {
          console.error(`Failed to unblock ${user.id}:`, e);
        }
      }

      toast.success(`Successfully unblocked ${successCount} employee(s). Full access restored.`);
      setSelectedUserIds([]);
      await fetchUsers();
    } catch (err: any) {
      toast.error("Failed to complete bulk unblock operation.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    setBulkLoading(true);
    try {
      const validTargets = selectedUsers.filter((u) => u.role !== "admin");
      if (validTargets.length === 0) {
        toast.error("Administrator accounts cannot be deleted.");
        setIsBulkDeleteModalOpen(false);
        return;
      }

      let successCount = 0;
      for (const user of validTargets) {
        try {
          await api.delete(`/users/${user.id}`);
          successCount++;
        } catch (e) {
          console.error(`Failed to delete ${user.id}:`, e);
        }
      }

      toast.success(`Permanently deleted ${successCount} employee record(s).`);
      setIsBulkDeleteModalOpen(false);
      setSelectedUserIds([]);
      await fetchUsers();
    } catch (err: any) {
      toast.error("Failed to complete bulk delete operation.");
    } finally {
      setBulkLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.role.toLowerCase().includes(q) ||
          user.department.toLowerCase().includes(q) ||
          user.employeeId.toLowerCase().includes(q);

        const matchesDepartment =
          departmentFilter === "All" ||
          user.department.toLowerCase() === departmentFilter.toLowerCase();

        const matchesTab =
          statusTab === "all" ||
          (statusTab === "active" && !user.isBlocked) ||
          (statusTab === "blocked" && user.isBlocked);

        return matchesSearch && matchesDepartment && matchesTab;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (sortBy === "department") return a.department.localeCompare(b.department);
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        // newest default
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [users, searchQuery, statusTab, departmentFilter, sortBy]);

  const activeCount = users.filter((u) => !u.isBlocked).length;
  const blockedCount = users.filter((u) => u.isBlocked).length;

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredUsers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, statusTab, sortBy, viewMode, itemsPerPage]);

  // Checkbox Selection
  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedUsers.map((u) => u.id));
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-12 transition-colors duration-300">
      <Topbar
        title={t("emp_directory_title", "Employee Directory")}
        subtitle={t("emp_directory_subtitle", "Review employee roster, manage roles, edit credentials, and control access permissions.")}
        icon={<UsersIcon className="w-5 h-5 text-[#5B5FEF]" />}
      />

      <main className="px-4 sm:px-6 lg:px-8 space-y-5 max-w-[1600px] mx-auto mt-6 animate-in fade-in duration-300">
        {/* =========================================================================
            1. TOP BAR: Status Tabs & Export / Refresh Actions
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setStatusTab("all")}
              className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                statusTab === "all"
                  ? "bg-[#5B5FEF] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <UsersIcon className="w-4 h-4" />
              <span>{t("all_members", "All Members")}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                statusTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setStatusTab("active")}
              className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                statusTab === "active"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              <span>{t("active_staff", "Active Staff")}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                statusTab === "active" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => setStatusTab("blocked")}
              className={`px-4 py-2 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                statusTab === "blocked"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t("blocked_staff", "Blocked / Suspended")}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                statusTab === "blocked" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                {blockedCount}
              </span>
            </button>
          </div>

          {/* Action Tools: Refresh, Export, View Mode */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Refresh */}
            <button
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
              title="Refresh employee roster"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#5B5FEF]" : ""}`} />
            </button>

            {/* Export CSV */}
            <button
              onClick={() => exportEmployeesToCSV(filteredUsers)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-[13px] font-extrabold transition-all cursor-pointer shadow-xs shrink-0"
              title="Export Employee Directory to CSV"
            >
              <Download className="w-4 h-4 text-[#5B5FEF]" />
              <span>{t("export_csv", "Export CSV")}</span>
            </button>

            {/* View Mode Toggle: List View vs Grid / Cards View */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 shadow-2xs">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-900 text-[#5B5FEF] shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Table List View"
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden md:inline font-black">List</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-900 text-[#5B5FEF] shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden md:inline font-black">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. SEARCH & FILTER TOOLBAR
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-800 gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t("search_emp_placeholder", "Search by name, email, employee ID, role...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white outline-none focus:border-[#5B5FEF] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter & Sort Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            {/* Department Filter */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-transparent text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="All">{t("all_depts", "All Departments")}</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Sort:{" "}
                  {sortBy === "name-asc"
                    ? "Name (A-Z)"
                    : sortBy === "name-desc"
                    ? "Name (Z-A)"
                    : sortBy === "department"
                    ? "Department"
                    : sortBy === "oldest"
                    ? "Oldest First"
                    : "Newest First"}
                </span>
              </button>
              {isSortOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {[
                    { id: "newest", label: t("sort_newest", "Newest First") },
                    { id: "oldest", label: t("sort_oldest", "Oldest First") },
                    { id: "name-asc", label: t("sort_name_asc", "Name (A-Z)") },
                    { id: "name-desc", label: t("sort_name_desc", "Name (Z-A)") },
                    { id: "department", label: t("sort_department", "Department") },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSortBy(s.id as any);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-[12.5px] font-bold transition-colors flex items-center justify-between ${
                        sortBy === s.id
                          ? "bg-[#5B5FEF]/10 text-[#5B5FEF]"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{s.label}</span>
                      {sortBy === s.id && <span className="text-[#5B5FEF] font-black">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. MAIN CONTENT: LIST VIEW (TABLE) OR GRID VIEW (CARDS)
           ========================================================================= */}
        {loading ? (
          <EmployeesSkeleton viewMode={viewMode} />
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 text-slate-400">
            <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#5B5FEF]" />
            <p className="text-base font-extrabold text-slate-700 dark:text-slate-200">
              No employees match your search or filter.
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try changing your search query, switching between All/Active/Blocked tabs, or resetting filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusTab("all");
                setDepartmentFilter("All");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#5B5FEF] text-white text-[12.5px] font-extrabold shadow-xs hover:bg-[#4d51db] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "list" ? (
          /* =========================================================================
             VIEW MODE 1: JIRA / TASKS STYLE TABULAR LIST VIEW (CLEAN & BALANCED)
             ========================================================================= */
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-800 w-full min-h-[420px] flex flex-col justify-between">
            <div className="overflow-x-auto w-full custom-scrollbar flex-1 pb-20">
              <table className="w-full text-left border-collapse">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-[#F4F5F7] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                    {/* Select All Checkbox */}
                    <th className="py-3.5 px-3 w-10 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={
                          selectedUserIds.length === paginatedUsers.length &&
                          paginatedUsers.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-[#5B5FEF] focus:ring-0 cursor-pointer"
                      />
                    </th>

                    {/* Employee Profile (Name + Email below it) */}
                    <th className="py-3.5 px-3 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[220px] align-middle">
                      {t("col_employee", "EMPLOYEE")}
                    </th>

                    {/* Employee ID */}
                    <th className="py-3.5 px-3 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-28 text-center align-middle whitespace-nowrap">
                      {t("col_id_code", "ID CODE")}
                    </th>

                    {/* Department */}
                    <th className="py-3.5 px-3 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-36 align-middle whitespace-nowrap">
                      {t("col_department", "DEPARTMENT")}
                    </th>

                    {/* Role / Job Title */}
                    <th className="py-3.5 px-3 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-44 align-middle whitespace-nowrap">
                      {t("col_role", "ROLE / TITLE")}
                    </th>

                    {/* Phone */}
                    <th className="py-3.5 px-3 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-36 align-middle whitespace-nowrap">
                      {t("col_phone", "PHONE")}
                    </th>

                    {/* Status Pill */}
                    <th className="py-3.5 px-3 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-28 text-center align-middle whitespace-nowrap">
                      {t("col_status", "STATUS")}
                    </th>

                    {/* Actions Column */}
                    <th className="py-3.5 px-3 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-44 align-middle whitespace-nowrap">
                      {t("col_actions", "ACTIONS")}
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[13px]">
                  {paginatedUsers.map((user, index) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const isMenuOpen = activeMenuUserId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-slate-200/85 dark:border-slate-800/80 transition-all duration-150 group ${
                          isSelected
                            ? "bg-[#EEF2FF] dark:bg-indigo-950/40"
                            : index % 2 === 0
                            ? "bg-white dark:bg-slate-900"
                            : "bg-[#F8FAFC] dark:bg-[#131B2A]"
                        } hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 ${
                          isMenuOpen ? "relative z-40" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center align-middle w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectUser(user.id)}
                            className="rounded border-slate-300 text-[#5B5FEF] focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Employee Avatar & Name + Email below */}
                        <td className="py-3 px-3 align-middle min-w-[220px]">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsDetailModalOpen(true);
                              }}
                              className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-2xs border border-slate-200 dark:border-slate-700 cursor-pointer hover:ring-2 hover:ring-[#5B5FEF] transition-all"
                            >
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4
                                onClick={() => {
                                  setSelectedUserId(user.id);
                                  setIsDetailModalOpen(true);
                                }}
                                className="font-extrabold text-[13.5px] text-slate-900 dark:text-white group-hover:text-[#5B5FEF] transition-colors truncate cursor-pointer hover:underline"
                              >
                                {user.name}
                              </h4>
                              <p
                                onClick={() => handleCopy(user.email, "Email")}
                                className="text-[11.5px] text-slate-400 font-medium truncate flex items-center gap-1 hover:text-[#5B5FEF] cursor-pointer"
                                title="Click to copy email"
                              >
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{user.email}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Employee ID */}
                        <td className="py-3 px-3 text-center align-middle whitespace-nowrap w-28">
                          <span
                            onClick={() => handleCopy(user.employeeId, "Employee ID")}
                            className="inline-flex items-center justify-center font-mono font-bold text-[11.5px] px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#5B5FEF] cursor-pointer"
                            title="Click to copy ID"
                          >
                            {user.employeeId}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap w-36">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5 text-[#5B5FEF]" />
                            <span>{user.department}</span>
                          </span>
                        </td>

                        {/* Role / Job Title */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap w-44">
                          <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-800 dark:text-slate-200">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{user.role}</span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-3 align-middle whitespace-nowrap w-36">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{user.phone}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center align-middle whitespace-nowrap w-28">
                          {user.isBlocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-rose-500 text-white shadow-2xs">
                              <Lock className="w-2.5 h-2.5" /> BLOCKED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
                            </span>
                          )}
                        </td>

                        {/* Actions (5 Distinct Professional Buttons in Standard Order: View -> Edit -> Block/Unlock -> Delete -> More) */}
                        <td className="py-3 px-3 text-right align-middle whitespace-nowrap w-44">
                          <div className="flex items-center justify-end gap-1.5 h-full">
                            {/* 1. View Details (Indigo / Purple Theme) */}
                            <button
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsDetailModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-900/40 shadow-2xs transition-all cursor-pointer"
                              title="View Employee Details & Tasks"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. Edit Employee (Sky / Blue Theme) */}
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-900/40 shadow-2xs transition-all cursor-pointer"
                              title="Edit Employee Credentials"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* 3. Block / Unblock (Amber / Emerald Theme) */}
                            {user.isBlocked ? (
                              <button
                                onClick={() => handleUnblockUser(user)}
                                disabled={blockingId === user.id}
                                className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs transition-all cursor-pointer"
                                title="Unblock Employee (Restore Access)"
                              >
                                {blockingId === user.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Unlock className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => setBlockConfirmUser(user)}
                                disabled={blockingId === user.id || user.role === "admin"}
                                className={`p-1.5 rounded-lg transition-all shadow-2xs cursor-pointer ${
                                  user.role === "admin"
                                    ? "text-slate-300 dark:text-slate-700 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40 cursor-not-allowed"
                                    : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-900/40"
                                }`}
                                title={
                                  user.role === "admin"
                                    ? "Admins cannot be blocked"
                                    : "Block / Suspend Employee"
                                }
                              >
                                {blockingId === user.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* 4. Delete Employee (Rose / Red Theme) */}
                            <button
                              onClick={() => setDeleteConfirmUser(user)}
                              disabled={user.role === "admin"}
                              className={`p-1.5 rounded-lg transition-all shadow-2xs cursor-pointer ${
                                user.role === "admin"
                                  ? "text-slate-300 dark:text-slate-700 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40 cursor-not-allowed"
                                  : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/40"
                              }`}
                              title={
                                user.role === "admin"
                                  ? "Admins cannot be deleted"
                                  : "Delete Employee"
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* 5. 3-Dot More Actions (Neutral Slate Theme) */}
                            <div className={`relative ${isMenuOpen ? "z-50" : ""}`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuUserId(isMenuOpen ? null : user.id);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white border border-slate-200/90 dark:border-slate-700 shadow-2xs transition-all cursor-pointer"
                                title="More Actions"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>

                              {isMenuOpen && (
                                <div
                                  ref={menuRef}
                                  className={`absolute right-0 ${
                                    index >= paginatedUsers.length - 2 && paginatedUsers.length > 2
                                      ? "bottom-full mb-1.5 origin-bottom-right"
                                      : "top-full mt-1.5 origin-top-right"
                                  } w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 text-left`}
                                >
                                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                    Quick Options
                                  </div>

                                  {/* Copy ID */}
                                  <button
                                    onClick={() => handleCopy(user.employeeId, "Employee ID")}
                                    className="w-full px-3.5 py-2 text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copy ID ({user.employeeId})</span>
                                  </button>

                                  {/* Copy Email */}
                                  <button
                                    onClick={() => handleCopy(user.email, "Email")}
                                    className="w-full px-3.5 py-2 text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copy Email</span>
                                  </button>

                                  {/* View Tasks */}
                                  <button
                                    onClick={() => {
                                      setSelectedUserId(user.id);
                                      setIsDetailModalOpen(true);
                                      setActiveMenuUserId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-[#5B5FEF]" />
                                    <span>View Performance</span>
                                  </button>

                                  {/* Edit */}
                                  <button
                                    onClick={() => {
                                      setEditingUser(user);
                                      setIsEditModalOpen(true);
                                      setActiveMenuUserId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-[12.5px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-sky-500" />
                                    <span>Edit Credentials</span>
                                  </button>

                                  {/* Block / Unblock */}
                                  {user.role !== "admin" && (
                                    <button
                                      onClick={() => {
                                        setActiveMenuUserId(null);
                                        user.isBlocked ? handleUnblockUser(user) : setBlockConfirmUser(user);
                                      }}
                                      className={`w-full px-3.5 py-2 text-[12.5px] font-bold flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800 ${
                                        user.isBlocked
                                          ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                          : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                      }`}
                                    >
                                      {user.isBlocked ? (
                                        <>
                                          <Unlock className="w-3.5 h-3.5" />
                                          <span>Unblock Account</span>
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="w-3.5 h-3.5" />
                                          <span>Suspend Access</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {/* Delete */}
                                  {user.role !== "admin" && (
                                    <button
                                      onClick={() => {
                                        setActiveMenuUserId(null);
                                        setDeleteConfirmUser(user);
                                      }}
                                      className="w-full px-3.5 py-2 text-[12.5px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-800"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete Account</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
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
              {/* Left Summary / Selection */}
              <div className="flex items-center gap-3">
                {selectedUserIds.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-bold text-[#5B5FEF] bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800/40">
                      {selectedUserIds.length}{" "}
                      {selectedUserIds.length > 1
                        ? t("members_selected", "members selected")
                        : t("member_selected", "member selected")}
                    </span>
                    <button
                      onClick={handleClearSelection}
                      className="text-[12px] font-extrabold text-slate-400 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                      title={t("clear_selection", "Clear selection")}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{t("clear", "Clear")}</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[12.5px] font-bold text-slate-500">
                    {t("total_personnel", "Total Personnel:")}{" "}
                    <strong className="text-slate-900 dark:text-white">{filteredUsers.length}</strong>
                  </span>
                )}
              </div>

              {/* Center: Row Size Selector (5, 10, 20, 30, 50, 100) + Counter */}
              <div className="flex flex-wrap items-center gap-3 text-[12.5px] font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span>Show:</span>
                  <div className="relative inline-flex items-center">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1 pr-6 text-[12px] font-bold outline-none hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#5B5FEF] cursor-pointer shadow-2xs transition-all"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
                  </div>
                  <span>per page</span>
                </div>

                <span className="text-slate-300 dark:text-slate-700">•</span>

                {/* Counter & Refresh */}
                <div className="flex items-center gap-1.5">
                  <span>
                    {filteredUsers.length > 0
                      ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                          currentPage * itemsPerPage,
                          filteredUsers.length
                        )} of ${filteredUsers.length}`
                      : `0 of 0`}
                  </span>
                  <button
                    onClick={() => fetchUsers(true)}
                    disabled={refreshing}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Refresh roster"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#5B5FEF]" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Right: Numbered Pagination Controls */}
              {totalPages > 1 ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page numbers */}
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
                        <div key={p} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-1 text-slate-400 font-bold">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`min-w-[28px] h-7 px-2 rounded-lg text-[12px] font-extrabold transition-all cursor-pointer ${
                              currentPage === p
                                ? "bg-[#5B5FEF] text-white shadow-xs"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      );
                    })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>
        ) : (
          /* =========================================================================
             VIEW MODE 2: ENHANCED GRID / CARD VIEW
             ========================================================================= */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className={`rounded-[24px] p-6 shadow-xs border transition-all flex flex-col justify-between group hover:shadow-lg ${
                    user.isBlocked
                      ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50"
                      : "bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-[#5B5FEF]/50"
                  }`}
                >
                  <div>
                    {/* Top Status & Avatar Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3.5">
                        <div
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center text-base shadow-xs overflow-hidden border-2 border-white dark:border-slate-800 shrink-0 cursor-pointer hover:ring-2 hover:ring-[#5B5FEF] transition-all"
                        >
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setIsDetailModalOpen(true);
                            }}
                            className="text-[15px] font-black text-slate-900 dark:text-white group-hover:text-[#5B5FEF] transition-colors truncate cursor-pointer hover:underline"
                          >
                            {user.name}
                          </h3>
                          <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{user.role}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status Chip */}
                      {user.isBlocked ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-rose-500 text-white shadow-xs flex items-center gap-1">
                          <Lock className="w-3 h-3" /> BLOCKED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Details Strip */}
                    <div className="space-y-1.5 text-[12px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Employee ID:</span>
                        <span
                          onClick={() => handleCopy(user.employeeId, "Employee ID")}
                          className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-[#5B5FEF] cursor-pointer"
                          title="Click to copy ID"
                        >
                          {user.employeeId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Department:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {user.department}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Email:</span>
                        <span
                          onClick={() => handleCopy(user.email, "Email")}
                          className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px] hover:text-[#5B5FEF] cursor-pointer"
                          title="Click to copy email"
                        >
                          {user.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-bold">Phone:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                          {user.phone}
                        </span>
                      </div>
                    </div>

                    {user.isBlocked && (
                      <div className="mb-4 p-2.5 rounded-xl bg-rose-100/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[11.5px] text-rose-800 dark:text-rose-300 font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Account Access Suspended by Admin</span>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons Bar with professional color tokens */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {/* View Details / Performance (Indigo) */}
                    <button
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setIsDetailModalOpen(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/40 text-[12px] font-extrabold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      title="View Employee Details & Tasks"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    {/* Edit Credentials (Sky) */}
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setIsEditModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/40 shadow-2xs transition-all cursor-pointer"
                      title="Edit Employee Credentials"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Block or Unblock Button (Amber / Emerald) */}
                    {user.isBlocked ? (
                      <button
                        onClick={() => handleUnblockUser(user)}
                        disabled={blockingId === user.id}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        title="Unblock this employee to restore access"
                      >
                        {blockingId === user.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unblock</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => setBlockConfirmUser(user)}
                        disabled={blockingId === user.id || user.role === "admin"}
                        className={`py-2 px-3 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-40 ${
                          user.role === "admin"
                            ? "bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                            : "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40"
                        }`}
                        title={
                          user.role === "admin"
                            ? "Admins cannot be blocked"
                            : "Block this employee to suspend access"
                        }
                      >
                        {blockingId === user.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Block</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Delete Button (Rose) */}
                    {user.role !== "admin" && (
                      <button
                        onClick={() => setDeleteConfirmUser(user)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40 shadow-2xs transition-all cursor-pointer"
                        title="Delete Employee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid View Pagination Footer */}
            <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[12.5px] font-bold text-slate-500">
                <span>Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1 text-[12px] font-bold"
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={18}>18</option>
                  <option value={30}>30</option>
                </select>
                <span>cards per page</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[12.5px] font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-[12px] font-black text-slate-500">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[12.5px] font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          5. MODALS: Detail Modal, Edit Modal, Delete Modal, Block Confirm Modal
         ========================================================================= */}
      {/* 1. Employee Detail & Performance Modal */}
      <EmployeeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
        onUserUpdated={fetchUsers}
        onEdit={(user) => {
          setIsDetailModalOpen(false);
          setEditingUser(user);
          setIsEditModalOpen(true);
        }}
      />

      {/* 2. Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onUserUpdated={fetchUsers}
      />

      {/* 3. Block Employee Confirmation Modal */}
      {blockConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-[18px] font-black text-slate-900 dark:text-white">
                Block {blockConfirmUser.name}?
              </h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                This employee will be <strong className="text-rose-600 dark:text-rose-400">immediately logged out</strong> and denied access to all portal services, tasks, and company workspaces.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[12px] font-extrabold text-slate-700 dark:text-slate-300">
                Reason for Suspension:
              </label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. Disciplinary suspension, Pending investigation..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBlockConfirmUser(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[13px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={blockingId === blockConfirmUser.id}
                onClick={handleConfirmBlock}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {blockingId === blockConfirmUser.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Block & Logout</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Dialog */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-[18px] font-black text-slate-900 dark:text-white">
                Delete Employee Account?
              </h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <strong className="text-slate-900 dark:text-white">
                  {deleteConfirmUser.name}
                </strong>{" "}
                ({deleteConfirmUser.employeeId})? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[13px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingId === deleteConfirmUser.id}
                onClick={handleDeleteUser}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingId === deleteConfirmUser.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. FLOATING BULK ACTION BAR (ACTIVE WHEN 1+ MEMBERS CHECKED)
         ========================================================================= */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/90 flex items-center gap-3 max-w-[95vw] flex-wrap justify-center">
            {/* Selection Counter Pill */}
            <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
              <span className="px-2.5 py-1 rounded-xl bg-[#5B5FEF] text-white font-extrabold text-[12px] flex items-center gap-1.5 shadow-xs">
                <UsersIcon className="w-3.5 h-3.5" />
                <span>{selectedUserIds.length} Selected</span>
              </span>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Export Selected to CSV */}
              <button
                onClick={handleBulkExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[12.5px] font-bold transition-all cursor-pointer shadow-2xs"
                title="Export selected members to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#5B5FEF]" />
                <span>Export ({selectedUserIds.length})</span>
              </button>

              {/* Bulk Block */}
              {hasActiveInSelection && (
                <button
                  onClick={() => setIsBulkBlockModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[12.5px] font-bold transition-all cursor-pointer shadow-2xs"
                  title="Block / Suspend selected members"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Block</span>
                </button>
              )}

              {/* Bulk Unblock (Shown if any selected is blocked) */}
              {hasBlockedInSelection && (
                <button
                  onClick={handleBulkUnblock}
                  disabled={bulkLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[12.5px] font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Unblock selected members"
                >
                  {bulkLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  <span>Unblock</span>
                </button>
              )}

              {/* Bulk Delete */}
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[12.5px] font-bold transition-all cursor-pointer shadow-2xs"
                title="Delete selected employee records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              {/* Clear Selection Button */}
              <div className="pl-1 border-l border-slate-700">
                <button
                  onClick={handleClearSelection}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-[12.5px] font-bold transition-all cursor-pointer"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Selection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Bulk Block Confirmation Modal */}
      {isBulkBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-[18px] font-black text-slate-900 dark:text-white">
                Block {selectedUserIds.length} Employee{selectedUserIds.length > 1 ? "s" : ""}?
              </h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                Selected active employees will be <strong className="text-rose-600 dark:text-rose-400">immediately logged out</strong> and denied access to company workspaces.
              </p>
            </div>

            <div className="max-h-32 overflow-y-auto custom-scrollbar p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
              {selectedUsers.map((u) => (
                <div key={u.id} className="text-[12px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between px-2 py-1">
                  <span>{u.name}</span>
                  <span className="text-slate-400 text-[11px] font-mono">{u.employeeId}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[12px] font-extrabold text-slate-700 dark:text-slate-300">
                Reason for Suspension:
              </label>
              <input
                type="text"
                value={bulkBlockReason}
                onChange={(e) => setBulkBlockReason(e.target.value)}
                placeholder="e.g. Administrative suspension by manager"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkBlockModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[13px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={handleConfirmBulkBlock}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[13px] flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Block Selected</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-[18px] font-black text-slate-900 dark:text-white">
                Delete {selectedUserIds.length} Employee Accounts?
              </h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <strong className="text-slate-900 dark:text-white">
                  {selectedUserIds.length} selected employee account{selectedUserIds.length > 1 ? "s" : ""}
                </strong>? This action cannot be undone.
              </p>
            </div>

            <div className="max-h-32 overflow-y-auto custom-scrollbar p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
              {selectedUsers.map((u) => (
                <div key={u.id} className="text-[12px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between px-2 py-1">
                  <span>{u.name}</span>
                  <span className="text-slate-400 text-[11px] font-mono">{u.employeeId}</span>
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
    </div>
  );
}
