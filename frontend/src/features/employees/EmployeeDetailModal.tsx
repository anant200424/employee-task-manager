"use client";

import { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Briefcase,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { api } from "@/lib/api";
import { Task } from "@/types/auth";
import { toast } from "react-hot-toast";

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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  if (!isOpen || !userId) return null;

  const user = data?.user;
  const stats = data?.stats;
  const tasks: Task[] = data?.tasks || [];

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-lg font-black shrink-0 overflow-hidden border-2 border-white shadow-xs">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
                      ) : (
                        `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[17px] font-black text-slate-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </h3>
                        {user.isBlocked ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-red-500 text-white shadow-xs">
                            BLOCKED / SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-500 text-white shadow-xs">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        {user.role} · {user.department || "General"} · <span className="font-mono">{user.employeeId}</span>
                      </p>
                      <div className="flex items-center gap-3 text-[12px] text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{user.email}</span>
                        {user.phoneNumber && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{user.dialCode} {user.phoneNumber}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Block */}
                  <div className="flex items-center gap-2">
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
                              phone: `${user.dialCode || ""} ${user.phoneNumber || ""}`.trim(),
                              status: user.isBlocked ? "Blocked" : "Active",
                              isBlocked: Boolean(user.isBlocked),
                              avatarUrl: user.avatarUrl,
                            });
                          }
                        }}
                        className="px-3.5 py-2.5 rounded-xl text-[13px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                        title="Edit Employee Credentials"
                      >
                        <Edit2 className="w-4 h-4 text-sky-500" />
                        <span>Edit</span>
                      </button>
                    )}

                    {/* Block / Unblock Action Button */}
                    <button
                      onClick={handleToggleBlock}
                      disabled={actionLoading}
                      className={`px-4 py-2.5 rounded-xl text-[13px] font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95 disabled:opacity-50 shrink-0 ${
                        user.isBlocked
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-rose-600 hover:bg-rose-700 text-white"
                      }`}
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
    </div>
  );
};
