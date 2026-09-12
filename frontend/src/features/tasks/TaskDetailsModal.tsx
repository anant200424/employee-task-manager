"use client";

import { useEffect, useState } from "react";
import {
  X,
  Calendar,
  Building2,
  Flag,
  User as UserIcon,
  Tag,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Layers,
  MessageSquare,
  Plus,
  Send,
  CheckSquare,
  ListTodo,
  History,
  Loader2,
  Edit2,
} from "lucide-react";
import { Task, AssignedUser, TaskComment, TaskChecklistItem } from "@/types/auth";
import { api, taskApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (taskId: string, newStatus: string) => void;
  onTaskUpdated?: (task: Task) => void;
  onEdit?: (task: Task) => void;
}

export const TaskDetailsModal = ({
  task,
  isOpen,
  onClose,
  onStatusUpdated,
  onTaskUpdated,
  onEdit,
}: TaskDetailsModalProps) => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"details" | "checklist" | "comments" | "activity">("details");

  // Local mutable state for instant feedback
  const [localChecklist, setLocalChecklist] = useState<TaskChecklistItem[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [addingChecklist, setAddingChecklist] = useState(false);

  const [localComments, setLocalComments] = useState<TaskComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setLocalChecklist(task.checklist || []);
      setLocalComments(task.comments || []);
    }
  }, [task]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  // Checklist Actions
  const handleToggleChecklist = async (itemId: string) => {
    if (!task._id) return;
    const previous = localChecklist;
    // Optimistic toggle
    const updated = localChecklist.map((item) =>
      item._id === itemId ? { ...item, completed: !item.completed } : item
    );
    setLocalChecklist(updated);

    try {
      await taskApi.toggleChecklistItem(task._id, itemId);
      if (onTaskUpdated) {
        onTaskUpdated({ ...task, checklist: updated });
      }
    } catch (err: any) {
      setLocalChecklist(previous);
      toast.error(err.response?.data?.message || "Failed to toggle checklist item");
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !task._id) return;
    const title = newChecklistTitle.trim();
    setNewChecklistTitle("");
    setAddingChecklist(true);

    try {
      const res = await taskApi.addChecklistItem(task._id, title);
      const updatedList = res?.checklist || [
        ...localChecklist,
        { title, completed: false, _id: Date.now().toString() },
      ];
      setLocalChecklist(updatedList);
      if (onTaskUpdated) {
        onTaskUpdated({ ...task, checklist: updatedList });
      }
      toast.success("Checklist item added");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add checklist item");
    } finally {
      setAddingChecklist(false);
    }
  };

  // Comment Actions
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !task._id) return;
    const text = newCommentText.trim();
    setNewCommentText("");
    setSubmittingComment(true);

    const optimisticComment: TaskComment = {
      _id: Date.now().toString(),
      authorName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Team Member",
      authorAvatar: user?.avatarUrl,
      text,
      createdAt: new Date().toISOString(),
    };
    setLocalComments((prev) => [...prev, optimisticComment]);

    try {
      const saved = await taskApi.addComment(task._id, text);
      const confirmed = saved || optimisticComment;
      setLocalComments((prev) =>
        prev.map((c) => (c._id === optimisticComment._id ? confirmed : c))
      );
      if (onTaskUpdated) {
        onTaskUpdated({
          ...task,
          comments: [...localComments.filter((c) => c._id !== optimisticComment._id), confirmed],
        });
      }
      toast.success("Comment added!");
    } catch (err: any) {
      setLocalComments((prev) => prev.filter((c) => c._id !== optimisticComment._id));
      toast.error(err.response?.data?.message || "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const completedChecklistCount = localChecklist.filter((c) => c.completed).length;
  const checklistProgress =
    localChecklist.length > 0
      ? Math.round((completedChecklistCount / localChecklist.length) * 100)
      : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
      case "in_progress":
        return "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800";
      case "review":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
      case "todo":
      default:
        return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800";
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[28px] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/40 backdrop-blur-xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 rounded-lg font-mono text-[12px] font-extrabold bg-[#5B5FEF]/10 text-[#5B5FEF] dark:bg-[#5B5FEF]/20 dark:text-[#818CF8] shrink-0">
              {task.taskCode || "TSK"}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[17px] font-black text-slate-900 dark:text-white leading-tight truncate">
                  Enterprise Task Workspace
                </h2>
                <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-extrabold capitalize ${getStatusBadge(task.status)}`}>
                  {task.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-[11.5px] font-semibold text-slate-500 mt-0.5 truncate">
                Lifecycle, verification checklist, & team collaboration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
            title="Close (Esc)"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto custom-scrollbar">
            {[
              { id: "details", label: "Overview", icon: Layers },
              { id: "checklist", label: `Checklist (${completedChecklistCount}/${localChecklist.length})`, icon: ListTodo },
              { id: "comments", label: `Discussion (${localComments.length})`, icon: MessageSquare },
              { id: "activity", label: "Audit Trail", icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#5B5FEF]/10 text-[#5B5FEF] dark:bg-[#5B5FEF]/20 dark:text-indigo-300 font-extrabold shadow-2xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Drawer Body - Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {activeSubTab === "details" && (
              <>
                {/* Title & Description */}
                <div>
                  <h3 className="text-[19px] font-black text-slate-900 dark:text-white leading-snug">
                    {task.title}
                  </h3>
                  <div className="mt-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Description & Scope
                    </span>
                    <p className="text-[13.5px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                      {task.description || "No specific instructions provided for this task."}
                    </p>
                  </div>
                </div>

                {/* Quick Status Progress Control */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                  <label className="block text-[12.5px] font-bold text-slate-800 dark:text-slate-200 mb-2.5">
                    Update Task Lifecycle Stage
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "todo", label: "To Do", icon: Clock, color: "hover:bg-amber-100 hover:text-amber-700", active: "bg-amber-500 text-white shadow-xs" },
                      { id: "in_progress", label: "In Progress", icon: PlayCircle, color: "hover:bg-sky-100 hover:text-sky-700", active: "bg-sky-500 text-white shadow-xs" },
                      { id: "review", label: "In Review", icon: AlertCircle, color: "hover:bg-purple-100 hover:text-purple-700", active: "bg-purple-500 text-white shadow-xs" },
                      { id: "completed", label: "Completed", icon: CheckCircle2, color: "hover:bg-emerald-100 hover:text-emerald-700", active: "bg-emerald-500 text-white shadow-xs" },
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
                              ? s.active + " scale-102"
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

                {/* Details Grid (Priority, Due Date, Department, Assigned By) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[13px]">
                  {/* Priority */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Flag className="w-3 h-3 text-[#5B5FEF]" /> Priority Level
                    </span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200 capitalize">
                      {task.priority || "Medium"} Priority
                    </p>
                  </div>

                  {/* Due Date */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
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
                      {isOverdue && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[10px] font-extrabold uppercase">
                          Overdue
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Department */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#5B5FEF]" /> Department
                    </span>
                    <p className="font-extrabold text-slate-800 dark:text-slate-200">
                      {task.department || "Engineering"}
                    </p>
                  </div>

                  {/* Assigned By */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
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

                {/* Team Assignees */}
                {assignees.length > 0 && (
                  <div>
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#5B5FEF]" />
                      <span>Team Assignees ({assignees.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {assignees.map((emp) => (
                        <div
                          key={emp._id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[12.5px] font-bold text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-[#5B5FEF] flex items-center justify-center text-[9px] font-extrabold overflow-hidden">
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
              </>
            )}

            {/* CHECKLIST SUBTAB */}
            {activeSubTab === "checklist" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[15px] font-black text-slate-900 dark:text-white">
                      Definition of Done Checklist
                    </h4>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {completedChecklistCount} of {localChecklist.length} criteria satisfied ({checklistProgress}%)
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5B5FEF] to-emerald-500 transition-all duration-300"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>

                {/* Checklist items list */}
                <div className="space-y-2">
                  {localChecklist.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <ListTodo className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                        No checklist criteria yet
                      </p>
                      <p className="text-[11.5px] text-slate-400 mt-0.5">
                        Add actionable checklist items below to track granular completion.
                      </p>
                    </div>
                  ) : (
                    localChecklist.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => item._id && handleToggleChecklist(item._id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          item.completed
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 text-slate-500 dark:text-slate-400"
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#5B5FEF]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                            item.completed
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                          }`}
                        >
                          {item.completed && <CheckSquare className="w-3.5 h-3.5" />}
                        </div>
                        <span
                          className={`text-[13px] font-bold flex-1 ${
                            item.completed ? "line-through opacity-70" : ""
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Checklist Form */}
                <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="Add a new checklist step..."
                    className="flex-1 px-3.5 py-2 rounded-xl text-[13px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B5FEF]"
                  />
                  <button
                    type="submit"
                    disabled={addingChecklist || !newChecklistTitle.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white text-[12.5px] font-bold disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {addingChecklist ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Add</span>
                  </button>
                </form>
              </div>
            )}

            {/* COMMENTS SUBTAB */}
            {activeSubTab === "comments" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[15px] font-black text-slate-900 dark:text-white">
                    Team Discussion & Notes
                  </h4>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Collaborate with assignees and document progress decisions
                  </p>
                </div>

                {/* Comments List */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                  {localComments.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                        No discussion yet
                      </p>
                      <p className="text-[11.5px] text-slate-400 mt-0.5">
                        Post the first message to coordinate on this task.
                      </p>
                    </div>
                  ) : (
                    localComments.map((comment, idx) => (
                      <div
                        key={comment._id || idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#5B5FEF]/10 text-[#5B5FEF] dark:bg-[#5B5FEF]/30 dark:text-indigo-300 flex items-center justify-center text-[10px] font-black overflow-hidden">
                              {comment.authorAvatar ? (
                                <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                comment.authorName?.[0] || "U"
                              )}
                            </div>
                            <span className="text-[12.5px] font-extrabold text-slate-900 dark:text-white">
                              {comment.authorName}
                            </span>
                          </div>
                          <span className="text-[10.5px] font-bold text-slate-400">
                            {comment.createdAt
                              ? new Date(comment.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </span>
                        </div>
                        <p className="text-[13px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap pl-8">
                          {comment.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* New Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Type a team message or update..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-[13px] font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-[#5B5FEF]"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newCommentText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white text-[12.5px] font-bold disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}

            {/* ACTIVITY LOG SUBTAB */}
            {activeSubTab === "activity" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[15px] font-black text-slate-900 dark:text-white">
                    Deliverable Audit History
                  </h4>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Immutable chronological record of changes and events
                  </p>
                </div>

                <div className="space-y-3">
                  {(!task.activityLog || task.activityLog.length === 0) ? (
                    <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                        No recorded lifecycle activity
                      </p>
                      <p className="text-[11.5px] text-slate-400 mt-0.5">
                        Lifecycle status changes and updates will be logged here.
                      </p>
                    </div>
                  ) : (
                    task.activityLog.map((log, idx) => (
                      <div
                        key={log._id || idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-750"
                      >
                        <div className="w-2 h-2 rounded-full bg-[#5B5FEF] mt-1.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12.5px] font-extrabold text-slate-800 dark:text-slate-200">
                              {log.performerName || "System Actor"}
                            </span>
                            <span className="text-[10.5px] font-bold text-slate-400">
                              {new Date(log.timestamp).toLocaleString("en-GB", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                            {log.details || log.action}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Pinned Footer */}
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 backdrop-blur-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-slate-400 text-[11.5px] font-medium hidden sm:flex">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Last updated {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "recently"}
              </span>
              <span className="text-slate-300 dark:text-slate-700">&bull;</span>
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono">Esc</kbd> to exit</span>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[12.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#5B5FEF]" />
                  <span>Edit Task</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#5B5FEF] hover:bg-[#4d51db] text-white text-[12.5px] font-extrabold transition-all cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};
