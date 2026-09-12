"use client";

import { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  Loader2,
  Lock,
  Unlock,
  Award,
} from "lucide-react";
import { api } from "@/lib/api";
import { Task } from "@/types/auth";
import { toast } from "react-hot-toast";
import { SendEmailModal } from "./SendEmailModal";
import { useAuth } from "@/context/AuthContext";

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  onUserUpdated: () => void;
  onEdit?: (user: any) => void;
}

export const EmployeeDetailModal = ({
  isOpen,
  onClose,
  userId,
  onUserUpdated,
  onEdit,
}: EmployeeDetailModalProps) => {
  const { user: currentUser } = useAuth();
  const isCallerSuperAdmin =
    currentUser?.systemRole === "super_admin" ||
    String(currentUser?.role || "").toLowerCase().includes("super") ||
    currentUser?.email === "superadmin@empsphere.io" ||
    currentUser?.email === "anantsingh20334411@gmail.com";

  const isCallerSystemAdmin =
    currentUser?.systemRole === "system_admin" ||
    String(currentUser?.role || "").toLowerCase().includes("system");

  const canManageRoles = isCallerSuperAdmin || isCallerSystemAdmin;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const fetchPerformance = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await api.get(`/users/${userId}/performance`);
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err: any) {
      toast.error("Failed to load employee details & task history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchPerformance();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !userId) return null;

  const user = data?.user;
  const stats = data?.stats;
  const tasks: Task[] = data?.tasks || [];

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

  const handleToggleBlock = async () => {
    if (!user) return;
    try {
      setActionLoading(true);
      if (user.isBlocked) {
        await api.patch(`/users/${user._id}/unblock`);
        toast.success(`Unblocked ${user.firstName} ${user.lastName}`);
      } else {
        await api.patch(`/users/${user._id}/block`, {
          reason: "Suspended by administrator via employee management hub",
        });
        toast.success(`Blocked ${user.firstName} ${user.lastName}`);
      }
      await fetchPerformance();
      onUserUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleManagerRole = async () => {
    if (!user) return;
    if (!canManageRoles) {
      toast.error("Enterprise Governance Lock: Only administrators have authority to appoint or change employee roles.");
      return;
    }
    const sysRole = String(user.systemRole || "").toLowerCase();
    const roleStr = String(user.role || "").toLowerCase();
    if (sysRole === "admin" || sysRole === "system_admin" || roleStr.includes("admin") || roleStr.includes("super")) {
      toast.error("Manager promotion is not applicable for Administrator accounts.");
      return;
    }

    try {
      setPromoting(true);
      const isAlreadyManager =
        sysRole === "manager" ||
        (sysRole !== "employee" && (roleStr.includes("manager") || roleStr.includes("lead")));

      let nextRole = "Software Engineer";
      const dept = (user.department || "").toLowerCase();
      if (!isAlreadyManager) {
        // Appointing as manager
        if (dept.includes("eng")) nextRole = "Engineering Manager";
        else if (dept.includes("des")) nextRole = "Design Lead";
        else if (dept.includes("prod")) nextRole = "Product Manager";
        else if (dept.includes("hr") || dept.includes("human")) nextRole = "HR Manager";
        else if (dept.includes("mark")) nextRole = "Marketing Manager";
        else if (dept.includes("fin")) nextRole = "Finance Manager";
        else if (dept.includes("oper")) nextRole = "Operations Manager";
        else nextRole = "Department Manager";
      } else {
        // Reverting to staff contributor
        if (dept.includes("eng")) nextRole = "Software Engineer";
        else if (dept.includes("des")) nextRole = "UI/UX Designer";
        else if (dept.includes("prod")) nextRole = "Business Analyst";
        else if (dept.includes("hr") || dept.includes("human")) nextRole = "HR Specialist";
        else if (dept.includes("mark")) nextRole = "Marketing Specialist";
        else if (dept.includes("fin")) nextRole = "Financial Analyst";
        else if (dept.includes("oper")) nextRole = "Operations Coordinator";
        else nextRole = "Software Engineer";
      }
      const nextSystemRole = isAlreadyManager ? "employee" : "manager";

      await api.patch(`/users/${user._id}`, {
        role: nextRole,
        systemRole: nextSystemRole,
      });

      toast.success(
        isAlreadyManager
          ? `${user.firstName} reassigned to Staff Contributor.`
          : `🎉 ${user.firstName} successfully appointed as Department Manager!`
      );
      await fetchPerformance();
      onUserUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update member role.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-[28px] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header Bar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                user?.isBlocked
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                  : "bg-indigo-50 text-[#5B5FEF] dark:bg-indigo-950/40 dark:text-indigo-400"
              }`}
            >
              {user?.isBlocked ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-[18px] font-black text-slate-900 dark:text-white">
                Employee Profile & Task History
              </h2>
              <p className="text-[12px] font-medium text-slate-500">
                Complete performance insights and assignments
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5B5FEF]" />
              <p className="text-sm font-semibold text-slate-500">Loading performance data...</p>
            </div>
          ) : user ? (
            <>
              {/* Employee Summary Card */}
              <div
                className={`p-5 rounded-2xl border ${
                  user.isBlocked
                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-black shrink-0 overflow-hidden border-2 border-white dark:border-slate-800 shadow-xs">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
                      ) : (
                        `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[17px] font-black text-slate-900 dark:text-white truncate">
                          {user.firstName} {user.lastName}
                        </h3>
                        {user.isBlocked ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-red-500 text-white shadow-xs shrink-0">
                            BLOCKED / SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-500 text-white shadow-xs shrink-0">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate">
                        {formatRoleTitle(user.role)} · {user.department || "General"} · <span className="font-mono">{user.employeeId}</span>
                      </p>
                      <div className="flex items-center gap-3 text-[12px] text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 shrink-0"><Mail className="w-3 h-3 text-slate-400 shrink-0" />{user.email}</span>
                        {user.phoneNumber && <span className="flex items-center gap-1 shrink-0"><Phone className="w-3 h-3 text-slate-400 shrink-0" />{(user.dialCode && user.phoneNumber.includes(user.dialCode)) ? user.phoneNumber : `${user.dialCode || ""} ${user.phoneNumber}`.trim()}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Appoint Manager, Edit, Email & Block */}
                  <div className="flex items-center gap-2 flex-wrap md:justify-end shrink-0">
                    {/* Appoint / Revert Department Manager Action Button (Super Admin & System Admin Governance) */}
                    {canManageRoles && !String(user.systemRole || "").includes("admin") && !String(user.role || "").toLowerCase().includes("admin") && (() => {
                      const isCurrentManager =
                        user.systemRole === "manager" ||
                        (user.systemRole !== "employee" && (user.role?.toLowerCase().includes("manager") || user.role?.toLowerCase().includes("lead")));

                      return (
                        <button
                          type="button"
                          onClick={handleToggleManagerRole}
                          disabled={promoting}
                          className={`px-3 py-2 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50 shrink-0 ${
                            isCurrentManager
                              ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/60"
                              : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60"
                          }`}
                          title={
                            isCurrentManager
                              ? "Revert Manager to Staff Member"
                              : "Appoint as Department Manager"
                          }
                        >
                          {promoting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Award className="w-4 h-4 text-amber-500" />
                          )}
                          <span>
                            {isCurrentManager ? "Revert to Staff" : "Appoint Manager"}
                          </span>
                        </button>
                      );
                    })()}
                    {onEdit && (
                      <button
                        onClick={() => {
                          if (user) {
                            onEdit({
                              id: user._id,
                              name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                              firstName: user.firstName,
                              lastName: user.lastName,
                              role: user.role,
                              department: user.department,
                              employeeId: user.employeeId,
                              email: user.email,
                              phone: (user.dialCode && user.phoneNumber?.includes(user.dialCode)) ? user.phoneNumber : `${user.dialCode || ""} ${user.phoneNumber || ""}`.trim(),
                              status: user.isBlocked ? "Blocked" : "Active",
                              isBlocked: Boolean(user.isBlocked),
                              avatarUrl: user.avatarUrl,
                            });
                          }
                        }}
                        className="px-3 py-2 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shrink-0"
                        title="Edit Employee Credentials"
                      >
                        <Edit2 className="w-4 h-4 text-sky-500" />
                        <span>Edit</span>
                      </button>
                    )}

                    {/* Send Email Action Button */}
                    <button
                      onClick={() => setIsEmailModalOpen(true)}
                      className="px-3 py-2 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all bg-purple-50 dark:bg-purple-950/40 border border-purple-200/90 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 shrink-0"
                      title="Send Direct Email to Employee via SMTP"
                    >
                      <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Email</span>
                    </button>

                    {/* Block / Unblock Action Button */}
                    <button
                      onClick={handleToggleBlock}
                      disabled={actionLoading}
                      className={`px-3.5 py-2 rounded-xl text-[12px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50 shrink-0 ${
                        user.isBlocked
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-rose-600 hover:bg-rose-700 text-white"
                      }`}
                      title={user.isBlocked ? "Restore Employee Access" : "Suspend / Block Employee"}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : user.isBlocked ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          <span>Unblock</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Block</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>


                {user.isBlocked && user.blockedReason && (
                  <div className="mt-3.5 pt-3 border-t border-rose-200/60 dark:border-rose-900/40 text-[12px] text-rose-700 dark:text-rose-300 font-medium">
                    <strong>Suspension Note:</strong> {user.blockedReason}
                    {user.blockedAt && <span> · Blocked on {new Date(user.blockedAt).toLocaleDateString("en-GB")}</span>}
                  </div>
                )}
              </div>

              {/* 4 Performance Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-indigo-500 mb-1">
                    <ListTodo className="w-4 h-4" />
                    <span className="text-[11px] font-extrabold uppercase text-slate-400">Total</span>
                  </div>
                  <p className="text-[20px] font-black text-slate-900 dark:text-white">{stats?.totalTasks || 0}</p>
                  <p className="text-[11px] font-bold text-slate-400">Assigned Tasks</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-500 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[11px] font-extrabold uppercase text-slate-400">Done</span>
                  </div>
                  <p className="text-[20px] font-black text-slate-900 dark:text-white">{stats?.completedTasks || 0}</p>
                  <p className="text-[11px] font-bold text-slate-400">Completed</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-sky-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-[11px] font-extrabold uppercase text-slate-400">Active</span>
                  </div>
                  <p className="text-[20px] font-black text-slate-900 dark:text-white">{stats?.inProgressTasks || 0}</p>
                  <p className="text-[11px] font-bold text-slate-400">In Progress</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                  <div className="flex items-center justify-between text-purple-500 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-[11px] font-extrabold uppercase text-slate-400">Rate</span>
                  </div>
                  <p className="text-[20px] font-black text-slate-900 dark:text-white">{stats?.productivity || "0%"}</p>
                  <p className="text-[11px] font-bold text-slate-400">Productivity</p>
                </div>
              </div>

              {/* Assigned Tasks History */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Assigned Task History ({tasks.length})
                  </h4>
                </div>

                {tasks.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-400">
                    <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No tasks assigned to this employee yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {tasks.map((task) => (
                      <div
                        key={task._id}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11.5px] font-black font-mono text-[#5B5FEF]">
                              {task.taskCode || "TSK"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                task.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : task.status === "in_progress"
                                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                              }`}
                            >
                              {task.status?.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-[13.5px] font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                            {task.title}
                          </p>
                        </div>

                        {task.dueDate && (
                          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                            Due {new Date(task.dueDate).toLocaleDateString("en-GB")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-slate-400">Employee not found.</p>
          )}
        </div>
      </div>

      {/* Send Email Modal */}
      {user && (
        <SendEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          recipients={[
            {
              id: user._id,
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
              email: user.email,
              role: user.role,
              department: user.department,
              employeeId: user.employeeId,
              avatarUrl: user.avatarUrl,
            },
          ]}
        />
      )}
    </div>
  );
};
