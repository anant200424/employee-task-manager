"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Check, Calendar, Tag, Building2, Flag, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { AssignedUser } from "@/types/auth";
import {
  validateTaskTitle,
  validateTaskDescription,
  validateTaskDueDate,
  validateDepartment,
  validateAssignees,
} from "@/lib/validation";
import { useAutosave } from "@/hooks/useAutosave";
import { AutosaveBadge } from "@/components/ui/AutosaveBadge";
import { useAuth } from "@/context/AuthContext";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewTaskModal = ({ isOpen, onClose, onSuccess }: NewTaskModalProps) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<AssignedUser[]>([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
    department: "Engineering",
    tags: "",
  });

  // Autosave Draft Hook
  const {
    status: autosaveStatus,
    lastSaved,
    getSavedDraft,
    clearDraft,
  } = useAutosave({
    key: "nexus_draft_new_task",
    data: formData,
    debounceMs: 1500,
    enabled: isOpen && (formData.title.trim().length > 0 || formData.description.trim().length > 0),
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
      setErrors({});

      // Restore saved draft if form is currently blank
      const draft = getSavedDraft();
      if (draft && draft.title && !formData.title) {
        setFormData((prev) => ({ ...prev, ...draft }));
        toast.success("Restored unsaved task draft", { id: "draft-restored" });
      }
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const res = await api.get("/users");
      if (res.data?.data?.users) {
        setEmployees(res.data.data.users);
      }
    } catch (err) {
      console.error("Failed to load employees", err);
    } finally {
      setFetchingEmployees(false);
    }
  };

  if (!isOpen) return null;

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case "title":
        return validateTaskTitle(value);
      case "description":
        return validateTaskDescription(value);
      case "department":
        return validateDepartment(value);
      case "dueDate":
        return validateTaskDueDate(value);
      case "assignedTo":
        return validateAssignees(value);
      default:
        return undefined;
    }
  };

  const handleBlur = (name: string) => {
    let val: any = formData[name as keyof typeof formData];
    if (name === "assignedTo") val = selectedAssignees;
    const error = validateField(name, val);
    setErrors((prev) => ({
      ...prev,
      [name]: error || "",
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const liveErr = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: liveErr || "" }));
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) => {
      const next = prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId];
      if (errors.assignedTo) {
        const assignErr = validateAssignees(next);
        setErrors((p) => ({ ...p, assignedTo: assignErr || "" }));
      }
      return next;
    });
  };

  const isCallerSuperAdmin =
    currentUser?.systemRole === "super_admin" ||
    currentUser?.role?.toLowerCase() === "superadmin" ||
    currentUser?.role?.toLowerCase() === "super_admin";

  const isTargetAdminOrSuperAdmin = (emp: AssignedUser) => {
    const sRole = emp.systemRole?.toLowerCase() || "";
    const role = emp.role?.toLowerCase() || "";
    return (
      sRole === "super_admin" ||
      sRole === "admin" ||
      sRole === "system_admin" ||
      role.includes("admin") ||
      role.includes("superadmin")
    );
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!isCallerSuperAdmin && isTargetAdminOrSuperAdmin(emp)) {
      return false;
    }
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const email = emp.email.toLowerCase();
    const query = employeeSearch.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const titleErr = validateField("title", formData.title);
    if (titleErr) errs.title = titleErr;

    const descErr = validateField("description", formData.description);
    if (descErr) errs.description = descErr;

    const deptErr = validateField("department", formData.department);
    if (deptErr) errs.department = deptErr;

    const dateErr = validateField("dueDate", formData.dueDate);
    if (dateErr) errs.dueDate = dateErr;

    const assignErr = validateField("assignedTo", selectedAssignees);
    if (assignErr) errs.assignedTo = assignErr;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please resolve the required form fields before submitting.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/tasks", {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        department: formData.department.trim(),
        assignedTo: selectedAssignees,
      });
      toast.success("Task created and assigned successfully!");
      clearDraft();
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        dueDate: "",
        department: "Engineering",
        tags: "",
      });
      setSelectedAssignees([]);
      setErrors({});
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="glass-modal rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-white/60 dark:border-slate-800 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-white">
                Create & Assign Task
              </h2>
              <AutosaveBadge status={autosaveStatus} lastSaved={lastSaved} />
            </div>
            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">
              Assign task to single employee or a team group (draft auto-saves)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Task Title */}
          <div>
            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onBlur={() => handleBlur("title")}
              placeholder="E.g., Implement OAuth & Two-Factor Authentication"
              className={`w-full px-4 py-2.5 rounded-xl text-slate-900 dark:text-white text-[14px] font-semibold outline-none transition-all ${
                errors.title
                  ? "bg-red-50/40 dark:bg-red-950/20 border border-red-500/80 focus:border-red-500 ring-1 ring-red-500/20"
                  : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF]"
              }`}
            />
            {errors.title && (
              <p className="text-[11.5px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={() => handleBlur("description")}
              placeholder="Provide context, objectives, and deliverables for this task..."
              rows={2}
              className={`w-full px-4 py-2.5 rounded-xl text-slate-900 dark:text-white text-[13.5px] font-medium outline-none resize-none transition-all ${
                errors.description
                  ? "bg-red-50/40 dark:bg-red-950/20 border border-red-500/80 focus:border-red-500 ring-1 ring-red-500/20"
                  : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF]"
              }`}
            />
            {errors.description && (
              <p className="text-[11.5px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          {/* Assign Employees Section (Single or Group) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300">
                Assign Employees <span className="text-red-500">*</span> <span className="text-slate-400 font-medium">({selectedAssignees.length} selected)</span>
              </label>
              {selectedAssignees.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedAssignees([])}
                  className="text-[11.5px] font-bold text-red-500 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Employee Search Box */}
            <input
              type="text"
              placeholder="Search employee by name or email..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="w-full px-3.5 py-2 mb-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-[13px] font-medium text-slate-900 dark:text-white focus:border-[#5B5FEF] focus:outline-none"
            />

            {/* Employee Selection List */}
            <div className={`max-h-36 overflow-y-auto custom-scrollbar rounded-xl divide-y divide-slate-100 dark:divide-slate-800 p-1 transition-all ${
              errors.assignedTo
                ? "bg-red-50/20 dark:bg-red-950/10 border border-red-500/80"
                : "bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700"
            }`}>
              {fetchingEmployees ? (
                <div className="p-3 text-center text-[12px] text-slate-400">Loading employees...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-3 text-center text-[12px] text-slate-400">No employees found.</div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedAssignees.includes(emp._id);
                  return (
                    <div
                      key={emp._id}
                      onClick={() => toggleAssignee(emp._id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#EEF0FF] dark:bg-[#5B5FEF]/20 text-[#5B5FEF]"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-[#5B5FEF] dark:bg-indigo-900/30 flex items-center justify-center font-bold text-[11px] shrink-0 overflow-hidden">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                          ) : (
                            `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold truncate">
                            {emp.firstName} {emp.lastName}{" "}
                            {emp.employeeId && <span className="text-[11px] text-slate-400 font-normal">({emp.employeeId})</span>}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                            <span>{emp.department || "General"} · {emp.role || "Employee"}</span>
                            {(emp.systemRole === "manager" || (emp.systemRole !== "employee" && emp.role && emp.role.toLowerCase().includes("manager"))) && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                Manager
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? "bg-[#5B5FEF] border-[#5B5FEF] text-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {errors.assignedTo && (
              <p className="text-[11.5px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.assignedTo}</span>
              </p>
            )}
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-[#5B5FEF]" /> Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-[13.5px] font-bold focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF] transition-all outline-none cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-[13.5px] font-bold focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF] transition-all outline-none cursor-pointer"
              >
                <option value="todo">Pending (To Do)</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date & Department */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#5B5FEF]" /> Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                onBlur={() => handleBlur("dueDate")}
                className={`w-full px-3.5 py-2.5 rounded-xl text-slate-900 dark:text-white text-[13.5px] font-semibold outline-none transition-all ${
                  errors.dueDate
                    ? "bg-red-50/40 dark:bg-red-950/20 border border-red-500/80 focus:border-red-500 ring-1 ring-red-500/20"
                    : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF]"
                }`}
              />
              {errors.dueDate && (
                <p className="text-[11.5px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.dueDate}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#5B5FEF]" /> Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                onBlur={() => handleBlur("department")}
                placeholder="E.g., Engineering"
                className={`w-full px-3.5 py-2.5 rounded-xl text-slate-900 dark:text-white text-[13.5px] font-semibold outline-none transition-all ${
                  errors.department
                    ? "bg-red-50/40 dark:bg-red-950/20 border border-red-500/80 focus:border-red-500 ring-1 ring-red-500/20"
                    : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF]"
                }`}
              />
              {errors.department && (
                <p className="text-[11.5px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1 mt-1.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.department}</span>
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#5B5FEF]" /> Tags (comma separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="E.g., Security, Backend, Sprint-Q3"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-[13.5px] font-semibold focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF] transition-all outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5B5FEF] hover:bg-[#4A4EDC] text-white py-3.5 rounded-xl text-[14.5px] font-extrabold shadow-[0_4px_14px_rgba(91,95,239,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Assigning Task..." : "Create & Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
