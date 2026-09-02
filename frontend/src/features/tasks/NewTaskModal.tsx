"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Users, Check, Calendar, Tag, Building2, Flag } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { AssignedUser } from "@/types/auth";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewTaskModal = ({ isOpen, onClose, onSuccess }: NewTaskModalProps) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<AssignedUser[]>([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
    department: "Engineering",
    tags: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const email = emp.email.toLowerCase();
    const query = employeeSearch.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      setLoading(true);
      await api.post("/tasks", {
        ...formData,
        assignedTo: selectedAssignees,
      });
      toast.success("Task created and assigned successfully!");
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-[18px] font-extrabold text-slate-900 dark:text-white">
              Create & Assign Task
            </h2>
            <p className="text-[12px] font-semibold text-slate-500 mt-0.5">
              Assign task to single employee or a team group
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
              placeholder="E.g., Implement OAuth & Two-Factor Authentication"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-[14px] font-semibold focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF] transition-all outline-none"
              required
            />
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
              placeholder="Provide context, objectives, and deliverables for this task..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-[13.5px] font-medium focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF] transition-all outline-none resize-none"
            />
          </div>

          {/* Assign Employees Section (Single or Group) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300">
                Assign Employees <span className="text-slate-400 font-medium">({selectedAssignees.length} selected)</span>
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
            <div className="max-h-36 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-1">
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
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {emp.department || "General"} · {emp.role || "Employee"}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-[13.5px] font-semibold focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF] transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#5B5FEF]" /> Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="E.g., Engineering"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-[13.5px] font-semibold focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF] transition-all outline-none"
              />
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
