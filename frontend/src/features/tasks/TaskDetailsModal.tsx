"use client";

import { X, Calendar, Building2, Flag, User as UserIcon, Tag, CheckCircle2, Clock, PlayCircle, AlertCircle } from "lucide-react";
import { Task, AssignedUser } from "@/types/auth";
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (taskId: string, newStatus: string) => void;
}

export const TaskDetailsModal = ({
  task,
  isOpen,
  onClose,
  onStatusUpdated,
}: TaskDetailsModalProps) => {
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !task) return null;

  const assignees = (task.assignedTo || []).filter(
    (a): a is AssignedUser => typeof a !== "string",
  );

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "completed";

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true);
      await api.patch(`/tasks/${task._id}`, { status: newStatus });
      onStatusUpdated(task._id, newStatus);
      toast.success("Task progress updated successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg font-mono text-[12px] font-extrabold bg-[#5B5FEF]/10 text-[#5B5FEF]">
              {task.taskCode || "TSK"}
            </span>
            <div>
              <h2 className="text-[17px] font-extrabold text-slate-900 dark:text-white">
                Task Overview
              </h2>
              <p className="text-[12px] font-semibold text-slate-500 mt-0.5">
                Assigned task details & progress status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Title & Description */}
          <div>
            <h3 className="text-[18px] font-black text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h3>
            <p className="text-[13.5px] text-slate-600 dark:text-slate-300 font-medium mt-2 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              {task.description || "No specific instructions provided for this task."}
            </p>
          </div>

          {/* Quick Status Control for Employee */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <label className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-2">
              Update Your Task Progress
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "todo", label: "To Do", icon: Clock, color: "hover:bg-amber-100 hover:text-amber-700", active: "bg-amber-500 text-white" },
                { id: "in_progress", label: "In Progress", icon: PlayCircle, color: "hover:bg-sky-100 hover:text-sky-700", active: "bg-sky-500 text-white" },
                { id: "review", label: "In Review", icon: AlertCircle, color: "hover:bg-purple-100 hover:text-purple-700", active: "bg-purple-500 text-white" },
                { id: "completed", label: "Completed", icon: CheckCircle2, color: "hover:bg-emerald-100 hover:text-emerald-700", active: "bg-emerald-500 text-white" },
              ].map((s) => {
                const Icon = s.icon;
                const isCurrent = task.status === s.id;
                return (
                  <button
                    key={s.id}
                    disabled={updating}
                    onClick={() => handleStatusChange(s.id)}
                    className={`px-2.5 py-2 rounded-xl text-[12px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isCurrent
                        ? s.active + " shadow-sm scale-102"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 " + s.color
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3.5 text-[13px]">
            {/* Priority */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Flag className="w-3 h-3 text-[#5B5FEF]" /> Priority Level
              </span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200 capitalize">
                {task.priority || "Medium"} Priority
              </p>
            </div>

            {/* Due Date */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#5B5FEF]" /> Due Date
              </span>
              <p className={`font-extrabold ${isOverdue ? "text-red-500" : "text-slate-800 dark:text-slate-200"}`}>
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "No Deadline"}
                {isOverdue && <span className="text-[10px] ml-1 uppercase">(Overdue)</span>}
              </p>
            </div>

            {/* Department */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#5B5FEF]" /> Department
              </span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200">
                {task.department || "Engineering"}
              </p>
            </div>

            {/* Assigned By */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <UserIcon className="w-3 h-3 text-[#5B5FEF]" /> Assigned By
              </span>
              <p className="font-extrabold text-slate-800 dark:text-slate-200">
                {typeof task.createdBy === "object" && task.createdBy?.firstName
                  ? `${task.createdBy.firstName} ${task.createdBy.lastName || ""}`
                  : "Administrator"}
              </p>
            </div>
          </div>

          {/* Group Team Members */}
          {assignees.length > 0 && (
            <div>
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Team Assignees ({assignees.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {assignees.map((emp) => (
                  <div
                    key={emp._id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[12.5px] font-bold text-slate-800 dark:text-slate-200"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-[#5B5FEF] flex items-center justify-center text-[9px] font-extrabold overflow-hidden">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                      ) : (
                        emp.firstName?.[0] || "E"
                      )}
                    </div>
                    <span>{emp.firstName} {emp.lastName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#5B5FEF]" /> Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[11.5px] font-bold bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white text-[13.5px] font-extrabold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
