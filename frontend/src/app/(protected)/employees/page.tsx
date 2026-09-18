"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Topbar } from "@/components/dashboard/Topbar";
import {
  Mail,
  Phone,
  Edit2,
  Trash2,
  Loader2,
  Search,
  X,
  Download,
  Ban,
  ShieldCheck,
  Eye,
  Briefcase,
  Building2,
  Users as UsersIcon,
  LayoutList,
  LayoutGrid,
  ArrowUpDown,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileSpreadsheet,
  FileCode,
  Printer,
  Award,
  Shield,
  UserPlus,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  exportEmployeesToCSV,
  exportEmployeesToExcel,
  exportEmployeesToJSON,
  printEmployeesReport,
} from "@/lib/exportUtils";
import { EmployeeDetailModal } from "@/features/employees/EmployeeDetailModal";
import { EditEmployeeModal } from "@/features/employees/EditEmployeeModal";
import { CreateEmployeeModal } from "@/features/employees/CreateEmployeeModal";
import { SendEmailModal, RecipientUser } from "@/features/employees/SendEmailModal";
import { EmployeesSkeleton } from "@/components/ui/Skeleton";
import { isSuperAdminUser } from "@/lib/roleUtils";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

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
  systemRole?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export default function EmployeesPage(props: any) {
  const isSuperAdminRoute = Boolean(props?.isSuperAdminRoute);
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const getStoredUser = (): any => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("nexus_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const activeUser = currentUser || getStoredUser();
  const rawUserRole = String(activeUser?.role || "").toLowerCase().trim();
  const userSysRole =
    activeUser?.systemRole ||
    (rawUserRole === "admin"
      ? "admin"
      : rawUserRole.includes("super")
      ? "super_admin"
      : rawUserRole.includes("system")
      ? "system_admin"
      : rawUserRole.includes("manager")
      ? "manager"
      : "employee");

  const activeEmail = String(activeUser?.email || "").toLowerCase().trim();

  // Super Admin authority check:
  const isSuperAdmin = isSuperAdminUser(activeUser);

  const isAdminRoute = Boolean(props?.isAdminRoute) || pathname === "/admin";
  const isSuperAdminView = isSuperAdminRoute || pathname === "/superadmin";
  const isSystemAdmin = userSysRole === "system_admin";
  const isAdminView = isAdminRoute || (!isSuperAdminView && (userSysRole === "admin" || isSystemAdmin || rawUserRole === "admin"));

  // Smooth route transitions:
  // When Super Admin visits /employees or /admin, seamlessly route to /superadmin
  // When Admin or System Admin visits /employees or /superadmin, seamlessly route to /admin
  useEffect(() => {
    if (!activeUser) return;
    if (isSuperAdmin && (pathname === "/employees" || pathname === "/admin")) {
      router.replace("/superadmin");
    } else if (!isSuperAdmin && (pathname === "/employees" || pathname === "/superadmin" || pathname === "/admin")) {
      if (userSysRole === "admin" || isSystemAdmin || rawUserRole === "admin") {
        if (pathname !== "/admin") router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [activeUser, isSuperAdmin, pathname, router, userSysRole, rawUserRole, isSystemAdmin]);

  useEffect(() => {
    document.title = isSuperAdminView
      ? "Super Admin Portal | EmpSphere"
      : isAdminView
      ? "Admin Portal | EmpSphere"
      : "Employee Directory | EmpSphere";
  }, [isSuperAdminView, isAdminView]);

  const canProvision = isSuperAdmin || isSystemAdmin || userSysRole === "admin" || rawUserRole === "admin";
  const canManageDirectory =
    isSuperAdmin ||
    ["system_admin", "admin", "manager"].includes(userSysRole) ||
    rawUserRole === "admin";

  // Root Super Admin account check: This account is the platform owner and should not be displayed in the employee roster
  const isSuperAdminAccount = (targetUser: UserItem | null | undefined) => {
    return isSuperAdminUser(targetUser as any);
  };

  // Administrator accounts (e.g. system_admin, admin)
  const isTargetAdmin = (targetUser: UserItem | null | undefined) => {
    if (!targetUser) return false;
    const sysRole = String(targetUser.systemRole || "").toLowerCase().trim();
    const role = String(targetUser.role || "").toLowerCase().trim();
    const email = String(targetUser.email || "").toLowerCase().trim();
    return (
      sysRole === "admin" ||
      sysRole === "system_admin" ||
      role === "admin" ||
      role.includes("admin") ||
      email.startsWith("admin@") ||
      email.includes("sysadmin@")
    );
  };

  // Active session check: users cannot delete or block themselves
  const isCurrentSelf = (targetUser: UserItem | null | undefined) => {
    if (!targetUser) return false;
    const currentUserId = (activeUser as any)?._id || (activeUser as any)?.id;
    const currentEmail = (activeUser?.email || "").toLowerCase().trim();
    return (
      (currentUserId && targetUser.id === currentUserId) ||
      (currentEmail && targetUser.email.toLowerCase().trim() === currentEmail)
    );
  };

  // Deletion permissions:
  // - Super Admin can delete any Admin, Manager, or Employee (except self and root superadmin).
  // - System Admin can delete any standard Admin, Manager, or Employee (except self, root superadmin, or fellow system admin).
  // - Regular Admins can only delete Employees/Managers (never admins or self).
  const canDeleteUser = (targetUser: UserItem | null | undefined): boolean => {
    if (!targetUser) return false;
    if (isCurrentSelf(targetUser)) return false;
    if (isSuperAdminAccount(targetUser)) return false;
    if (isSuperAdmin) return true;
    if (isSystemAdmin) {
      const targetSysRole = String(targetUser.systemRole || "").toLowerCase().trim();
      return targetSysRole !== "system_admin" && targetSysRole !== "super_admin";
    }
    if (isTargetAdmin(targetUser)) return false;
    return canManageDirectory;
  };

  // Edit permissions:
  // - Super Admin can edit all accounts.
  // - System Admin can edit Admin, Manager, and Employee accounts (and own non-role details).
  // - Regular Admins can edit Employee and Manager accounts.
  const canEditUser = (targetUser: UserItem | null | undefined): boolean => {
    if (!targetUser) return false;
    if (isSuperAdminAccount(targetUser)) return isSuperAdmin;
    if (isSuperAdmin) return true;
    if (isSystemAdmin) {
      if (isCurrentSelf(targetUser)) return true;
      const targetSysRole = String(targetUser.systemRole || "").toLowerCase().trim();
      return targetSysRole !== "system_admin" && targetSysRole !== "super_admin";
    }
    if (isTargetAdmin(targetUser)) return false;
    return canManageDirectory;
  };

  // Block/Unblock permissions:
  // - Super Admin can block/unblock any account except self.
  // - System Admin can block/unblock Admin, Manager, and Employee accounts.
  // - Regular Admins can block/unblock Employee and Manager accounts.
  const canBlockUser = (targetUser: UserItem | null | undefined): boolean => {
    if (!targetUser) return false;
    if (isCurrentSelf(targetUser)) return false;
    if (isSuperAdminAccount(targetUser)) return false;
    if (isSuperAdmin) return true;
    if (isSystemAdmin) {
      const targetSysRole = String(targetUser.systemRole || "").toLowerCase().trim();
      return targetSysRole !== "system_admin" && targetSysRole !== "super_admin";
    }
    return !isTargetAdmin(targetUser) && canManageDirectory;
  };

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Reset all filters and search queries
  const handleResetFilters = () => {
    if (!isFiltered) {
      toast("Filters are already at default", { icon: "ℹ️" });
      return;
    }
    setSearchQuery("");
    setStatusTab("all");
    setRoleTab("all");
    setDepartmentFilter("All");
    setSortBy("newest");
    setCurrentPage(1);
    setSelectedUserIds([]);
    toast.success("Filters reset to default");
  };

  // View Mode: 'list' (Table) or 'grid' (Cards)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Search & Filters & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "active" | "blocked">("all");
  const [roleTab, setRoleTab] = useState<"all" | "manager" | "employee" | "admin">("all");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "newest" | "oldest" | "department">("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Selected row checkboxes
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

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
  const [blockNotificationMethod, setBlockNotificationMethod] = useState("both");
  const [blockingId, setBlockingId] = useState<string | null>(null);

  // Bulk Actions State
  const [isBulkBlockModalOpen, setIsBulkBlockModalOpen] = useState(false);
  const [bulkBlockReason, setBulkBlockReason] = useState("Administrative suspension by manager");
  const [bulkBlockNotificationMethod, setBulkBlockNotificationMethod] = useState("both");
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Send Email Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState<RecipientUser[]>([]);

  const handleOpenEmailModal = (targetUsers: UserItem | UserItem[]) => {
    const list = Array.isArray(targetUsers) ? targetUsers : [targetUsers];
    const mapped: RecipientUser[] = list.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      employeeId: u.employeeId,
      avatarUrl: u.avatarUrl,
    }));
    setEmailRecipients(mapped);
    setIsEmailModalOpen(true);
  };

  // Click outside to dismiss sort and export menus
  const sortRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sortRef.current && !sortRef.current.contains(target)) {
        setIsSortOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users", {
        params: { includeAdmin: "true", _t: Date.now().toString() },
      });

      if (res.data?.data?.users) {
        const mappedUsers: UserItem[] = res.data.data.users
          .filter((u: any) => {
            if (u.isDeleted) return false;
            const roleStr = String(u.role || "").toLowerCase().trim();
            const sysRole = String(u.systemRole || "").toLowerCase().trim();
            const emailStr = String(u.email || "").toLowerCase().trim();
            // Completely exclude root Super Administrator account from this portal roster
            const isSuper = isSuperAdminUser(u);
            return !isSuper;
          })
          .map((u: any) => {
            const roleStr = String(u.role || "").toLowerCase().trim();
            let derivedSysRole = u.systemRole;
            if (!derivedSysRole) {
              if (roleStr.includes("super")) derivedSysRole = "super_admin";
              else if (roleStr.includes("system")) derivedSysRole = "system_admin";
              else if (roleStr === "admin" || roleStr.includes("admin")) derivedSysRole = "admin";
              else if (roleStr.includes("manager") || roleStr.includes("lead")) derivedSysRole = "manager";
              else derivedSysRole = "employee";
            }

            return {
              id: u._id,
              name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Team Member",
              firstName: u.firstName || "",
              lastName: u.lastName || "",
              role: u.role || "Software Engineer",
              systemRole: derivedSysRole,
              department: u.department || "Engineering",
              employeeId: u.employeeId || `EMP-${String(u._id || "").slice(-4).toUpperCase()}`,
              email: u.email || "",
              phone: (() => {
                const rawPhone = String(u.phoneNumber || "").trim();
                const dial = String(u.dialCode || "").trim();
                if (!rawPhone) return "No phone";
                if (dial && rawPhone.startsWith(dial)) return rawPhone;
                if (rawPhone.startsWith("+")) return rawPhone;
                return `${dial} ${rawPhone}`.trim();
              })(),
              status: u.isBlocked ? "Blocked" : "Active",
              isBlocked: Boolean(u.isBlocked),
              blockedAt: u.blockedAt,
              blockedReason: u.blockedReason,
              avatarUrl: u.avatarUrl,
              createdAt: u.createdAt,
            };
          });
        setUsers(mappedUsers);
      }
    } catch (err) {
      console.error("Failed to load employees directory:", err);
      toast.error("Failed to load employees directory");
    } finally {
      setLoading(false);
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
    if (isCurrentSelf(blockConfirmUser) || isSuperAdminAccount(blockConfirmUser)) {
      toast.error("Root Super Administrator and active session accounts cannot be blocked.");
      setBlockConfirmUser(null);
      return;
    }
    if (isTargetAdmin(blockConfirmUser) && !isSuperAdmin) {
      toast.error("Only Super Administrator has authority to suspend Administrator accounts.");
      setBlockConfirmUser(null);
      return;
    }

    try {
      setBlockingId(blockConfirmUser.id);
      await api.patch(`/users/${blockConfirmUser.id}/block`, {
        reason: blockReason || "Administrative suspension by manager",
        notificationMethod: blockNotificationMethod,
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
    if (isCurrentSelf(deleteConfirmUser)) {
      toast.error("Self-deletion safeguard: You cannot delete your own active session account.");
      setDeleteConfirmUser(null);
      return;
    }
    if (isSuperAdminAccount(deleteConfirmUser)) {
      toast.error("Protected Account: Root Super Administrator cannot be deactivated or deleted.");
      setDeleteConfirmUser(null);
      return;
    }
    if (isTargetAdmin(deleteConfirmUser) && !isSuperAdmin) {
      toast.error("Enterprise Governance Lock: Only the Super Administrator has authority to delete Administrator accounts.");
      setDeleteConfirmUser(null);
      return;
    }

    try {
      setDeletingId(deleteConfirmUser.id);
      await api.delete(`/users/${deleteConfirmUser.id}`);
      toast.success(
        isTargetAdmin(deleteConfirmUser)
          ? `Administrator ${deleteConfirmUser.name} deactivated & archived successfully.`
          : `Employee ${deleteConfirmUser.name} deleted successfully.`
      );
      setDeleteConfirmUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete account.");
    } finally {
      setDeletingId(null);
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
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
            notificationMethod: bulkBlockNotificationMethod,
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
      const validTargets = selectedUsers.filter((u) => canDeleteUser(u));
      if (validTargets.length === 0) {
        toast.error("None of the selected accounts are eligible for deletion under current governance rules.");
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

      toast.success(`Successfully deactivated and archived ${successCount} account(s).`);
      setIsBulkDeleteModalOpen(false);
      setSelectedUserIds([]);
      await fetchUsers();
    } catch (err: any) {
      toast.error("Failed to complete bulk delete operation.");
    } finally {
      setBulkLoading(false);
    }
  };

  // Root Super Admin is excluded from the employee directory roster
  const nonSuperAdminUsers = useMemo(() => {
    return users.filter((u) => !isSuperAdminAccount(u));
  }, [users]);

  // Authoritative Role Classifiers
  // SystemRole takes precedence. An employee with systemRole === "employee" is NEVER a manager.
  const isUserAdmin = (u: any) => {
    const sysRole = String(u.systemRole || "").toLowerCase().trim();
    const roleLower = String(u.role || "").toLowerCase().trim();
    return ["admin", "super_admin", "system_admin"].includes(sysRole) || roleLower.includes("admin");
  };

  const isUserManager = (u: any) => {
    const sysRole = String(u.systemRole || "").toLowerCase().trim();
    const roleLower = String(u.role || "").toLowerCase().trim();
    if (isUserAdmin(u)) return false;
    // Explicit employee status strictly bars manager categorization
    if (sysRole === "employee") return false;
    return sysRole === "manager" || roleLower.includes("manager") || roleLower.includes("lead");
  };

  const isUserStaff = (u: any) => {
    return !isUserAdmin(u) && !isUserManager(u);
  };

  // Human-readable Role / Job Title Formatter
  const formatRoleTitle = (roleStr?: string) => {
    if (!roleStr) return "Staff Contributor";
    const trimmed = roleStr.trim();
    const lower = trimmed.toLowerCase();
    if (lower === "admin") return "Administrator";
    if (lower === "system_admin" || lower === "sysadmin") return "System Administrator";
    if (lower === "super_admin" || lower === "superadmin") return "Super Administrator";
    if (lower === "manager") return "Manager";
    if (lower === "employee" || lower === "staff") return "Staff Contributor";
    return trimmed;
  };

  // Role Counts
  const managerCount = useMemo(
    () => nonSuperAdminUsers.filter((u) => isUserManager(u)).length,
    [nonSuperAdminUsers]
  );
  const employeeCount = useMemo(
    () => nonSuperAdminUsers.filter((u) => isUserStaff(u)).length,
    [nonSuperAdminUsers]
  );
  const adminCount = useMemo(
    () => nonSuperAdminUsers.filter((u) => isUserAdmin(u)).length,
    [nonSuperAdminUsers]
  );

  const activeCount = useMemo(
    () => nonSuperAdminUsers.filter((u) => !u.isBlocked).length,
    [nonSuperAdminUsers]
  );
  const blockedCount = useMemo(
    () => nonSuperAdminUsers.filter((u) => u.isBlocked).length,
    [nonSuperAdminUsers]
  );

  // Filter & Sort Logic
  const filteredUsers = useMemo(() => {
    return nonSuperAdminUsers
      .filter((user) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.role.toLowerCase().includes(q) ||
          formatRoleTitle(user.role).toLowerCase().includes(q) ||
          user.department.toLowerCase().includes(q) ||
          user.employeeId.toLowerCase().includes(q);

        const matchesDepartment =
          departmentFilter === "All" ||
          user.department.toLowerCase() === departmentFilter.toLowerCase();

        const matchesTab =
          statusTab === "all" ||
          (statusTab === "active" && !user.isBlocked) ||
          (statusTab === "blocked" && user.isBlocked);

        const isAdm = isUserAdmin(user);
        const isMgr = isUserManager(user);
        const isStaff = isUserStaff(user);

        const matchesRole =
          roleTab === "all" ||
          (roleTab === "manager" && isMgr) ||
          (roleTab === "employee" && isStaff) ||
          (roleTab === "admin" && isAdm);

        return matchesSearch && matchesDepartment && matchesTab && matchesRole;
      })
      .sort((a, b) => {
        // Enterprise Rule: In Admin view, records with restricted/hidden actions (peer Administrators)
        // must not appear at the top or on Page 1. Active manageable staff & managers always appear first.
        if (!isSuperAdmin && !isSystemAdmin) {
          const aHidden = isTargetAdmin(a);
          const bHidden = isTargetAdmin(b);
          if (aHidden && !bHidden) return 1;
          if (!aHidden && bHidden) return -1;
        }

        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (sortBy === "department") return a.department.localeCompare(b.department);
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        // newest default
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [nonSuperAdminUsers, searchQuery, statusTab, roleTab, departmentFilter, sortBy, isSuperAdmin]);

  const isFiltered = useMemo(() => {
    return Boolean(
      searchQuery.trim() !== "" ||
      statusTab !== "all" ||
      roleTab !== "all" ||
      departmentFilter !== "All" ||
      sortBy !== "newest"
    );
  }, [searchQuery, statusTab, roleTab, departmentFilter, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== "") count++;
    if (statusTab !== "all") count++;
    if (roleTab !== "all") count++;
    if (departmentFilter !== "All") count++;
    if (sortBy !== "newest") count++;
    return count;
  }, [searchQuery, statusTab, roleTab, departmentFilter, sortBy]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredUsers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, statusTab, roleTab, sortBy, viewMode, itemsPerPage]);

  // Checkbox Selection
  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const selectableUsers = paginatedUsers.filter((u) => canDeleteUser(u));
    if (selectedUserIds.length >= selectableUsers.length && selectableUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map((u) => u.id));
    }
  };

  if (!activeUser) {
    return null;
  }

  if (!loading && currentUser && !canManageDirectory) {
    return (
      <div className="min-h-screen bg-transparent pb-28">
        <Topbar
          title={t("emp_directory_title", "Employee Directory")}
          subtitle="Enterprise Personnel Access Control"
          icon={<UsersIcon className="w-5 h-5 text-[#5B5FEF]" />}
        />
        <main className="px-4 sm:px-6 lg:px-8 max-w-xl mx-auto mt-20 text-center animate-in fade-in">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Access Restricted
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              The Enterprise Employee Directory is restricted to Managers and Administrators. Please contact your organization administrator if you require directory provisioning or access.
            </p>
            <div className="pt-2">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4d51db] text-white text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-28 lg:pb-32 transition-colors duration-300">
      <Topbar
        title={
          isSuperAdminView
            ? "Super Admin Portal"
            : isAdminView
            ? "Admin Portal"
            : t("emp_directory_title", "Employee Directory")
        }
        subtitle={
          isSuperAdminView
            ? "Enterprise governance roster, administrative privileges, and workspace access control."
            : isAdminView
            ? "Enterprise team directory, administrative operations, and department personnel management."
            : t("emp_directory_subtitle", "Review employee roster, manage roles, edit credentials, and control access permissions.")
        }
        icon={
          isSuperAdminView ? (
            <ShieldCheck className="w-5 h-5 text-[#5B5FEF]" />
          ) : isAdminView ? (
            <Shield className="w-5 h-5 text-[#5B5FEF]" />
          ) : (
            <UsersIcon className="w-5 h-5 text-[#5B5FEF]" />
          )
        }
      />

      <main className="px-4 sm:px-6 lg:px-8 space-y-5 max-w-[1600px] mx-auto mt-6 animate-in fade-in duration-300">
        {/* =========================================================================
            1. TOP BAR: Enterprise Role Tabs & Cohesive Action Suite
           ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Role Filter Tabs - Enterprise Segmented Control */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setRoleTab("all")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                roleTab === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
            >
              <UsersIcon className={`w-3.5 h-3.5 ${roleTab === "all" ? "text-[#5B5FEF]" : "text-slate-400"}`} />
              <span>All Roles</span>
              <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-extrabold ${
                roleTab === "all"
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300"
                  : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400"
              }`}>
                {nonSuperAdminUsers.length}
              </span>
            </button>

            <button
              onClick={() => setRoleTab("manager")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                roleTab === "manager"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
            >
              <Award className={`w-3.5 h-3.5 ${roleTab === "manager" ? "text-amber-500" : "text-slate-400"}`} />
              <span>Managers & Leads</span>
              <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-extrabold ${
                roleTab === "manager"
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300"
                  : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400"
              }`}>
                {managerCount}
              </span>
            </button>

            <button
              onClick={() => setRoleTab("employee")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                roleTab === "employee"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
            >
              <Briefcase className={`w-3.5 h-3.5 ${roleTab === "employee" ? "text-[#5B5FEF]" : "text-slate-400"}`} />
              <span>Staff Employees</span>
              <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-extrabold ${
                roleTab === "employee"
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#5B5FEF] dark:text-indigo-300"
                  : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400"
              }`}>
                {employeeCount}
              </span>
            </button>

            <button
              onClick={() => setRoleTab("admin")}
              className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                roleTab === "admin"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${roleTab === "admin" ? "text-purple-600" : "text-slate-400"}`} />
              <span>Administrators</span>
              <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-extrabold ${
                roleTab === "admin"
                  ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300"
                  : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400"
              }`}>
                {adminCount}
              </span>
            </button>
          </div>

          {/* Action Tools: Export, Compose Email, Add Member (Enterprise Sizing & Alignment) */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Export Dropdown Menu with Multiple Formats */}
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-2 shrink-0"
                title="Export Employee Directory"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{t("export_csv", "Export")}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 space-y-1">
                  <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Export Format
                    </p>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                      {filteredUsers.length} records selected
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      exportEmployeesToExcel(filteredUsers, "EmpSphere_Staff_Directory");
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="leading-tight">Microsoft Excel (.xls)</p>
                      <p className="text-[10.5px] text-slate-400 font-normal">Styled workbook table</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      exportEmployeesToCSV(filteredUsers, "EmpSphere_Staff_Directory");
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#5B5FEF] shrink-0" />
                    <div>
                      <p className="leading-tight">CSV Spreadsheet (.csv)</p>
                      <p className="text-[10.5px] text-slate-400 font-normal">Standard comma-separated</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      exportEmployeesToJSON(filteredUsers, "EmpSphere_Staff_Directory");
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="leading-tight">JSON Data (.json)</p>
                      <p className="text-[10.5px] text-slate-400 font-normal">Raw structured JSON</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      printEmployeesReport(filteredUsers, "EmpSphere Staff Directory Report");
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2.5 cursor-pointer border-t border-slate-100 dark:border-slate-800"
                  >
                    <Printer className="w-4 h-4 text-purple-500 shrink-0" />
                    <div>
                      <p className="leading-tight">PDF Document / Print</p>
                      <p className="text-[10.5px] text-slate-400 font-normal">Printable summary sheet</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Compose Email */}
            <button
              onClick={() => {
                const activeList = nonSuperAdminUsers.filter((u) => !u.isBlocked);
                handleOpenEmailModal(activeList.length > 0 ? [activeList[0]] : nonSuperAdminUsers.slice(0, 1));
              }}
              className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-2 shrink-0"
              title="Compose & dispatch email via SMTP"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Compose Email</span>
            </button>

            {/* Provision / Add Member (Super Admin / Admin only) */}
            {canProvision && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="h-10 px-4 rounded-xl bg-[#5B5FEF] hover:bg-[#4D51DB] text-white text-xs font-extrabold transition-all cursor-pointer shadow-xs hover:shadow-md flex items-center gap-2 active:scale-95 shrink-0"
                title="Provision a new enterprise team member"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            2. SEARCH & FILTER HUB (Professional Enterprise Multi-Tier Design)
           ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3.5">
          {/* Tier 1: Search Input + Status Filter Pills + View Switcher */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            {/* Left: Prominent Search Box */}
            <div className="relative flex-1 min-w-[280px] max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t("search_emp_placeholder", "Search by name, email, employee ID, role...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-9 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right Group: Status Filter & View Mode Switcher */}
            <div className="flex items-center gap-3 justify-between sm:justify-end flex-wrap sm:flex-nowrap">
              {/* Status Segmented Control (All / Active / Blocked) */}
              <div className="h-11 flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700">
                <button
                  onClick={() => setStatusTab("all")}
                  className={`h-9 px-3.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer min-w-[46px] flex items-center justify-center ${
                    statusTab === "all"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusTab("active")}
                  className={`h-9 px-3.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusTab === "active"
                      ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Active ({activeCount})</span>
                </button>
                <button
                  onClick={() => setStatusTab("blocked")}
                  className={`h-9 px-3.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusTab === "blocked"
                      ? "bg-rose-600 text-white shadow-xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Blocked ({blockedCount})</span>
                </button>
              </div>

              {/* View Mode Toggle: List View vs Grid / Cards View */}
              <div className="h-11 flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 shadow-2xs">
                <button
                  onClick={() => setViewMode("list")}
                  className={`h-9 px-3 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-900 text-[#5B5FEF] shadow-xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Table List View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span className="font-extrabold">List</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`h-9 px-3 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-900 text-[#5B5FEF] shadow-xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="font-extrabold">Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tier 2: Filters, Sorting, Reset & Meta Count Bar */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Department & Sort Filter Dropdowns + Reset */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Department Filter */}
              <div className="h-10 flex items-center gap-2 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                <Building2 className="w-3.5 h-3.5 text-[#5B5FEF] shrink-0" />
                <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">Department:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-transparent text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-1"
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
                  className="h-10 flex items-center justify-between gap-2.5 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[12.5px] font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer min-w-[155px]"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">Sort:</span>
                    <span>
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
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
                {isSortOpen && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95">
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

              {/* Reset Filters Button */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-10 px-3.5 flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-[12px] font-extrabold shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title={`Reset ${activeFilterCount} active filter(s)`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span>Reset Filters</span>
                  <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9.5px] font-black text-white leading-none">
                    {activeFilterCount}
                  </span>
                </button>
              )}
            </div>

            {/* Right: Live Filtered Records Counter */}
            <div className="flex items-center gap-2 text-[12.5px] font-bold text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-[#5B5FEF]" />
              <span>
                Showing <strong className="text-slate-900 dark:text-white">{filteredUsers.length}</strong> {filteredUsers.length === 1 ? "record" : "personnel"}
              </span>
              {roleTab !== "all" && (
                <span className="text-slate-400 text-[11.5px] font-semibold">
                  ({roleTab === "admin" ? "Administrators" : roleTab === "manager" ? "Managers & Leads" : "Staff Employees"})
                </span>
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
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#5B5FEF] text-white text-[12.5px] font-extrabold shadow-xs hover:bg-[#4d51db] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "list" ? (
          /* =========================================================================
             VIEW MODE 1: JIRA / TASKS STYLE TABULAR LIST VIEW (CLEAN & BALANCED)
             ========================================================================= */
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-800 w-full min-h-[420px] flex flex-col justify-between overflow-hidden">
            <div className="overflow-x-auto w-full custom-scrollbar flex-1 pb-6">
              <table className="w-full min-w-[960px] text-left border-collapse">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-[#F4F5F7] dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                    {/* Select All Checkbox */}
                    <th className="py-3.5 px-3 w-11 min-w-[44px] text-center align-middle">
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
                    <th className="py-3.5 px-3 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 min-w-[200px] max-w-[220px] align-middle">
                      {t("col_employee", "EMPLOYEE")}
                    </th>

                    {/* Employee ID */}
                    <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-24 min-w-[85px] text-center align-middle whitespace-nowrap">
                      {t("col_id_code", "ID CODE")}
                    </th>

                    {/* Department */}
                    <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-32 min-w-[115px] align-middle whitespace-nowrap">
                      {t("col_department", "DEPARTMENT")}
                    </th>

                    {/* Role / Job Title */}
                    <th className="py-3.5 px-2.5 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-48 min-w-[170px] align-middle whitespace-nowrap">
                      {t("col_role", "ROLE / TITLE")}
                    </th>

                    {/* Phone */}
                    <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-32 min-w-[120px] align-middle whitespace-nowrap">
                      {t("col_phone", "PHONE")}
                    </th>

                    {/* Status Pill */}
                    <th className="py-3.5 px-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 w-24 min-w-[90px] text-center align-middle whitespace-nowrap">
                      {t("col_status", "STATUS")}
                    </th>

                    {/* Actions Column (Sticky Right) */}
                    <th className="sticky right-0 z-20 py-3.5 pr-4 pl-2 text-[11.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right w-44 min-w-[168px] align-middle whitespace-nowrap bg-[#F4F5F7] dark:bg-slate-800 shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.35)]">
                      {t("col_actions", "ACTIONS")}
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[13px]">
                  {paginatedUsers.map((user, index) => {
                    const isSelected = selectedUserIds.includes(user.id);

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-slate-200/85 dark:border-slate-800/80 transition-all duration-150 group ${
                          isSelected
                            ? "bg-[#EEF2FF] dark:bg-indigo-950/40"
                            : index % 2 === 0
                            ? "bg-white dark:bg-slate-900"
                            : "bg-[#F8FAFC] dark:bg-[#131B2A]"
                        } hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center align-middle w-11 min-w-[44px]">
                          {(!isTargetAdmin(user) || isSuperAdmin) ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!canDeleteUser(user)}
                              onChange={() => toggleSelectUser(user.id)}
                              className={`rounded border-slate-300 text-[#5B5FEF] focus:ring-0 ${
                                !canDeleteUser(user)
                                  ? "opacity-30 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                              title={
                                !canDeleteUser(user)
                                  ? "Account protected from bulk operations"
                                  : "Select member"
                              }
                            />
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs select-none">—</span>
                          )}
                        </td>

                        {/* Employee Avatar & Name + Email below */}
                        <td className="py-3 px-3 align-middle min-w-[200px] max-w-[220px]">
                          <div className="flex items-center gap-2.5">
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
                            <div className="min-w-0 flex-1 max-w-[150px] sm:max-w-[170px]">
                              <h4
                                onClick={() => {
                                  setSelectedUserId(user.id);
                                  setIsDetailModalOpen(true);
                                }}
                                className="font-extrabold text-[13px] text-slate-900 dark:text-white group-hover:text-[#5B5FEF] transition-colors truncate cursor-pointer hover:underline"
                                title={user.name}
                              >
                                {user.name}
                              </h4>
                              <p
                                onClick={() => handleCopy(user.email, "Email")}
                                className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1 hover:text-[#5B5FEF] cursor-pointer"
                                title={`Click to copy email: ${user.email}`}
                              >
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Employee ID */}
                        <td className="py-3 px-2 text-center align-middle whitespace-nowrap w-24 min-w-[85px]">
                          <span
                            onClick={() => handleCopy(user.employeeId, "Employee ID")}
                            className="inline-flex items-center justify-center font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#5B5FEF] cursor-pointer"
                            title="Click to copy ID"
                          >
                            {user.employeeId}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-2 align-middle whitespace-nowrap w-32 min-w-[115px]">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 max-w-[125px]">
                            <Building2 className="w-3 h-3 text-[#5B5FEF] shrink-0" />
                            <span className="truncate" title={user.department}>{user.department}</span>
                          </span>
                        </td>

                        {/* Role / Job Title */}
                        <td className="py-3 px-2.5 align-middle whitespace-nowrap w-48 min-w-[170px]">
                          <div className="flex items-center gap-1.5">
                            {isUserAdmin(user) ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 max-w-[175px]"
                                title={formatRoleTitle(user.role)}
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <span className="truncate">{formatRoleTitle(user.role)}</span>
                              </span>
                            ) : isUserManager(user) ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 max-w-[175px]"
                                title={formatRoleTitle(user.role)}
                              >
                                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">{formatRoleTitle(user.role)}</span>
                              </span>
                            ) : (
                              <div
                                className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300 max-w-[175px]"
                                title={formatRoleTitle(user.role)}
                              >
                                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{formatRoleTitle(user.role)}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-2 align-middle whitespace-nowrap w-32 min-w-[120px]">
                          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600 dark:text-slate-400">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{user.phone}</span>
                          </span>
                        </td>

                        {/* Status (Interactive 1-Click Block/Unblock toggle) */}
                        <td className="py-3 px-2 text-center align-middle whitespace-nowrap w-24 min-w-[90px]">
                          {user.isBlocked ? (
                            <button
                              onClick={() => handleUnblockUser(user)}
                              disabled={blockingId === user.id || !canBlockUser(user)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500 hover:bg-rose-600 text-white shadow-2xs transition-all cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
                              title={canBlockUser(user) ? "Click to Unblock Employee (Restore Access)" : "Account suspension is protected"}
                            >
                              {blockingId === user.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Ban className="w-3 h-3" />
                              )}
                              <span>BLOCKED</span>
                            </button>
                          ) : !canBlockUser(user) ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 cursor-default select-none"
                              title="Administrator account is active and protected"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>ACTIVE</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setBlockConfirmUser(user)}
                              disabled={blockingId === user.id}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer hover:border-emerald-300 hover:scale-105 active:scale-95 transition-all"
                              title="Click to Block/Suspend Employee"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>ACTIVE</span>
                            </button>
                          )}
                        </td>

                        {/* Actions Column (Sticky Right) */}
                        <td
                          className={`sticky right-0 z-10 py-3 pr-4 pl-2 text-right align-middle whitespace-nowrap w-44 min-w-[168px] shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_-3px_rgba(0,0,0,0.35)] transition-colors ${
                            isSelected
                              ? "bg-[#EEF2FF] dark:bg-[#1a1b36] group-hover:bg-[#E5ECFF] dark:group-hover:bg-[#222448]"
                              : index % 2 === 0
                              ? "bg-white dark:bg-slate-900 group-hover:bg-[#F3F6FF] dark:group-hover:bg-[#1A2338]"
                              : "bg-[#F8FAFC] dark:bg-[#131B2A] group-hover:bg-[#F3F6FF] dark:group-hover:bg-[#1A2338]"
                          }`}
                        >
                          <div className="flex items-center justify-end gap-1.5 h-full">
                            {/* 1. View Details (Indigo Theme) */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsDetailModalOpen(true);
                              }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/50 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/50 shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="View Employee Details & Tasks"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* 2. Edit Employee (Sky Theme) - Available when permitted */}
                            {canEditUser(user) ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsEditModalOpen(true);
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-sky-600 dark:text-sky-400 bg-sky-50/90 dark:bg-sky-950/50 hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/50 shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                title="Edit Employee Credentials"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 select-none cursor-default"
                                title="Administrator accounts are protected and managed exclusively by Super Admin"
                              >
                                <Shield className="w-3 h-3 text-amber-500 shrink-0" />
                                <span>Protected</span>
                              </span>
                            )}

                            {/* 3. Send Email via SMTP (Purple Theme) */}
                            <button
                              type="button"
                              onClick={() => handleOpenEmailModal(user)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 bg-purple-50/90 dark:bg-purple-950/50 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800/50 shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                              title="Send Email to Employee via SMTP"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>

                            {/* 4. Delete Employee / Administrator (Trash2) - Available when permitted */}
                            {canDeleteUser(user) && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmUser(user)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-50/90 dark:bg-rose-950/50 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800/50 hover:shadow-xs hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
                                title={isTargetAdmin(user) ? "Deactivate Administrator Account" : "Delete Employee Account"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

                {/* Counter */}
                <div className="flex items-center gap-1.5">
                  <span>
                    {filteredUsers.length > 0
                      ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                          currentPage * itemsPerPage,
                          filteredUsers.length
                        )} of ${filteredUsers.length}`
                      : `0 of 0`}
                  </span>
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
                          <div className="mt-1">
                            {isUserAdmin(user) ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60"
                                title={formatRoleTitle(user.role)}
                              >
                                <ShieldCheck className="w-3 h-3 text-purple-600 shrink-0" />
                                <span className="truncate">{formatRoleTitle(user.role)}</span>
                              </span>
                            ) : isUserManager(user) ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60"
                                title={formatRoleTitle(user.role)}
                              >
                                <Award className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">{formatRoleTitle(user.role)}</span>
                              </span>
                            ) : (
                              <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5" title={formatRoleTitle(user.role)}>
                                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{formatRoleTitle(user.role)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Chip (Interactive 1-Click Block/Unblock toggle) */}
                      {user.isBlocked ? (
                        <button
                          onClick={() => handleUnblockUser(user)}
                          disabled={blockingId === user.id || (!isSuperAdmin && isTargetAdmin(user))}
                          className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-rose-500 hover:bg-rose-600 text-white shadow-xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
                          title="Click to Unblock Employee"
                        >
                          {blockingId === user.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Ban className="w-3 h-3" />
                          )}
                          <span>BLOCKED</span>
                        </button>
                      ) : isTargetAdmin(user) && !isSuperAdmin ? (
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 cursor-default select-none flex items-center gap-1"
                          title="Administrator account is active and managed by Super Administrator"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>ACTIVE</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setBlockConfirmUser(user)}
                          disabled={blockingId === user.id || isTargetAdmin(user)}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black flex items-center gap-1 transition-all ${
                            isTargetAdmin(user)
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 cursor-default"
                              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer hover:border-emerald-300 hover:scale-105 active:scale-95"
                          }`}
                          title={
                            isTargetAdmin(user)
                              ? "Admin account is always active"
                              : "Click to Block/Suspend Employee"
                          }
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>ACTIVE</span>
                        </button>
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
                        <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Account Access Suspended by Admin</span>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons Bar (View Profile -> Edit -> Send Mail -> Delete) */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {/* View Details / Performance (Indigo) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setIsDetailModalOpen(true);
                      }}
                      className="flex-1 h-9 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/40 text-[12px] font-extrabold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                      title="View Profile & Details"
                    >
                      <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>View Profile</span>
                    </button>

                    {/* Edit Credentials (Sky) - Available when permitted */}
                    {canEditUser(user) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(user);
                          setIsEditModalOpen(true);
                        }}
                        className="w-9 h-9 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/40 shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                        title="Edit Employee Credentials"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 select-none cursor-default"
                        title="Administrator accounts are protected and managed exclusively by Super Admin"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Protected</span>
                      </span>
                    )}

                    {/* Send Email via SMTP (Purple) */}
                    <button
                      type="button"
                      onClick={() => handleOpenEmailModal(user)}
                      className="w-9 h-9 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-900/40 shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 flex items-center justify-center transition-all cursor-pointer"
                      title="Send Email via SMTP"
                    >
                      <Mail className="w-4 h-4" />
                    </button>

                    {/* Delete Button (Trash2) - Available when permitted */}
                    {canDeleteUser(user) && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmUser(user)}
                        className="w-9 h-9 rounded-xl shadow-2xs flex items-center justify-center transition-all cursor-pointer bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/40 hover:shadow-xs hover:scale-105 active:scale-95"
                        title={isTargetAdmin(user) ? "Deactivate Administrator Account" : "Delete Employee Account"}
                      >
                        <Trash2 className="w-4 h-4" />
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

      {/* Create Employee / Provisioning Modal */}
      <CreateEmployeeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={() => {
          fetchUsers();
        }}
      />

      {/* Send Email via SMTP Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        recipients={emailRecipients}
        allUsers={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
          employeeId: u.employeeId,
          avatarUrl: u.avatarUrl,
        }))}
        onSuccess={() => {
          fetchUsers();
        }}
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

            <div className="space-y-1.5 text-left">
              <label className="text-[12px] font-extrabold text-slate-700 dark:text-slate-300">
                Notify Employee Via:
              </label>
              <div className="relative">
                <select
                  value={blockNotificationMethod}
                  onChange={(e) => setBlockNotificationMethod(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="both">Email & System Notification</option>
                  <option value="email">Email Only</option>
                  <option value="system">System Notification Only</option>
                  <option value="none">Do Not Notify</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
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
                    <Ban className="w-4 h-4" />
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
                {isTargetAdmin(deleteConfirmUser) ? "Deactivate Administrator Account?" : "Delete Employee Account?"}
              </h3>
              <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                Are you sure you want to permanently delete or deactivate{" "}
                <strong className="text-slate-900 dark:text-white">
                  {deleteConfirmUser.name}
                </strong>{" "}
                ({deleteConfirmUser.employeeId || deleteConfirmUser.email})? This action cannot be undone.
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

              {/* Send Bulk Email */}
              <button
                onClick={() => handleOpenEmailModal(selectedUsers)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4d51db] text-white text-[12.5px] font-extrabold transition-all cursor-pointer shadow-xs"
                title="Send direct email to selected employees via SMTP"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email ({selectedUserIds.length})</span>
              </button>

              {/* Bulk Block */}
              {hasActiveInSelection && (
                <button
                  onClick={() => setIsBulkBlockModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[12.5px] font-bold transition-all cursor-pointer shadow-2xs"
                  title="Block / Suspend selected members"
                >
                  <Ban className="w-3.5 h-3.5" />
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
                    <ShieldCheck className="w-3.5 h-3.5" />
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

            <div className="space-y-1.5 text-left">
              <label className="text-[12px] font-extrabold text-slate-700 dark:text-slate-300">
                Notify Employees Via:
              </label>
              <div className="relative">
                <select
                  value={bulkBlockNotificationMethod}
                  onChange={(e) => setBulkBlockNotificationMethod(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] font-bold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="both">Email & System Notification</option>
                  <option value="email">Email Only</option>
                  <option value="system">System Notification Only</option>
                  <option value="none">Do Not Notify</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
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
                    <Ban className="w-4 h-4" />
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
